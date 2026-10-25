import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  V3_SQL_SECTIONS,
  V3_QUIZ_SECTIONS,
  V3_AUTO_SECTIONS,
  V3_SQL_SERIES,
  V3_QUIZ_SERIES,
  V3_AUTO_SERIES,
} from '../prisma/v3-curriculum-data';

describe('Task 5: Curriculum Sections & Learning Unit Distribution Suite', () => {
  it('defines exactly 4 sections/modules for each of the 3 series', () => {
    assert.equal(V3_SQL_SECTIONS.length, 4, 'SQL track must have 4 modules');
    assert.equal(V3_QUIZ_SECTIONS.length, 4, 'Quiz track must have 4 modules');
    assert.equal(V3_AUTO_SECTIONS.length, 4, 'Automation track must have 4 modules');
  });

  it('correctly associates section seriesId with parent series', () => {
    for (const sec of V3_SQL_SECTIONS) {
      assert.equal(sec.seriesId, V3_SQL_SERIES.id);
      assert.ok(sec.title.startsWith('Module '));
    }

    for (const sec of V3_QUIZ_SECTIONS) {
      assert.equal(sec.seriesId, V3_QUIZ_SERIES.id);
      assert.ok(sec.title.startsWith('Module '));
    }

    for (const sec of V3_AUTO_SECTIONS) {
      assert.equal(sec.seriesId, V3_AUTO_SERIES.id);
      assert.ok(sec.title.startsWith('Module '));
    }
  });

  it('orders sections strictly from orderIndex 0 to 3', () => {
    const allSectionGroups = [V3_SQL_SECTIONS, V3_QUIZ_SECTIONS, V3_AUTO_SECTIONS];
    for (const group of allSectionGroups) {
      const orders = group.map((s) => s.orderIndex);
      assert.deepEqual(orders, [0, 1, 2, 3]);
    }
  });
});
