import type {
  SqlEngineAdapter,
  SqlEngineStatus,
  SqlExecutionResult,
  TableSchema,
} from './types';

export type { SqlEngineAdapter, SqlEngineStatus, SqlExecutionResult, TableSchema };

/**
 * In-memory Mock/Fake Adapter for unit testing, SSR, or environments without Web Worker support.
 */
export class MockSqlEngineAdapter implements SqlEngineAdapter {
  public readonly engineName = 'mock-sql-engine';
  public status: SqlEngineStatus = 'uninitialized';
  private schemaSql = '';
  private seedSql = '';

  private mockTables: TableSchema[];
  private mockResults: Record<string, SqlExecutionResult>;

  constructor(
    mockTables: TableSchema[] = [],
    mockResults: Record<string, SqlExecutionResult> = {}
  ) {
    this.mockTables = mockTables;
    this.mockResults = mockResults;
  }

  async initialize(schemaSql: string, seedSql?: string): Promise<void> {
    this.status = 'initializing';
    this.schemaSql = schemaSql;
    this.seedSql = seedSql || '';
    this.status = 'ready';
  }

  async execute(query: string): Promise<SqlExecutionResult> {
    if (this.status !== 'ready' && this.status !== 'running') {
      throw new Error(`Engine is not ready (status: ${this.status})`);
    }

    const trimmed = query.trim();
    const startTime = performance.now();

    if (this.mockResults[trimmed]) {
      const res = this.mockResults[trimmed];
      return {
        ...res,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // Default mock response
    return {
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Sample Item' }],
      rowCount: 1,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  async getSchemaOverview(): Promise<TableSchema[]> {
    return this.mockTables;
  }

  async reset(schemaSql?: string, seedSql?: string): Promise<void> {
    const finalSchema = schemaSql ?? this.schemaSql;
    const finalSeed = seedSql ?? this.seedSql;
    await this.initialize(finalSchema, finalSeed);
  }

  async cancel(): Promise<void> {
    // No-op for mock
  }

  async dispose(): Promise<void> {
    this.status = 'terminated';
  }
}
