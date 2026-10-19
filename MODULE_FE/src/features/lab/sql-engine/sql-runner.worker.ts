import { PgEngineCore } from './PgEngineCore';
import type { SqlWorkerRequest, SqlWorkerResponse } from './workerProtocol';

const core = new PgEngineCore();

self.onmessage = async (event: MessageEvent<SqlWorkerRequest>) => {
  const data = event.data;
  if (!data || !data.id || !data.type) return;

  const id = data.id;

  try {
    switch (data.type) {
      case 'init': {
        await core.initialize(data.schemaSql, data.seedSql);
        const response: SqlWorkerResponse = {
          id,
          type: 'init_result',
          success: true,
        };
        self.postMessage(response);
        break;
      }

      case 'execute': {
        const result = await core.execute(data.query, data.options);
        const response: SqlWorkerResponse = {
          id,
          type: 'execute_result',
          success: !result.error,
          result,
          error: result.error,
        };
        self.postMessage(response);
        break;
      }

      case 'get_schema': {
        const tables = await core.getSchemaOverview();
        const response: SqlWorkerResponse = {
          id,
          type: 'schema_result',
          success: true,
          tables,
        };
        self.postMessage(response);
        break;
      }

      case 'reset': {
        await core.reset(data.schemaSql, data.seedSql);
        const response: SqlWorkerResponse = {
          id,
          type: 'reset_result',
          success: true,
        };
        self.postMessage(response);
        break;
      }

      case 'dispose': {
        await core.dispose();
        const response: SqlWorkerResponse = {
          id,
          type: 'dispose_result',
          success: true,
        };
        self.postMessage(response);
        break;
      }

      default: {
        self.postMessage({
          id,
          type: 'error',
          error: `Unknown request type: ${(data as { type: string }).type}`,
        });
      }
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    self.postMessage({
      id,
      type: `${data.type}_result` as any,
      success: false,
      error,
    });
  }
};
