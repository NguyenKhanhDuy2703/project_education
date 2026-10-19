import { SqlLabConfig } from './sql-lab.types';

export interface SqlGradeRequest {
  submittedCode: string;
  solution?: string | null;
  config: SqlLabConfig;
}

export interface SqlGradeResult {
  status: 'passed' | 'failed';
  timeMs: number;
  testLogs: string;
  rows?: Array<Record<string, unknown>>;
  columns?: string[];
}

export type SqlWorkerReply =
  | { ok: true; result: SqlGradeResult }
  | { ok: false; error: string };
