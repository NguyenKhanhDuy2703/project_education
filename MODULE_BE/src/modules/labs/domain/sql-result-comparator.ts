function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') {
    return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  }
  if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value)) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return normalizeRow(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) return value.map(normalizeValue);
  return value;
}

export function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row)
      .map(([key, value]) => [key.toLowerCase(), normalizeValue(value)] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function stableRow(row: Record<string, unknown>): string {
  return JSON.stringify(normalizeRow(row));
}

export function compareSqlRows(
  actual: Array<Record<string, unknown>>,
  expected: Array<Record<string, unknown>>,
  orderSensitive = false,
): boolean {
  if (actual.length !== expected.length) return false;
  const left = actual.map(stableRow);
  const right = expected.map(stableRow);
  if (!orderSensitive) {
    left.sort();
    right.sort();
  }
  return left.every((row, index) => row === right[index]);
}
