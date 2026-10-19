export type SqlStatementPolicy = 'read_only' | 'mutable';

export interface SqlLabConfig {
  version: '1.0' | '2.0';
  schemaSql: string;
  seedSql?: string;
  expectedQueryResult?: Array<Record<string, unknown>>;
  expectedColumns?: string[];
  verificationSql?: string;
  orderSensitive?: boolean;
  sampleRowsVisible?: boolean;
  statementPolicy?: SqlStatementPolicy;
  timeoutMs?: number;
  maxResultRows?: number;
  maxResultColumns?: number;
}

export const DEFAULT_SQL_POLICY = {
  statementPolicy: 'read_only' as const,
  timeoutMs: 3000,
  maxResultRows: 500,
  maxResultColumns: 50,
};
