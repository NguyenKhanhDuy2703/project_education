import { describe, it, expect } from 'vitest';
import { normalizeSqlValue } from '../features/lab/sql-engine/sqlResultNormalizer';
import { diffSqlResults } from '../features/lab/sql-engine/sqlDiff';

describe('SQL Result Normalizer and Diff Engine', () => {
  describe('normalizeSqlValue', () => {
    it('normalizes null and undefined to null', () => {
      expect(normalizeSqlValue(null)).toBeNull();
      expect(normalizeSqlValue(undefined)).toBeNull();
    });

    it('normalizes numeric strings into numbers', () => {
      expect(normalizeSqlValue('123')).toBe(123);
      expect(normalizeSqlValue('45.67')).toBe(45.67);
      expect(normalizeSqlValue('0123')).toBe('0123'); // preserves leading zero (e.g. phone/zip code)
    });

    it('normalizes dates to ISO string', () => {
      const date = new Date('2026-10-17T12:00:00Z');
      expect(normalizeSqlValue(date)).toBe(date.toISOString());
    });
  });

  describe('diffSqlResults', () => {
    const expected = [
      { id: 1, name: 'Alice', score: 95 },
      { id: 2, name: 'Bob', score: 80 },
    ];

    it('matches identical results', () => {
      const actual = [
        { id: 1, name: 'Alice', score: 95 },
        { id: 2, name: 'Bob', score: 80 },
      ];

      const diff = diffSqlResults(actual, expected);
      expect(diff.isMatch).toBe(true);
      expect(diff.matchedRowCount).toBe(2);
      expect(diff.summary).toContain('matches expected output perfectly');
    });

    it('matches results with case-insensitive column names', () => {
      const actual = [
        { ID: 1, NAME: 'Alice', SCORE: 95 },
        { ID: 2, NAME: 'Bob', SCORE: 80 },
      ];

      const diff = diffSqlResults(actual, expected);
      expect(diff.isMatch).toBe(true);
    });

    it('handles unordered results when orderSensitive is false', () => {
      const actualReversed = [
        { id: 2, name: 'Bob', score: 80 },
        { id: 1, name: 'Alice', score: 95 },
      ];

      const diff = diffSqlResults(actualReversed, expected, { orderSensitive: false });
      expect(diff.isMatch).toBe(true);
    });

    it('fails unordered results when orderSensitive is true', () => {
      const actualReversed = [
        { id: 2, name: 'Bob', score: 80 },
        { id: 1, name: 'Alice', score: 95 },
      ];

      const diff = diffSqlResults(actualReversed, expected, { orderSensitive: true });
      expect(diff.isMatch).toBe(false);
      expect(diff.rowDiffs[0].status).toBe('unexpected');
      expect(diff.rowDiffs[0].cellDiffs?.name).toEqual({ actual: 'Bob', expected: 'Alice' });
    });

    it('detects missing required columns', () => {
      const actual = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      const diff = diffSqlResults(actual, expected, { expectedColumns: ['id', 'name', 'score'] });
      expect(diff.isMatch).toBe(false);
      expect(diff.columnMatch).toBe(false);
      expect(diff.missingColumns).toContain('score');
    });

    it('identifies missing and unexpected rows', () => {
      const actual = [
        { id: 1, name: 'Alice', score: 95 },
        { id: 3, name: 'Charlie', score: 88 },
      ];

      const diff = diffSqlResults(actual, expected);
      expect(diff.isMatch).toBe(false);
      expect(diff.matchedRowCount).toBe(1);
      expect(diff.rowDiffs.some((r) => r.status === 'missing')).toBe(true);
      expect(diff.rowDiffs.some((r) => r.status === 'unexpected')).toBe(true);
    });
  });
});
