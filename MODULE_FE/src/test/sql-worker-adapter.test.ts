import { describe, expect, it } from 'vitest';
import { SqlWorkerAdapter } from '../features/lab/sql-engine/SqlWorkerAdapter';
import type {
  SqlWorkerRequest,
  SqlWorkerResponse,
} from '../features/lab/sql-engine/workerProtocol';

class FakeSqlWorker {
  onmessage: ((event: MessageEvent<SqlWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  private readonly hangQueries: boolean;

  constructor(hangQueries = false) {
    this.hangQueries = hangQueries;
  }

  postMessage(request: SqlWorkerRequest) {
    if (request.type === 'execute' && this.hangQueries) return;

    queueMicrotask(() => {
      if (this.terminated || !this.onmessage) return;

      const response: SqlWorkerResponse =
        request.type === 'execute'
          ? {
              id: request.id,
              type: 'execute_result',
              success: true,
              result: {
                columns: ['value'],
                rows: [{ value: 1 }],
                rowCount: 1,
                executionTimeMs: 1,
              },
            }
          : request.type === 'get_schema'
            ? { id: request.id, type: 'schema_result', success: true, tables: [] }
            : {
                id: request.id,
                type: `${request.type}_result` as 'init_result',
                success: true,
              };

      this.onmessage(new MessageEvent('message', { data: response }));
    });
  }

  terminate() {
    this.terminated = true;
  }
}

describe('SqlWorkerAdapter recovery', () => {
  it('waits for a fully reinitialized worker after a query timeout', async () => {
    const workers: FakeSqlWorker[] = [];
    const adapter = new SqlWorkerAdapter(() => {
      const worker = new FakeSqlWorker(workers.length === 0);
      workers.push(worker);
      return worker as unknown as Worker;
    });

    await adapter.initialize('CREATE TABLE items (id INT);', 'INSERT INTO items VALUES (1);');

    const timedOut = await adapter.execute('SELECT * FROM items', 5);
    expect(timedOut.error).toContain('timed out');

    const recovered = await adapter.execute('SELECT 1 AS value', 100);
    expect(recovered.error).toBeUndefined();
    expect(recovered.rows).toEqual([{ value: 1 }]);
    expect(workers).toHaveLength(2);
    expect(workers[0].terminated).toBe(true);
    expect(adapter.status).toBe('ready');

    await adapter.dispose();
  });
});
