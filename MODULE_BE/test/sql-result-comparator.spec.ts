import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compareSqlRows } from '../src/modules/labs/domain/sql-result-comparator';

describe('SQL result comparison', () => {
  it('normalizes identifier case and safe numeric representations', () => {
    assert.equal(
      compareSqlRows(
        [{ count: 3n, total: '21.35' }],
        [{ COUNT: 3, TOTAL: 21.35 }],
      ),
      true,
    );
  });

  it('compares unordered results as a multiset by default', () => {
    assert.equal(compareSqlRows([{ id: 2 }, { id: 1 }], [{ id: 1 }, { id: 2 }]), true);
    assert.equal(compareSqlRows([{ id: 2 }, { id: 1 }], [{ id: 1 }, { id: 2 }], true), false);
  });
});
