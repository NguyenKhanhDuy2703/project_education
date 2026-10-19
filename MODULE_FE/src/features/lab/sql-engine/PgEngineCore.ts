import { PGlite } from '@electric-sql/pglite';
import type { SqlExecutionOptions, SqlExecutionResult, TableSchema } from './types';

const DEFAULT_MAX_ROWS = 500;
const DEFAULT_MAX_COLUMNS = 50;
const DEFAULT_MAX_OUTPUT_BYTES = 2_000_000;

export class PgEngineCore {
  private db: PGlite | null = null;
  private cachedSchemaSql = '';
  private cachedSeedSql = '';

  async initialize(schemaSql: string, seedSql?: string): Promise<void> {
    if (this.db) {
      await this.db.close().catch(() => {});
      this.db = null;
    }

    this.cachedSchemaSql = schemaSql || '';
    this.cachedSeedSql = seedSql || '';

    // Explicitly use an ephemeral database and wait until Postgres is ready.
    this.db = await PGlite.create('memory://');

    if (this.cachedSchemaSql.trim()) {
      await this.db.exec(this.cachedSchemaSql);
    }
    if (this.cachedSeedSql.trim()) {
      await this.db.exec(this.cachedSeedSql);
    }
  }

  async execute(
    query: string,
    options: SqlExecutionOptions = {},
  ): Promise<SqlExecutionResult> {
    if (!this.db) {
      throw new Error('Database is not initialized. Please call initialize() first.');
    }

    const start = performance.now();
    try {
      const res = await this.db.query(query);
      const executionTimeMs = Math.max(1, Math.round(performance.now() - start));

      const columns = (res.fields || []).map((f) => f.name);
      const rows = (res.rows || []) as Array<Record<string, unknown>>;
      const rowCount = typeof res.rowCount === 'number' ? res.rowCount : rows.length;
      const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
      const maxColumns = options.maxColumns ?? DEFAULT_MAX_COLUMNS;
      const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;

      if (columns.length > maxColumns) {
        throw new Error(
          `Query returned ${columns.length} columns; the sandbox limit is ${maxColumns}.`,
        );
      }
      if (rows.length > maxRows) {
        throw new Error(`Query returned ${rows.length} rows; the sandbox limit is ${maxRows}.`);
      }
      const serializedRows = JSON.stringify(
        rows,
        (_key, value) => typeof value === 'bigint' ? value.toString() : value,
      );
      if (serializedRows.length > maxOutputBytes) {
        throw new Error(
          `Query output exceeded the sandbox limit of ${maxOutputBytes} bytes.`,
        );
      }

      return {
        columns,
        rows,
        rowCount,
        executionTimeMs,
      };
    } catch (err: unknown) {
      const executionTimeMs = Math.max(1, Math.round(performance.now() - start));
      const message = err instanceof Error ? err.message : String(err);
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs,
        error: message,
      };
    }
  }

  async getSchemaOverview(): Promise<TableSchema[]> {
    if (!this.db) return [];

    try {
      const tablesResult = await this.db.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`
      );

      const tables: TableSchema[] = [];

      for (const row of tablesResult.rows) {
        const tableName = row.table_name;

        // Get columns
        const colsResult = await this.db.query<{
          column_name: string;
          data_type: string;
          is_nullable: string;
        }>(
          `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position;`,
          [tableName],
        );

        // Get primary keys
        const pksResult = await this.db.query<{ column_name: string }>(
          `SELECT kcu.column_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu
             ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
           WHERE tc.constraint_type = 'PRIMARY KEY'
             AND tc.table_schema = 'public'
             AND tc.table_name = $1;`,
          [tableName],
        );
        const pkSet = new Set(pksResult.rows.map((r) => r.column_name));

        const columns = colsResult.rows.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          isPrimaryKey: pkSet.has(col.column_name),
        }));

        // Sample rows
        const quotedTableName = `"${tableName.replace(/"/g, '""')}"`;
        const sampleResult = await this.db.query<Record<string, unknown>>(
          `SELECT * FROM ${quotedTableName} LIMIT 5;`
        );
        const countResult = await this.db.query<{ count: string | number }>(
          `SELECT count(*) as count FROM ${quotedTableName};`
        );

        const totalRows = Number(countResult.rows[0]?.count || 0);

        tables.push({
          tableName,
          columns,
          sampleRows: sampleResult.rows,
          totalRows,
        });
      }

      return tables;
    } catch {
      return [];
    }
  }

  async reset(schemaSql?: string, seedSql?: string): Promise<void> {
    const finalSchema = schemaSql !== undefined ? schemaSql : this.cachedSchemaSql;
    const finalSeed = seedSql !== undefined ? seedSql : this.cachedSeedSql;

    if (this.db) {
      try {
        await this.db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        if (finalSchema.trim()) await this.db.exec(finalSchema);
        if (finalSeed.trim()) await this.db.exec(finalSeed);
        this.cachedSchemaSql = finalSchema;
        this.cachedSeedSql = finalSeed;
        return;
      } catch {
        // Fallback to full re-initialization if schema recreation fails
      }
    }
    await this.initialize(finalSchema, finalSeed);
  }

  async dispose(): Promise<void> {
    if (this.db) {
      await this.db.close().catch(() => {});
      this.db = null;
    }
    this.cachedSchemaSql = '';
    this.cachedSeedSql = '';
  }
}
