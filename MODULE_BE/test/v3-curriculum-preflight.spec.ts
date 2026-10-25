import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  V3_SQL_SERIES,
  V3_SQL_LABS,
  V3_QUIZ_SERIES,
  V3_QUIZ_LABS,
  V3_AUTO_SERIES,
  V3_AUTO_LABS,
} from '../prisma/v3-curriculum-data';

describe('V3 Curriculum 24-Lab Preflight Verification Suite (Subtask 5.1)', () => {
  it('defines 3 distinct series with unique slugs and IDs', () => {
    const seriesList = [V3_SQL_SERIES, V3_QUIZ_SERIES, V3_AUTO_SERIES];
    assert.equal(seriesList.length, 3);

    const ids = new Set(seriesList.map((s) => s.id));
    const slugs = new Set(seriesList.map((s) => s.slug));
    assert.equal(ids.size, 3);
    assert.equal(slugs.size, 3);
  });

  it('contains exactly 24 MVP labs across the 3 tracks (8 SQL, 8 Quiz, 8 Automation)', () => {
    assert.equal(V3_SQL_LABS.length, 8, 'Must have exactly 8 SQL labs');
    assert.equal(V3_QUIZ_LABS.length, 8, 'Must have exactly 8 Quiz labs');
    assert.equal(V3_AUTO_LABS.length, 8, 'Must have exactly 8 Automation labs');

    const allLabs = [...V3_SQL_LABS, ...V3_QUIZ_LABS, ...V3_AUTO_LABS];
    assert.equal(allLabs.length, 24);

    const slugs = new Set(allLabs.map((l) => l.slug));
    assert.equal(slugs.size, 24, 'All 24 lab slugs must be unique');
  });

  it('enforces tiering rule: exactly 3 Free Preview and 5 Pro labs per series', () => {
    const tracks = [
      { name: 'SQL', labs: V3_SQL_LABS },
      { name: 'Quiz', labs: V3_QUIZ_LABS },
      { name: 'Automation', labs: V3_AUTO_LABS },
    ];

    for (const { name, labs } of tracks) {
      const freeLabs = labs.filter((l) => l.isFreePreview && !l.isProOnly);
      const proLabs = labs.filter((l) => !l.isFreePreview && l.isProOnly);

      assert.equal(freeLabs.length, 3, `${name} track must have exactly 3 Free Preview labs`);
      assert.equal(proLabs.length, 5, `${name} track must have exactly 5 Pro labs`);

      // Verify the first 3 labs are free, last 5 are pro
      for (let i = 0; i < 3; i++) {
        assert.equal(labs[i].isFreePreview, true, `${name} Lab #${i + 1} must be free preview`);
        assert.equal(labs[i].isProOnly, false, `${name} Lab #${i + 1} must not be pro-only`);
      }
      for (let i = 3; i < 8; i++) {
        assert.equal(labs[i].isFreePreview, false, `${name} Lab #${i + 1} must not be free preview`);
        assert.equal(labs[i].isProOnly, true, `${name} Lab #${i + 1} must be pro-only`);
      }
    }
  });

  it('verifies 8 SQL labs have complete schema, seed, solution, and instructions with schema diagram and hints', () => {
    for (const lab of V3_SQL_LABS) {
      assert.ok(lab.title, `SQL lab ${lab.slug} missing title`);
      assert.ok(lab.instructions, `SQL lab ${lab.slug} missing instructions`);
      assert.ok(lab.instructions.includes('Bối Cảnh Nghiệp Vụ'), `${lab.slug} missing problem statement`);
      assert.ok(lab.instructions.includes('Sơ Đồ'), `${lab.slug} missing schema diagram`);
      assert.ok(lab.instructions.includes('Cạm Bẫy Phổ Biến'), `${lab.slug} missing common pitfalls`);
      assert.ok(lab.instructions.includes('Gợi Ý Phân Tầng'), `${lab.slug} missing tiered hints`);
      assert.ok(lab.instructions.includes('Thử Thách Mở Rộng'), `${lab.slug} missing extension challenge`);
      assert.ok(lab.solution, `SQL lab ${lab.slug} missing gold solution`);
      assert.ok(lab.config?.schemaSql, `SQL lab ${lab.slug} missing schemaSql`);
      assert.ok(lab.config?.seedSql, `SQL lab ${lab.slug} missing seedSql`);
      assert.equal(lab.sandboxType, 'sql_worker');
    }
  });

  it('verifies 8 Quiz labs have exactly 5 questions each (40 total) with 4 options and explanations', () => {
    let totalQuestions = 0;
    for (const lab of V3_QUIZ_LABS) {
      assert.equal(lab.sandboxType, 'quizlet');
      const questions = lab.config?.questions;
      assert.ok(Array.isArray(questions), `Quiz lab ${lab.slug} questions must be an array`);
      assert.equal(questions.length, 5, `Quiz lab ${lab.slug} must have exactly 5 questions`);

      questions.forEach((q: any, idx: number) => {
        totalQuestions++;
        assert.ok(q.question, `Question ${idx + 1} in ${lab.slug} missing question text`);
        assert.ok(Array.isArray(q.options), `Question ${idx + 1} in ${lab.slug} options must be an array`);
        assert.equal(q.options.length, 4, `Question ${idx + 1} in ${lab.slug} must have exactly 4 options`);
        assert.ok(
          q.correctIndex >= 0 && q.correctIndex < 4,
          `Question ${idx + 1} in ${lab.slug} correctIndex must be 0..3`,
        );
        assert.ok(q.hint, `Question ${idx + 1} in ${lab.slug} missing hint`);
        assert.ok(q.explanation, `Question ${idx + 1} in ${lab.slug} missing explanation`);
      });
    }
    assert.equal(totalQuestions, 40, 'Total scenario quiz questions must be exactly 40');
  });

  it('verifies 8 Automation Playwright labs follow 3-tier structure with valid V3 contracts', () => {
    const modes = V3_AUTO_LABS.map((l) => l.config?.interactionMode);

    // Labs 1-3: Block Builder
    assert.equal(modes[0], 'block_builder');
    assert.equal(modes[1], 'block_builder');
    assert.equal(modes[2], 'block_builder');

    // Labs 4-6: Smart Cloze
    assert.equal(modes[3], 'smart_cloze');
    assert.equal(modes[4], 'smart_cloze');
    assert.equal(modes[5], 'smart_cloze');

    // Labs 7-8: Guided / Full Code
    assert.equal(modes[6], 'guided_code');
    assert.equal(modes[7], 'full_code');

    for (const lab of V3_AUTO_LABS) {
      assert.equal(lab.config?.version, '3.0');
      assert.equal(lab.config?.framework, 'playwright');
      assert.ok(lab.config?.fixture?.fixtureId, `Automation lab ${lab.slug} missing fixtureId`);
      assert.ok(Array.isArray(lab.config?.allowedBlocks), `Automation lab ${lab.slug} missing allowedBlocks`);
      assert.ok(Array.isArray(lab.config?.starterPlan), `Automation lab ${lab.slug} missing starterPlan`);
      assert.ok(Array.isArray(lab.config?.publicChecks), `Automation lab ${lab.slug} missing publicChecks`);
      assert.ok(lab.solution, `Automation lab ${lab.slug} missing gold Playwright solution`);
      assert.match(lab.solution, /@playwright\/test/);
    }
  });
});
