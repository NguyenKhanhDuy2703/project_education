import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('PB-16 Database Migration Integrity and Completeness Smoke Suite', () => {
  const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

  it('G3 Gate: Verifies all 21 Prisma models have matching CREATE TABLE statements in migrations', () => {
    assert.ok(fs.existsSync(migrationsDir), 'Migrations directory must exist');
    assert.ok(fs.existsSync(schemaPath), 'schema.prisma must exist');

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const modelMatches = Array.from(schemaContent.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\}/g));
    assert.equal(modelMatches.length, 27, 'Prisma schema must define exactly 27 models');

    // Extract table map names
    const expectedTables: string[] = [];
    for (const match of modelMatches) {
      const modelBody = match[2];
      const mapMatch = modelBody.match(/@@map\("([^"]+)"\)/);
      if (mapMatch) {
        expectedTables.push(mapMatch[1]);
      } else {
        expectedTables.push(match[1]);
      }
    }

    assert.equal(expectedTables.length, 27, 'Must have 27 mapped table names');

    // Read all migration files
    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
      .sort();

    let allMigrationSql = '';
    for (const dir of migrationDirs) {
      const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
      if (fs.existsSync(sqlFile)) {
        allMigrationSql += '\n' + fs.readFileSync(sqlFile, 'utf-8');
      }
    }

    const missingTables: string[] = [];
    for (const table of expectedTables) {
      const createTableRegex = new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?"${table}"`, 'i');
      if (!createTableRegex.test(allMigrationSql)) {
        missingTables.push(table);
      }
    }

    assert.deepEqual(
      missingTables,
      [],
      `All 20 tables must have CREATE TABLE in migration chain. Missing: ${missingTables.join(', ')}`,
    );
  });

  it('G3 Gate: Verifies all enums defined in schema.prisma are created in migrations', () => {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const enumMatches = Array.from(schemaContent.matchAll(/enum\s+(\w+)\s*\{/g));

    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory());

    let allMigrationSql = '';
    for (const dir of migrationDirs) {
      const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
      if (fs.existsSync(sqlFile)) {
        allMigrationSql += '\n' + fs.readFileSync(sqlFile, 'utf-8');
      }
    }

    for (const match of enumMatches) {
      const enumName = match[1];
      const createEnumRegex = new RegExp(`CREATE TYPE "${enumName}"`, 'i');
      assert.ok(
        createEnumRegex.test(allMigrationSql),
        `Enum "${enumName}" must have CREATE TYPE statement in migrations`,
      );
    }
  });

  it('G3 Gate: Verifies migration timestamps form a monotonic non-decreasing sequence', () => {
    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
      .map((d) => d.split('_')[0]);

    for (let i = 1; i < migrationDirs.length; i++) {
      assert.ok(
        migrationDirs[i] >= migrationDirs[i - 1],
        `Migration timestamp sequence broken: ${migrationDirs[i - 1]} vs ${migrationDirs[i]}`,
      );
    }
  });
});
