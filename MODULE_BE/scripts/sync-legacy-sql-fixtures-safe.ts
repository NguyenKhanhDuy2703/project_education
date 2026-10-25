import { PGlite } from '@electric-sql/pglite';
import { Prisma, PrismaClient } from '@prisma/client';
import { V3_AUTO_LABS, V3_QUIZ_LABS, V3_SQL_LABS } from '../prisma/v3-curriculum-data';

type JsonRecord = Record<string, unknown>;

function parseObjective(value: string | null): JsonRecord {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function classifyTarget(databaseUrl: string): 'local_or_disposable' | 'shared_or_unknown' {
  const parsed = new URL(databaseUrl);
  const database = parsed.pathname.replace(/^\//, '');
  const localHosts = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'postgres']);
  const disposableName = /(^|[-_])(local|dev|test|tmp|scratch)([-_]|$)/i.test(database);
  return localHosts.has(parsed.hostname.toLowerCase()) || disposableName
    ? 'local_or_disposable'
    : 'shared_or_unknown';
}

function quoteIdentifier(identifier: string): string {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) return identifier;
  return `"${identifier.replace(/"/g, '""')}"`;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function synthesizeSingleTableFixture(
  tableName: string,
  sampleData: JsonRecord[],
): { schemaSql: string; seedSql: string } {
  const columns = Object.keys(sampleData[0] || {});
  if (columns.length === 0) throw new Error('Sample data has no columns.');

  const definitions = columns.map((column) => {
    const sampleValue = sampleData.find((row) => row[column] !== null && row[column] !== undefined)?.[
      column
    ];
    const type =
      typeof sampleValue === 'number'
        ? Number.isInteger(sampleValue)
          ? 'INTEGER'
          : 'NUMERIC'
        : typeof sampleValue === 'boolean'
          ? 'BOOLEAN'
          : 'TEXT';
    const primaryKey = column.toLowerCase() === 'id' ? ' PRIMARY KEY' : '';
    return `${quoteIdentifier(column)} ${type}${primaryKey}`;
  });
  const safeTable = quoteIdentifier(tableName);
  const safeColumns = columns.map(quoteIdentifier).join(', ');
  const rows = sampleData
    .map((row) => `(${columns.map((column) => sqlLiteral(row[column])).join(', ')})`)
    .join(',\n  ');

  return {
    schemaSql: `CREATE TABLE ${safeTable} (\n  ${definitions.join(',\n  ')}\n);`,
    seedSql: `INSERT INTO ${safeTable} (${safeColumns}) VALUES\n  ${rows};`,
  };
}

function queryTables(text: string): string[] {
  return Array.from(text.matchAll(/(?:FROM|JOIN)\s+["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?/gi), (match) => match[1])
    .filter((table) => table.length > 1)
    .filter((table, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === table.toLowerCase()) === index);
}

async function validateFixture(schemaSql: string, seedSql: string): Promise<void> {
  const database = await PGlite.create('memory://');
  try {
    await database.exec(schemaSql);
    await database.exec(seedSql);
  } finally {
    await database.close().catch(() => undefined);
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');

  const apply = process.argv.includes('--apply');
  const allowSharedRead = process.argv.includes('--allow-shared-read');
  const targetClass = classifyTarget(databaseUrl);
  if (targetClass === 'shared_or_unknown' && !allowSharedRead) {
    throw new Error('Shared/unknown target requires --allow-shared-read for dry-run inspection.');
  }
  if (apply && targetClass !== 'local_or_disposable') {
    throw new Error('--apply is restricted to a verified local/disposable database.');
  }

  const prisma = new PrismaClient();
  try {
    const authoritativeSlugs = new Set(
      [...V3_SQL_LABS, ...V3_QUIZ_LABS, ...V3_AUTO_LABS].map((lab) => lab.slug),
    );
    const labs = await prisma.lab.findMany({
      where: { sandboxType: 'sql_worker', isActive: true },
      select: {
        id: true,
        slug: true,
        objective: true,
        instructions: true,
        initialSnippet: true,
        solution: true,
      },
      orderBy: { slug: 'asc' },
    });
    const preservationBefore = {
      submissions: await prisma.labSubmission.count(),
      progress: await prisma.learningUnitProgress.count(),
    };

    const updates: Array<{ id: string; slug: string; objective: string }> = [];
    const manual: Array<{ slug: string; reason: string; tables: string[] }> = [];

    for (const lab of labs) {
      if (authoritativeSlugs.has(lab.slug)) continue;
      const objective = parseObjective(lab.objective);
      if (String(objective.schemaSql || '').trim() && String(objective.seedSql || '').trim()) continue;

      const sampleData = Array.isArray(objective.sampleData) ? (objective.sampleData as JsonRecord[]) : [];
      const tables = queryTables(`${lab.instructions} ${lab.initialSnippet || ''} ${lab.solution || ''}`);
      if (sampleData.length === 0 || tables.length !== 1) {
        manual.push({
          slug: lab.slug,
          tables,
          reason:
            sampleData.length === 0
              ? 'No sampleData is available.'
              : 'Multiple referenced tables cannot be reconstructed from one joined sample result.',
        });
        continue;
      }

      const fixture = synthesizeSingleTableFixture(tables[0], sampleData);
      await validateFixture(fixture.schemaSql, fixture.seedSql);
      updates.push({
        id: lab.id,
        slug: lab.slug,
        objective: JSON.stringify({
          ...objective,
          version: '2.0',
          schemaSql: fixture.schemaSql,
          seedSql: fixture.seedSql,
          statementPolicy: objective.statementPolicy || 'read_only',
          timeoutMs: objective.timeoutMs || 3000,
          maxResultRows: objective.maxResultRows || 500,
          maxResultColumns: objective.maxResultColumns || 50,
        }),
      });
    }

    if (apply && updates.length > 0) {
      await prisma.$transaction(
        updates.map((update) =>
          prisma.lab.update({ where: { id: update.id }, data: { objective: update.objective, version: 'v2.0' } }),
        ),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    }

    const preservationAfter = {
      submissions: await prisma.labSubmission.count(),
      progress: await prisma.learningUnitProgress.count(),
    };
    if (
      preservationAfter.submissions !== preservationBefore.submissions ||
      preservationAfter.progress !== preservationBefore.progress
    ) {
      throw new Error('Preservation counts changed unexpectedly.');
    }

    console.log(
      JSON.stringify(
        {
          mode: apply ? 'apply' : 'dry-run',
          targetClass,
          plannedUpdates: updates.map((update) => update.slug),
          manualRemediation: manual,
          preservationBefore,
          preservationAfter,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
