import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeriesService } from '../src/modules/series/series.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole, ContentLifecycleStatus } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

async function runCreateSeriesVerification() {
  console.log('🚀 Starting Verification: Task 5 (Create Series & Lifecycle Flow)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const seriesService = app.get(SeriesService);
  const prisma = app.get(PrismaService);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  let createdSeriesId: string | null = null;

  try {
    const contributor = await prisma.user.findFirst({
      where: { role: UserRole.contributor, isActive: true },
    });

    if (!contributor) {
      throw new Error('No contributor user found.');
    }

    console.log(`\n--- 1. Testing Contributor Creating Series (PB-15 / Subtask 5.1, 5.2) ---`);
    const uniqueSuffix = Date.now().toString().slice(-6);
    const title = `Advanced Web Workers Architecture ${uniqueSuffix}`;

    const created = await seriesService.create(
      {
        title,
        description: 'Comprehensive guide to building high-performance sandboxes in browser.',
        category: 'backend',
        level: 'advanced',
      },
      {
        userId: contributor.id,
        role: UserRole.contributor,
      },
    );

    createdSeriesId = created.id;

    assert(Boolean(created.id), 'Successfully creates a new Series with UUID');
    assert(
      created.status === ContentLifecycleStatus.draft,
      `Strictly forces draft status for contributor (status: ${created.status})`,
    );
    assert(
      created.slug === `advanced-web-workers-architecture-${uniqueSuffix}`,
      `Auto-normalizes SEO-friendly slug (got: "${created.slug}")`,
    );
    assert(created.authorId === contributor.id, 'Properly associates authorId to authenticated user');

    // 2. Duplicate slug check
    console.log(`\n--- 2. Testing Duplicate Slug Protection (Subtask 5.2) ---`);
    let conflictCaught = false;
    try {
      await seriesService.create(
        {
          title,
          category: 'backend',
          description: 'Duplicate test attempt',
        },
        {
          userId: contributor.id,
          role: UserRole.contributor,
        },
      );
    } catch (err) {
      if (err instanceof ConflictException) {
        conflictCaught = true;
      }
    }
    assert(conflictCaught, 'Duplicate slug correctly rejected with ConflictException (409)');

    // 3. Contributor My Series Retrieval
    console.log(`\n--- 3. Testing Contributor Series Retrieval (Subtask 5.3) ---`);
    const mySeries = await seriesService.findMySeries(contributor.id);
    assert(Array.isArray(mySeries), 'findMySeries returns list of contributor authored topics');
    assert(
      mySeries.some((s) => s.id === created.id),
      'Newly created draft series is present in author dashboard list',
    );

    // 4. Cleanup
    if (createdSeriesId) {
      await prisma.labSeries.delete({ where: { id: createdSeriesId } });
      console.log('  🧹 Cleaned up temporary test series from database.');
    }

    console.log(`\n🎉 Verification Summary: ${passed}/${total} checks passed!`);
  } catch (error) {
    console.error('Fatal error during series creation verification:', error);
    process.exitCode = 1;
    if (createdSeriesId) {
      await prisma.labSeries.delete({ where: { id: createdSeriesId } }).catch(() => {});
    }
  } finally {
    await app.close();
  }
}

runCreateSeriesVerification();
