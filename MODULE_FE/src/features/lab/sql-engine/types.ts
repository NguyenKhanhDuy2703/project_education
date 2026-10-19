export interface TableColumnSchema {
  name: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: TableColumnSchema[];
  sampleRows?: Array<Record<string, unknown>>;
  totalRows?: number;
}

export interface SqlExecutionResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface SqlExecutionOptions {
  timeoutMs?: number;
  maxRows?: number;
  maxColumns?: number;
  maxOutputBytes?: number;
}

export type SqlEngineStatus = 'uninitialized' | 'initializing' | 'ready' | 'running' | 'error' | 'terminated';

export interface SqlEngineAdapter {
  readonly engineName: string;
  readonly status: SqlEngineStatus;
  initialize(schemaSql: string, seedSql?: string): Promise<void>;
  execute(query: string, options?: SqlExecutionOptions | number): Promise<SqlExecutionResult>;
  getSchemaOverview(): Promise<TableSchema[]>;
  reset(schemaSql?: string, seedSql?: string): Promise<void>;
  cancel(): Promise<void>;
  dispose(): Promise<void>;
}
