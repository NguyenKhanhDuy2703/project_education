import { parentPort, workerData } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';
import { PGlite } from '@electric-sql/pglite';
import { compareSqlRows, normalizeRow } from './domain/sql-result-comparator';
import { SqlGradeRequest, SqlWorkerReply } from './domain/sql-grading.types';
import { validateSqlStatement } from './domain/sql-policy';

const MAX_OUTPUT_BYTES = 2_000_000;

async function grade(request: SqlGradeRequest) {
  const start = performance.now();
  const config = request.config;
  const policy = config.statementPolicy || 'read_only';
  const validation = validateSqlStatement(request.submittedCode, policy);
  if (!validation.allowed || !validation.sql) {
    return { status: 'failed' as const, timeMs: 0, testLogs: validation.error || 'SQL policy rejected the statement.' };
  }
  if (policy === 'mutable' && !config.verificationSql?.trim()) {
    throw new Error('Mutable SQL lab is missing hidden verification SQL.');
  }

  const db = await PGlite.create('memory://');
  try {
    if (config.schemaSql?.trim()) await db.exec(config.schemaSql);
    if (config.seedSql?.trim()) await db.exec(config.seedSql);

    const learnerResult = await db.query<Record<string, unknown>>(validation.sql);
    const actual = policy === 'mutable'
      ? (await db.query<Record<string, unknown>>(config.verificationSql!)).rows
      : learnerResult.rows;

    let expected = config.expectedQueryResult;
    if (!expected && request.solution?.trim()) {
      const referenceDb = await PGlite.create('memory://');
      try {
        if (config.schemaSql?.trim()) await referenceDb.exec(config.schemaSql);
        if (config.seedSql?.trim()) await referenceDb.exec(config.seedSql);
        if (policy === 'mutable') {
          await referenceDb.query(request.solution);
          expected = (await referenceDb.query<Record<string, unknown>>(config.verificationSql!)).rows;
        } else {
          expected = (await referenceDb.query<Record<string, unknown>>(request.solution)).rows;
        }
      } finally {
        await referenceDb.close().catch(() => undefined);
      }
    }
    if (!expected) throw new Error('SQL lab is missing an expected result or reference solution.');

    const maxRows = config.maxResultRows || 500;
    const maxColumns = config.maxResultColumns || 50;
    const columns = actual.length ? Object.keys(actual[0]) : [];
    const safeRows = actual.map(normalizeRow);
    if (actual.length > maxRows) throw new Error(`Result exceeds the ${maxRows}-row grading limit.`);
    if (columns.length > maxColumns) throw new Error(`Result exceeds the ${maxColumns}-column grading limit.`);
    if (JSON.stringify(safeRows).length > MAX_OUTPUT_BYTES) throw new Error('Result exceeds the grading output limit.');

    const passed = compareSqlRows(safeRows, expected, config.orderSensitive);
    return {
      status: passed ? 'passed' as const : 'failed' as const,
      timeMs: Math.max(1, Math.round(performance.now() - start)),
      testLogs: passed
        ? `Passed: ${actual.length} row${actual.length === 1 ? '' : 's'} matched.`
        : `Result mismatch: expected ${expected.length} row(s), received ${actual.length}.`,
      rows: safeRows,
      columns,
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      timeMs: Math.max(1, Math.round(performance.now() - start)),
      testLogs: error instanceof Error ? error.message : 'SQL execution failed.',
    };
  } finally {
    await db.close().catch(() => undefined);
  }
}

void grade(workerData as SqlGradeRequest)
  .then((result) => parentPort?.postMessage({ ok: true, result } satisfies SqlWorkerReply))
  .catch((error) => parentPort?.postMessage({
    ok: false,
    error: error instanceof Error ? error.message : 'SQL grader failed to initialize.',
  } satisfies SqlWorkerReply));
