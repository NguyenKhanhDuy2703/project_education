import { PrismaClient } from '@prisma/client';
import {
  V3_AUTO_LABS,
  V3_AUTO_SERIES,
  V3_QUIZ_LABS,
  V3_QUIZ_SERIES,
  V3_SQL_LABS,
  V3_SQL_SERIES,
} from '../prisma/v3-curriculum-data';

type TargetClass = 'local_or_disposable' | 'shared_or_unknown';

function fingerprintDatabase(databaseUrl: string): {
  protocol: string;
  host: string;
  port: string;
  database: string;
  targetClass: TargetClass;
} {
  const parsed = new URL(databaseUrl);
  const database = parsed.pathname.replace(/^\//, '') || '(default)';
  const localHosts = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal', 'postgres']);
  const disposableName = /(^|[-_])(local|dev|test|tmp|scratch)([-_]|$)/i.test(database);

  return {
    protocol: parsed.protocol.replace(':', ''),
    host: parsed.hostname,
    port: parsed.port || 'default',
    database,
    targetClass:
      localHosts.has(parsed.hostname.toLowerCase()) || disposableName
        ? 'local_or_disposable'
        : 'shared_or_unknown',
  };
}

function parseObjective(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required. Use --env-file without printing its value.');

  const fingerprint = fingerprintDatabase(databaseUrl);
  const allowSharedRead = process.argv.includes('--allow-shared-read');
  console.log(JSON.stringify({ databaseTarget: fingerprint }, null, 2));

  if (fingerprint.targetClass === 'shared_or_unknown' && !allowSharedRead) {
    console.error('Refusing to query a shared/unknown target without --allow-shared-read. No database connection was opened.');
    process.exitCode = 2;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const seriesSlugs = [V3_SQL_SERIES.slug, V3_QUIZ_SERIES.slug, V3_AUTO_SERIES.slug];
    const v3LabSlugs = new Set(
      [...V3_SQL_LABS, ...V3_QUIZ_LABS, ...V3_AUTO_LABS].map((lab) => lab.slug),
    );

    const [series, sqlLabs, submissionCount, progressCount] = await Promise.all([
      prisma.labSeries.findMany({
        where: { slug: { in: seriesSlugs } },
        select: {
          id: true,
          slug: true,
          version: true,
          isActive: true,
          _count: { select: { sections: true, labs: true } },
        },
        orderBy: { slug: 'asc' },
      }),
      prisma.lab.findMany({
        where: { sandboxType: 'sql_worker' },
        select: {
          slug: true,
          objective: true,
          version: true,
          isActive: true,
          instructions: true,
          initialSnippet: true,
          solution: true,
        },
        orderBy: { slug: 'asc' },
      }),
      prisma.labSubmission.count(),
      prisma.learningUnitProgress.count(),
    ]);

    const legacySqlMissingFixtures = sqlLabs
      .filter((lab) => !v3LabSlugs.has(lab.slug))
      .filter((lab) => {
        const objective = parseObjective(lab.objective);
        return !String(objective.schemaSql || '').trim() || !String(objective.seedSql || '').trim();
      })
      .map((lab) => {
        const objective = parseObjective(lab.objective);
        const sampleData = Array.isArray(objective.sampleData) ? objective.sampleData : [];
        const firstRow = sampleData[0];
        const queryHint = `${lab.instructions} ${lab.initialSnippet || ''} ${lab.solution || ''}`;
        const queryTables = Array.from(
          queryHint.matchAll(/(?:FROM|JOIN)\s+["']?([a-zA-Z0-9_]+)["']?/gi),
          (match) => match[1],
        ).filter((table, index, all) => all.indexOf(table) === index);
        return {
          slug: lab.slug,
          version: lab.version,
          isActive: lab.isActive,
          sampleRowCount: sampleData.length,
          sampleColumns:
            firstRow && typeof firstRow === 'object' ? Object.keys(firstRow as object) : [],
          queryTables,
        };
      });

    const result = {
      databaseTarget: fingerprint,
      authoritativeV3: {
        expectedSeries: 3,
        foundSeries: series.length,
        expectedSections: 12,
        foundSections: series.reduce((total, item) => total + item._count.sections, 0),
        expectedLabs: 24,
        foundLabs: series.reduce((total, item) => total + item._count.labs, 0),
        series,
      },
      legacySql: {
        totalSqlLabs: sqlLabs.length,
        missingFixtureCount: legacySqlMissingFixtures.length,
        missingFixtures: legacySqlMissingFixtures,
      },
      preservationBaseline: { submissionCount, progressCount },
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
