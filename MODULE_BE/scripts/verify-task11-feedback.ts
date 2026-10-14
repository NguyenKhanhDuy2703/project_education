import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FeedbackService } from '../src/modules/feedback/feedback.service';
import { FeedbackCategory, UserRole } from '@prisma/client';

async function run() {
  console.log('🚀 Starting Verification: Task 11 (User Feedback Loop & Admin Resolution - WF-11 | Feedback)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const feedbackService = app.get(FeedbackService);

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

  const createdFeedbackIds: string[] = [];

  try {
    let student = await prisma.user.findFirst({
      where: { role: UserRole.user, isActive: true },
    });
    if (!student) {
      student = await prisma.user.findFirst({ where: { isActive: true } });
    }
    if (!student) throw new Error('No active user found in database.');

    // -------------------------------------------------------------
    // Subtask 11.1: Learner & Guest Feedback Submission (POST /api/feedback)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Feedback Submission Flow (Subtask 11.1) ---');
    const uniqueSuffix = Date.now().toString().slice(-6);

    // 1. Authenticated user submits bug feedback with pageUrl
    const authFeedback = await feedbackService.create(
      {
        category: FeedbackCategory.bug,
        message: `Web Worker timeout when running nested while loop in SQL lab ${uniqueSuffix}`,
        pageUrl: `https://studyweb.dev/learn/sql/group-by?attempt=${uniqueSuffix}`,
      },
      student.id
    );
    createdFeedbackIds.push(authFeedback.id);

    assert(authFeedback.category === FeedbackCategory.bug, `Category saved as 'bug'`);
    assert(authFeedback.userId === student.id, `Authenticated feedback correctly associated with student userId`);
    assert(!!authFeedback.pageUrl && authFeedback.pageUrl.includes(uniqueSuffix), `pageUrl context captured accurately`);

    // 2. Guest user submits feature request with contact email
    const guestEmail = `guest_engineer_${uniqueSuffix}@example.com`;
    const guestFeedback = await feedbackService.create({
      category: FeedbackCategory.feature_request,
      message: `Please add PostgreSQL window functions (LEAD, LAG, NTILE) exercises.`,
      email: guestEmail,
      pageUrl: 'https://studyweb.dev/catalog',
    });
    createdFeedbackIds.push(guestFeedback.id);

    assert(guestFeedback.category === FeedbackCategory.feature_request, `Category saved as 'feature_request'`);
    assert(guestFeedback.userId === null, `Guest feedback has null userId`);
    assert(guestFeedback.email === guestEmail, `Guest contact email saved`);

    // 3. User submits content_lab feedback
    const contentFeedback = await feedbackService.create(
      {
        category: FeedbackCategory.content_lab,
        message: `Typo in exercise instructions: Step 2 mentions col A instead of col B`,
        pageUrl: 'https://studyweb.dev/learn/sql/joins',
      },
      student.id
    );
    createdFeedbackIds.push(contentFeedback.id);
    assert(contentFeedback.category === FeedbackCategory.content_lab, `Category saved as 'content_lab'`);

    // -------------------------------------------------------------
    // Subtask 11.2: Admin Feedback Dashboard Query (GET /feedback/admin)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Admin Dashboard Aggregation (Subtask 11.2) ---');
    const allFeedbacks = await feedbackService.findAll();
    assert(Array.isArray(allFeedbacks), `Admin endpoint returns feedbacks array`);
    assert(allFeedbacks.length >= 3, `Returned list includes newly submitted feedbacks (${allFeedbacks.length} >= 3)`);

    // Verify ordering by newest first
    const isSortedDesc = allFeedbacks.slice(0, 5).every((item, idx, arr) => {
      if (idx === 0) return true;
      return new Date(arr[idx - 1].createdAt).getTime() >= new Date(item.createdAt).getTime();
    });
    assert(isSortedDesc, `Admin list is sorted by createdAt DESC (newest first)`);

    // Category aggregation counts
    const bugCount = allFeedbacks.filter((f) => f.category === FeedbackCategory.bug).length;
    const featureCount = allFeedbacks.filter((f) => f.category === FeedbackCategory.feature_request).length;
    const contentCount = allFeedbacks.filter((f) => f.category === FeedbackCategory.content_lab).length;
    assert(bugCount >= 1, `Bug reports category count is positive (${bugCount})`);
    assert(featureCount >= 1, `Feature requests category count is positive (${featureCount})`);
    assert(contentCount >= 1, `Content lab category count is positive (${contentCount})`);

    // -------------------------------------------------------------
    // Subtask 11.3: Detail Context & Author Attribution Inspection
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Detail Context & User Attribution (Subtask 11.3) ---');
    const foundAuth = allFeedbacks.find((f) => f.id === authFeedback.id);
    assert(!!foundAuth, `Auth feedback found in admin list`);
    assert(foundAuth?.user?.name === student.name, `Author user relation resolved with student name`);
    assert(foundAuth?.user?.email === student.email, `Author user relation resolved with student email`);

    const foundGuest = allFeedbacks.find((f) => f.id === guestFeedback.id);
    assert(!!foundGuest, `Guest feedback found in admin list`);
    assert(foundGuest?.email === guestEmail, `Guest email rendered in detail view`);
    assert(foundGuest?.user === null, `Guest has null user relation`);

    // -------------------------------------------------------------
    // Subtask 11.4: Verification of Data Integrity Across Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Feedback Data Integrity (Subtask 11.4) ---');
    assert(
      foundAuth?.message.includes(`timeout when running nested while loop`),
      `Full message text preserved without truncation`
    );
    assert(
      foundAuth?.pageUrl?.startsWith('https://studyweb.dev'),
      `Original error navigation URL preserved`
    );

    console.log('\n=================================================');
    console.log(`TASK 11 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
    console.log('=================================================');
  } finally {
    console.log('\n[Teardown] Cleaning up test feedbacks...');
    if (createdFeedbackIds.length > 0) {
      await prisma.feedback.deleteMany({
        where: { id: { in: createdFeedbackIds } },
      });
    }
    await app.close();
    console.log('Teardown complete.');
  }
}

run().catch((err) => {
  console.error('Task 11 Verification Failure:', err);
  process.exit(1);
});
