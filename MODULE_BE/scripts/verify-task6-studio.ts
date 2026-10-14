import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LabsService } from '../src/modules/labs/labs.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole, ContentLifecycleStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

async function runStudioLabVerification() {
  console.log('🚀 Starting Verification: Task 6 (Practice Lab Studio Creation Flow)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const labsService = app.get(LabsService);
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

  let createdLabId: string | null = null;

  try {
    const series = await prisma.labSeries.findFirst({ where: { isActive: true } });
    const contributor = await prisma.user.findFirst({
      where: { role: UserRole.contributor, isActive: true },
    });

    if (!series || !contributor) {
      throw new Error('Required series or contributor not found.');
    }

    console.log(`\n--- 1. Testing Practice Lab Creation via Studio (PB-15 / Subtask 6.1, 6.2, 6.3) ---`);
    const uniqueSuffix = Date.now().toString().slice(-6);
    const labTitle = `Hands-on SQL Aggregate Mastery ${uniqueSuffix}`;

    const createdLab = await labsService.create(
      {
        seriesId: series.id,
        title: labTitle,
        sandboxType: 'sql_worker',
        objective: 'Master GROUP BY, HAVING and aggregate calculation.',
        instructions: '# 1. Lý thuyết Core\nGiải thích GROUP BY gom nhóm các dòng.\n\n## 2. Cú pháp\n```sql\nSELECT department, COUNT(*) FROM employees GROUP BY department;\n```',
        initialSnippet: '-- Write your query here:\nSELECT * FROM employees;',
        solution: 'SELECT department, COUNT(*) as total FROM employees GROUP BY department;',
        testScript: 'assert("Count departments", true);',
        durationMinutes: 25,
      },
      {
        userId: contributor.id,
        role: UserRole.contributor,
      },
    );

    createdLabId = createdLab.id;

    assert(Boolean(createdLab.id), 'Successfully creates a new Lab with UUID');
    assert(
      createdLab.status === ContentLifecycleStatus.draft,
      `Strictly forces draft status for contributor (status: ${createdLab.status})`,
    );
    assert(
      createdLab.slug === `hands-on-sql-aggregate-mastery-${uniqueSuffix}`,
      `Auto-normalizes lab slug (got: "${createdLab.slug}")`,
    );
    assert(createdLab.authorId === contributor.id, 'Properly links authorId to contributor');

    // 2. Subtask 6.4: Non-existent series protection
    console.log(`\n--- 2. Testing Non-existent Series Protection (Subtask 6.2) ---`);
    let notFoundCaught = false;
    try {
      await labsService.create(
        {
          seriesId: '00000000-0000-0000-0000-000000000000',
          title: 'Orphan Lab Attempt',
          sandboxType: 'js_worker',
          objective: 'Invalid test',
          instructions: 'Should fail',
        },
        {
          userId: contributor.id,
          role: UserRole.contributor,
        },
      );
    } catch (err) {
      if (err instanceof NotFoundException) {
        notFoundCaught = true;
      }
    }
    assert(notFoundCaught, 'Rejects orphan lab creation when seriesId is invalid with NotFoundException (404)');

    // 3. Contributor My Labs query
    console.log(`\n--- 3. Testing Contributor My Labs Retrieval (Subtask 6.3) ---`);
    const myLabs = await labsService.findMyLabs(contributor.id);
    assert(Array.isArray(myLabs), 'findMyLabs returns list of contributor labs');
    assert(
      myLabs.some((l) => l.id === createdLab.id),
      'Newly created lab appears in contributor dashboard list',
    );

    // 4. Cleanup
    if (createdLabId) {
      await prisma.lab.delete({ where: { id: createdLabId } });
      console.log('  🧹 Cleaned up temporary test lab from database.');
    }

    console.log(`\n🎉 Verification Summary: ${passed}/${total} checks passed!`);
  } catch (error) {
    console.error('Fatal error during studio lab verification:', error);
    process.exitCode = 1;
    if (createdLabId) {
      await prisma.lab.delete({ where: { id: createdLabId } }).catch(() => {});
    }
  } finally {
    await app.close();
  }
}

runStudioLabVerification();
