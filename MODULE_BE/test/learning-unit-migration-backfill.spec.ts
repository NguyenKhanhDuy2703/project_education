import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inferLearningUnitType, LearningUnitType } from '../src/modules/labs/domain/labContentCodec';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Learning Unit Domain Contract & Migration Backfill Suite (Task 1.2 & 1.4)', () => {
  it('deterministically maps legacy sandboxType to pedagogical unitType when unitType is absent', () => {
    assert.equal(inferLearningUnitType(null, 'markdown_only'), 'theory');
    assert.equal(inferLearningUnitType(undefined, 'sql_worker'), 'sql_practice');
    assert.equal(inferLearningUnitType(undefined, 'quizlet'), 'quiz_checkpoint');
    assert.equal(inferLearningUnitType(null, 'js_worker'), 'automation_lab');
    assert.equal(inferLearningUnitType(null, 'automation_v3'), 'automation_lab');
    assert.equal(inferLearningUnitType(null, 'unknown_custom'), 'theory');
  });

  it('preserves explicitly specified unitType regardless of sandboxType', () => {
    assert.equal(inferLearningUnitType('theory', 'js_worker'), 'theory');
    assert.equal(inferLearningUnitType('quiz_checkpoint', 'markdown_only'), 'quiz_checkpoint');
    assert.equal(inferLearningUnitType('automation_lab', 'sql_worker'), 'automation_lab');
    assert.equal(inferLearningUnitType('sql_practice', 'js_worker'), 'sql_practice');
  });

  it('verifies migration SQL file exists and contains deterministic backfill queries', () => {
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations/20261023153000_learning_unit_pattern_redesign/migration.sql',
    );
    assert.ok(fs.existsSync(migrationPath), 'Migration SQL file must exist');

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Asserts enums
    assert.ok(sqlContent.includes('CREATE TYPE "LearningUnitType"'), 'Must define LearningUnitType enum');
    assert.ok(sqlContent.includes('CREATE TYPE "LearningProgressStatus"'), 'Must define LearningProgressStatus enum');

    // Asserts tables & columns
    assert.ok(sqlContent.includes('ALTER TABLE "labs" ADD COLUMN "unitType"'), 'Must alter labs table for unitType');
    assert.ok(sqlContent.includes('ALTER TABLE "labs" ADD COLUMN "sectionId"'), 'Must alter labs table for sectionId');
    assert.ok(sqlContent.includes('CREATE TABLE "series_sections"'), 'Must create series_sections table');
    assert.ok(sqlContent.includes('CREATE TABLE "learning_unit_progress"'), 'Must create learning_unit_progress table');

    // Asserts deterministic backfills
    assert.ok(sqlContent.includes("WHEN \"sandboxType\" = 'markdown_only' THEN 'theory'"), 'Must backfill markdown_only to theory');
    assert.ok(sqlContent.includes("WHEN \"sandboxType\" = 'sql_worker' THEN 'sql_practice'"), 'Must backfill sql_worker to sql_practice');
    assert.ok(sqlContent.includes("WHEN \"sandboxType\" = 'quizlet' THEN 'quiz_checkpoint'"), 'Must backfill quizlet to quiz_checkpoint');
    assert.ok(sqlContent.includes("WHEN \"sandboxType\" IN ('js_worker', 'automation_v3') THEN 'automation_lab'"), 'Must backfill automation');
    assert.ok(sqlContent.includes('INSERT INTO "learning_unit_progress"'), 'Must backfill user progress from passed submissions');
  });
});
