import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReviewService } from '../src/modules/review/review.service';
import { LabsService } from '../src/modules/labs/labs.service';
import { SeriesService } from '../src/modules/series/series.service';
import { ContentLifecycleStatus, UserRole } from '@prisma/client';

async function run() {
  console.log('🚀 Starting Verification: Task 7 (Content Review Queue & Publishing Workflow)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const reviewService = app.get(ReviewService);
  const labsService = app.get(LabsService);
  const seriesService = app.get(SeriesService);

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

  let createdSeriesId = '';
  let createdLabId = '';

  try {
    const contributor = await prisma.user.findFirst({
      where: { role: UserRole.contributor, isActive: true },
    });
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.admin, isActive: true },
    });

    if (!contributor || !admin) {
      throw new Error('Required contributor or admin not found in DB.');
    }

    console.log(`\n--- 1. Testing Contributor Submit for Review (WF-07 | Subtask 7.1) ---`);
    const uniqueSuffix = Date.now().toString().slice(-6);

    const series = await seriesService.create(
      {
        title: `Workflow Review Series ${uniqueSuffix}`,
        slug: `workflow-review-series-${uniqueSuffix}`,
        description: 'Series dedicated to testing content review queue lifecycle',
        category: 'testing',
      },
      { userId: contributor.id, role: contributor.role }
    );
    createdSeriesId = series.id;

    assert(series.status === ContentLifecycleStatus.draft, `Created series starts in 'draft' status (actual: ${series.status})`);

    const lab = await labsService.create(
      {
        seriesId: createdSeriesId,
        title: `Workflow Review Lab ${uniqueSuffix}`,
        sandboxType: 'js_worker',
        objective: 'Test lifecycle submission flow',
        instructions: '# Test Lab Theory\nDetailed markdown instructions for verification.',
        initialSnippet: 'function solve() { return false; }',
        solution: 'function solve() { return true; }',
        testScript: 'assert("returns true", solve() === true);',
        durationMinutes: 15,
      },
      { userId: contributor.id, role: contributor.role }
    );
    createdLabId = lab.id;

    assert(lab.status === ContentLifecycleStatus.draft, `Created lab starts in 'draft' status (actual: ${lab.status})`);

    // Contributor submits lab for review
    const submittedLab = await labsService.submitForReview(createdLabId, {
      userId: contributor.id,
      role: contributor.role,
    });
    assert(submittedLab.status === ContentLifecycleStatus.submitted, `Lab status transitioned to 'submitted' upon submitForReview`);

    // Non-owner cannot submit for review
    let unauthorizedBlocked = false;
    try {
      await labsService.submitForReview(createdLabId, {
        userId: '00000000-0000-0000-0000-000000000000',
        role: UserRole.contributor,
      });
    } catch (err: any) {
      unauthorizedBlocked = true;
    }
    assert(unauthorizedBlocked, `Access control: Non-owner contributor cannot submit another author's content`);

    console.log(`\n--- 2. Testing Admin Review Queue Aggregation & Badges (WF-07 | Subtask 7.2) ---`);
    const queue = await reviewService.getReviewQueue({
      status: ContentLifecycleStatus.submitted,
    });
    const queueItem = queue.items.find((item) => item.id === createdLabId && item.type === 'lab');

    assert(!!queueItem, `Submitted lab appears in Admin Review Queue list`);
    assert(queueItem?.title === lab.title, `Queue item displays correct lab title`);
    assert(queueItem?.author?.id === contributor.id, `Queue item correctly attributes contributor author`);
    assert(queue.counts.submitted > 0, `Queue badges reflect positive submitted count (${queue.counts.submitted})`);

    console.log(`\n--- 3. Testing Request Changes & Resubmission (WF-07 | Subtask 7.3) ---`);
    const reviewNote = 'Vui lòng bổ sung thêm test case cho edge case rỗng';
    const requestResult = await reviewService.requestChanges('lab', createdLabId, reviewNote, admin.id);

    assert(
      requestResult.item.status === ContentLifecycleStatus.changes_requested,
      `Admin requestChanges transitions status to 'changes_requested'`
    );
    assert(
      requestResult.item.reviewFeedback === reviewNote,
      `Review feedback note is persisted on the content item`
    );

    // Verify Audit Log
    const auditRequest = await prisma.auditLog.findFirst({
      where: {
        action: 'REQUEST_CHANGES',
        actorId: admin.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditRequest, `Audit Log recorded 'REQUEST_CHANGES' action with actor=${admin.name}`);

    // Contributor resubmits -> version must bump
    const initialVersion = requestResult.item.version || 'v1.0';
    const resubmittedLab = await labsService.submitForReview(createdLabId, {
      userId: contributor.id,
      role: contributor.role,
    });
    assert(
      resubmittedLab.status === ContentLifecycleStatus.submitted,
      `Resubmitted lab returns to 'submitted' status`
    );
    assert(
      resubmittedLab.version === 'v1.1',
      `Resubmission increments version number from ${initialVersion} to ${resubmittedLab.version}`
    );

    console.log(`\n--- 4. Testing Admin Direct Publish & Catalog Visibility (WF-07 | Subtask 7.4) ---`);
    const publishResult = await reviewService.publish('lab', createdLabId, admin.id);

    assert(
      publishResult.item.status === ContentLifecycleStatus.published,
      `Publish action sets status to 'published'`
    );
    assert(
      publishResult.item.isActive === true,
      `Publish action sets isActive=true for public catalog visibility`
    );

    // Verify Audit Log for PUBLISH_CONTENT
    const auditPublish = await prisma.auditLog.findFirst({
      where: {
        action: 'PUBLISH_CONTENT',
        actorId: admin.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditPublish, `Audit Log recorded 'PUBLISH_CONTENT' action with actor=${admin.name}`);

    // Verify published item is readable in DB as published
    const finalLab = await prisma.lab.findUnique({ where: { id: createdLabId } });
    assert(finalLab?.status === ContentLifecycleStatus.published, `Final lab verified as published in database`);

    console.log(`\n=================================================`);
    console.log(`TASK 7 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
    console.log(`=================================================`);
  } finally {
    console.log('\n[Teardown] Cleaning up test records...');
    if (createdLabId) {
      await prisma.lab.deleteMany({ where: { id: createdLabId } });
    }
    if (createdSeriesId) {
      await prisma.labSeries.deleteMany({ where: { id: createdSeriesId } });
    }
    await app.close();
    console.log('Teardown complete.');
  }
}

run().catch((err) => {
  console.error('Task 7 Verification Failure:', err);
  process.exit(1);
});
