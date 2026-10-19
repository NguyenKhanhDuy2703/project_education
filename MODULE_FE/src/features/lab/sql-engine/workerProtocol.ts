import type { SqlExecutionOptions, SqlExecutionResult, TableSchema } from './types';

export type SqlWorkerPayload =
  | { type: 'init'; schemaSql: string; seedSql?: string }
  | { type: 'execute'; query: string; options?: SqlExecutionOptions }
  | { type: 'get_schema' }
  | { type: 'reset'; schemaSql?: string; seedSql?: string }
  | { type: 'dispose' };

export type SqlWorkerRequest = { id: string } & SqlWorkerPayload;

export type SqlWorkerResponse =
  | { id: string; type: 'init_result'; success: boolean; error?: string }
  | { id: string; type: 'execute_result'; success: boolean; result?: SqlExecutionResult; error?: string }
  | { id: string; type: 'schema_result'; success: boolean; tables?: TableSchema[]; error?: string }
  | { id: string; type: 'reset_result'; success: boolean; error?: string }
  | { id: string; type: 'dispose_result'; success: boolean; error?: string }
  | { id: string; type: 'error'; error: string };
