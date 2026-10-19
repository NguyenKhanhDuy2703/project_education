import {
  normalizeColumns,
  normalizeRows,
} from './sqlResultNormalizer';

export interface RowDiff {
  status: 'matched' | 'missing' | 'unexpected';
  actualRow?: Record<string, unknown>;
  expectedRow?: Record<string, unknown>;
  cellDiffs?: Record<string, { actual: unknown; expected: unknown }>;
}

export interface SqlDiffOptions {
  orderSensitive?: boolean;
  expectedColumns?: string[];
}

export interface SqlDiffResult {
  isMatch: boolean;
  columnMatch: boolean;
  actualColumns: string[];
  expectedColumns: string[];
  missingColumns: string[];
  extraColumns: string[];
  rowDiffs: RowDiff[];
  actualRowCount: number;
  expectedRowCount: number;
  matchedRowCount: number;
  summary: string;
}

function areRowsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  columnsToCheck: string[]
): boolean {
  for (const col of columnsToCheck) {
    if (a[col] !== b[col]) {
      return false;
    }
  }
  return true;
}

function getCellDiffs(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
  columns: string[]
): Record<string, { actual: unknown; expected: unknown }> {
  const diffs: Record<string, { actual: unknown; expected: unknown }> = {};
  for (const col of columns) {
    if (actual[col] !== expected[col]) {
      diffs[col] = {
        actual: actual[col],
        expected: expected[col],
      };
    }
  }
  return diffs;
}

export function diffSqlResults(
  rawActualRows: Array<Record<string, unknown>>,
  rawExpectedRows: Array<Record<string, unknown>>,
  options: SqlDiffOptions = {}
): SqlDiffResult {
  const { orderSensitive = false, expectedColumns: rawExpectedCols } = options;

  const actualRows = normalizeRows(rawActualRows || []);
  const expectedRows = normalizeRows(rawExpectedRows || []);

  // Determine columns
  const actualColsSet = new Set<string>();
  actualRows.forEach((r) => Object.keys(r).forEach((k) => actualColsSet.add(k)));
  const actualColumns = Array.from(actualColsSet);

  const expectedColsSet = new Set<string>();
  if (rawExpectedCols && rawExpectedCols.length > 0) {
    normalizeColumns(rawExpectedCols).forEach((c) => expectedColsSet.add(c));
  } else {
    expectedRows.forEach((r) => Object.keys(r).forEach((k) => expectedColsSet.add(k)));
  }
  const expectedColumns = Array.from(expectedColsSet);

  // Check column alignment
  const missingColumns = expectedColumns.filter((c) => !actualColsSet.has(c));
  const extraColumns = actualColumns.filter((c) => !expectedColsSet.has(c));
  const columnMatch = missingColumns.length === 0;

  const rowDiffs: RowDiff[] = [];
  let matchedRowCount = 0;

  const compareCols = expectedColumns.length > 0 ? expectedColumns : actualColumns;

  if (orderSensitive) {
    const maxLen = Math.max(actualRows.length, expectedRows.length);
    for (let i = 0; i < maxLen; i++) {
      const act = actualRows[i];
      const exp = expectedRows[i];

      if (act && exp) {
        if (areRowsEqual(act, exp, compareCols)) {
          matchedRowCount++;
          rowDiffs.push({
            status: 'matched',
            actualRow: act,
            expectedRow: exp,
          });
        } else {
          rowDiffs.push({
            status: 'unexpected',
            actualRow: act,
            expectedRow: exp,
            cellDiffs: getCellDiffs(act, exp, compareCols),
          });
        }
      } else if (act && !exp) {
        rowDiffs.push({
          status: 'unexpected',
          actualRow: act,
        });
      } else if (!act && exp) {
        rowDiffs.push({
          status: 'missing',
          expectedRow: exp,
        });
      }
    }
  } else {
    // Multiset / Unordered matching
    const unmatchedExpected = [...expectedRows];
    const unmatchedActual: Array<Record<string, unknown>> = [];

    for (const act of actualRows) {
      const matchIdx = unmatchedExpected.findIndex((exp) =>
        areRowsEqual(act, exp, compareCols)
      );
      if (matchIdx !== -1) {
        matchedRowCount++;
        rowDiffs.push({
          status: 'matched',
          actualRow: act,
          expectedRow: unmatchedExpected[matchIdx],
        });
        unmatchedExpected.splice(matchIdx, 1);
      } else {
        unmatchedActual.push(act);
      }
    }

    for (const exp of unmatchedExpected) {
      rowDiffs.push({
        status: 'missing',
        expectedRow: exp,
      });
    }

    for (const act of unmatchedActual) {
      rowDiffs.push({
        status: 'unexpected',
        actualRow: act,
      });
    }
  }

  const isMatch =
    columnMatch &&
    actualRows.length === expectedRows.length &&
    matchedRowCount === expectedRows.length;

  let summary = '';
  if (isMatch) {
    summary = `Query result matches expected output perfectly (${matchedRowCount}/${expectedRows.length} rows).`;
  } else if (!columnMatch) {
    summary = `Column mismatch: missing required columns [${missingColumns.join(', ')}].`;
  } else if (actualRows.length !== expectedRows.length) {
    summary = `Row count mismatch: received ${actualRows.length} rows, expected ${expectedRows.length} rows.`;
  } else {
    summary = `Value mismatch: ${matchedRowCount}/${expectedRows.length} rows matched.`;
  }

  return {
    isMatch,
    columnMatch,
    actualColumns,
    expectedColumns,
    missingColumns,
    extraColumns,
    rowDiffs,
    actualRowCount: actualRows.length,
    expectedRowCount: expectedRows.length,
    matchedRowCount,
    summary,
  };
}
