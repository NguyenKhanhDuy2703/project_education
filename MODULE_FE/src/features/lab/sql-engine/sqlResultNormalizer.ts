/**
 * Normalizes SQL values for stable, deterministic comparison.
 */
export function normalizeSqlValue(val: unknown): unknown {
  if (val === null || val === undefined) {
    return null;
  }

  // Handle Date
  if (val instanceof Date) {
    return val.toISOString();
  }

  // Handle numbers & numeric strings
  if (typeof val === 'number') {
    if (Number.isNaN(val)) return null;
    return val;
  }

  if (typeof val === 'bigint') {
    return Number(val);
  }

  if (typeof val === 'boolean') {
    return val;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Try to normalize numeric strings if they match standard numbers
    if (/^-?\d+(\.\d+)?$/.test(trimmed) && !trimmed.startsWith('0') && trimmed.length < 15) {
      const parsedNum = Number(trimmed);
      if (!Number.isNaN(parsedNum)) {
        return parsedNum;
      }
    }
    return trimmed;
  }

  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  return val;
}

/**
 * Normalizes an array of row objects:
 * - Lowercases column keys for case-insensitive column matching
 * - Normalizes each field value
 */
export function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const canonicalKey = key.trim().toLowerCase();
    normalized[canonicalKey] = normalizeSqlValue(value);
  }
  return normalized;
}

export function normalizeRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => normalizeRow(r));
}

/**
 * Normalizes column header names (trimmed, lowercased).
 */
export function normalizeColumns(columns: string[]): string[] {
  if (!Array.isArray(columns)) return [];
  return columns.map((col) => col.trim().toLowerCase());
}
