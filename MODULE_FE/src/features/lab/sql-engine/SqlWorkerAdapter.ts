import type {
  SqlEngineAdapter,
  SqlExecutionOptions,
  SqlEngineStatus,
  SqlExecutionResult,
  TableSchema,
} from './types';
import type { SqlWorkerPayload, SqlWorkerResponse } from './workerProtocol';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
}

const MAX_SCHEMA_CHARACTERS = 250_000;
const MAX_SEED_CHARACTERS = 1_000_000;

export class SqlWorkerAdapter implements SqlEngineAdapter {
  public readonly engineName = 'pglite-worker';
  public status: SqlEngineStatus = 'uninitialized';

  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private currentSchemaSql = '';
  private currentSeedSql = '';
  private customWorkerFactory?: () => Worker;
  private recoveryPromise: Promise<void> | null = null;

  constructor(customWorkerFactory?: () => Worker) {
    this.customWorkerFactory = customWorkerFactory;
  }

  private isWorkerSupported(): boolean {
    return Boolean(
      this.customWorkerFactory ||
        (typeof window !== 'undefined' && typeof Worker !== 'undefined'),
    );
  }

  private initWorker(): void {
    if (!this.isWorkerSupported()) {
      throw new Error(
        'This browser cannot start the SQL sandbox because Web Workers are unavailable.',
      );
    }

    if (this.worker) return;

    if (this.customWorkerFactory) {
      this.worker = this.customWorkerFactory();
    } else {
      this.worker = new Worker(new URL('./sql-runner.worker.ts', import.meta.url), {
        type: 'module',
      });
    }

    this.worker.onmessage = (event: MessageEvent<SqlWorkerResponse>) => {
      const data = event.data;
      if (!data || !data.id) return;

      const pending = this.pendingRequests.get(data.id);
      if (!pending) return;

      if (pending.timer) clearTimeout(pending.timer);
      this.pendingRequests.delete(data.id);

      if (data.type === 'error' || ('success' in data && !data.success)) {
        const errMsg = 'error' in data ? data.error : 'SQL Worker operation failed';
        pending.reject(new Error(errMsg || 'SQL Worker Error'));
        return;
      }

      if (data.type === 'execute_result') {
        pending.resolve(data.result);
      } else if (data.type === 'schema_result') {
        pending.resolve(data.tables || []);
      } else {
        pending.resolve(true);
      }
    };

    this.worker.onerror = (err) => {
      this.status = 'error';
      for (const [id, req] of this.pendingRequests.entries()) {
        if (req.timer) clearTimeout(req.timer);
        req.reject(new Error(`Worker fatal error: ${err.message}`));
        this.pendingRequests.delete(id);
      }
    };
  }

  private sendRequest<T>(req: SqlWorkerPayload, timeoutMs = 5000): Promise<T> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        if (req.type === 'execute') {
          this.recoveryPromise = this.restartWorker().finally(() => {
            this.recoveryPromise = null;
          });
          reject(new Error(`Query execution timed out after ${timeoutMs}ms`));
        } else {
          reject(new Error(`Operation ${req.type} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      if (this.worker) {
        this.worker.postMessage({ ...req, id });
      } else {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(new Error('SQL Worker is not active'));
      }
    });
  }

  private async restartWorker(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    for (const [id, request] of this.pendingRequests.entries()) {
      if (request.timer) clearTimeout(request.timer);
      request.reject(new Error('SQL Worker restarted before the operation completed'));
      this.pendingRequests.delete(id);
    }

    this.status = 'initializing';
    this.initWorker();

    try {
      await this.sendRequest(
        {
          type: 'init',
          schemaSql: this.currentSchemaSql,
          seedSql: this.currentSeedSql,
        },
        30000,
      );
      this.status = 'ready';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  private async awaitRecovery(): Promise<void> {
    if (this.recoveryPromise) {
      await this.recoveryPromise;
    }
  }

  async initialize(schemaSql: string, seedSql?: string): Promise<void> {
    this.status = 'initializing';
    this.currentSchemaSql = schemaSql || '';
    this.currentSeedSql = seedSql || '';

    if (this.currentSchemaSql.length > MAX_SCHEMA_CHARACTERS) {
      this.status = 'error';
      throw new Error(`SQL schema exceeds the ${MAX_SCHEMA_CHARACTERS} character limit.`);
    }
    if (this.currentSeedSql.length > MAX_SEED_CHARACTERS) {
      this.status = 'error';
      throw new Error(`SQL seed exceeds the ${MAX_SEED_CHARACTERS} character limit.`);
    }

    if (!this.isWorkerSupported()) {
      this.status = 'error';
      throw new Error(
        'This browser cannot start the SQL sandbox because Web Workers are unavailable.',
      );
    }

    this.initWorker();
    try {
      await this.sendRequest(
        {
          type: 'init',
          schemaSql: this.currentSchemaSql,
          seedSql: this.currentSeedSql,
        },
        30000,
      );
      this.status = 'ready';
    } catch (err) {
      this.status = 'error';
      throw err;
    }
  }

  async execute(
    query: string,
    options: SqlExecutionOptions | number = {},
  ): Promise<SqlExecutionResult> {
    await this.awaitRecovery();
    if (this.status !== 'ready' && this.status !== 'running') {
      throw new Error(`Engine not ready (status: ${this.status})`);
    }

    const normalizedOptions =
      typeof options === 'number' ? { timeoutMs: options } : options;
    const timeoutMs = normalizedOptions.timeoutMs ?? 3000;

    this.status = 'running';
    try {
      const res = await this.sendRequest<SqlExecutionResult>(
        { type: 'execute', query, options: normalizedOptions },
        timeoutMs
      );
      this.status = 'ready';
      return res;
    } catch (err: unknown) {
      this.status = 'ready';
      const message = err instanceof Error ? err.message : String(err);
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: message,
      };
    }
  }

  async getSchemaOverview(): Promise<TableSchema[]> {
    await this.awaitRecovery();
    return this.sendRequest<TableSchema[]>({ type: 'get_schema' }, 5000);
  }

  async reset(schemaSql?: string, seedSql?: string): Promise<void> {
    await this.awaitRecovery();
    if (schemaSql !== undefined) this.currentSchemaSql = schemaSql;
    if (seedSql !== undefined) this.currentSeedSql = seedSql;

    await this.sendRequest({
      type: 'reset',
      schemaSql: this.currentSchemaSql,
      seedSql: this.currentSeedSql,
    });
    this.status = 'ready';
  }

  async cancel(): Promise<void> {
    if (this.worker) {
      this.recoveryPromise = this.restartWorker().finally(() => {
        this.recoveryPromise = null;
      });
      await this.recoveryPromise;
    }
  }

  async dispose(): Promise<void> {
    if (this.worker) {
      try {
        await this.sendRequest({ type: 'dispose' }, 1000);
      } catch {
        // Ignore timeout during disposal
      }
      this.worker.terminate();
      this.worker = null;
    }
    this.status = 'terminated';
  }
}
