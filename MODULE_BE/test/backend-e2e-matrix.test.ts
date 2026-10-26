import { PrismaClient, UserRole, ContentLifecycleStatus } from '@prisma/client';
import { EntitlementsService } from '../src/modules/entitlements/entitlements.service';
import { AuditLogsService } from '../src/modules/audit-logs/audit-logs.service';
import { SeriesService } from '../src/modules/series/series.service';
import { LabsService } from '../src/modules/labs/labs.service';
import { ReviewService } from '../src/modules/review/review.service';
import { GroupsService } from '../src/modules/groups/groups.service';

const prisma = new PrismaClient();

async function runE2ESuite() {
  console.log('\n===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE BACKEND E2E RBAC & LIFECYCLE TEST SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(testName: string, condition: boolean, extraInfo?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extraInfo ? `— ${extraInfo}` : ''}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // Initialize Services
  const auditLogsService = new AuditLogsService(prisma as any);
  const entitlementsService = new EntitlementsService(prisma as any, auditLogsService);
  const seriesService = new SeriesService(prisma as any);
  const labsService = new LabsService(prisma as any, entitlementsService);
  const reviewService = new ReviewService(prisma as any, auditLogsService);
  const groupsService = new GroupsService(prisma as any, auditLogsService);

  // Fetch test personas
  const admin = (await prisma.user.findFirst({ where: { email: 'admin@studyweb.dev' } })) || (await prisma.user.findFirst({ where: { role: UserRole.admin } }));
  const contributor = (await prisma.user.findFirst({ where: { email: 'contributor@studyweb.dev' } })) || (await prisma.user.findFirst({ where: { role: UserRole.contributor } }));
  const student = (await prisma.user.findFirst({ where: { email: 'user@studyweb.dev' } })) || (await prisma.user.findFirst({ where: { role: UserRole.user } }));

  assert('Test Personas Exist in Database', Boolean(admin && contributor && student));

  const adminCtx = { userId: admin!.id, role: UserRole.admin };
  const contribCtx = { userId: contributor!.id, role: UserRole.contributor };
  const studentCtx = { userId: student!.id, role: UserRole.user };

  console.log('\n--- 1. SPRINT BE-1 & BE-2: IAM GROUPS & UNION ENGINE ---');
  // 1.1 Check Group Union for Pro Feature
  const studentEntitlements = await entitlementsService.getUserEntitlements(student!.id);
  assert('Student Entitlements payload contains groups array', Array.isArray(studentEntitlements.groups));
  assert('Student has RUN_JS_WORKER access via Default Free or Standard Group', 
    studentEntitlements.effectiveFeatures.some(f => f.code === 'RUN_JS_WORKER' && f.hasAccess)
  );

  // Test Provenance check on Contributor (belongs to CONTRIBUTOR_TEAM with PRO_YEARLY)
  const contribEntitlements = await entitlementsService.getUserEntitlements(contributor!.id);
  const aiReviewFeature = contribEntitlements.effectiveFeatures.find(f => f.code === 'AI_CODE_REVIEW');
  assert('Contributor inherits AI_CODE_REVIEW via Group Union', Boolean(aiReviewFeature?.hasAccess));
  assert('Feature Provenance shows GROUP_UNION', aiReviewFeature?.provenance?.type === 'GROUP_UNION');

  console.log('\n--- 2. SPRINT BE-3: CONTRIBUTOR AUTHORING & ANTI-BYPASS ---');
  // 2.1 Contributor creates a new series
  const testSeriesSlug = `test-series-${Date.now()}`;
  const newSeries = await seriesService.create({
    title: 'Automated E2E Testing Series',
    slug: testSeriesSlug,
    category: 'testing',
    description: 'Series created by automated test runner',
    status: ContentLifecycleStatus.published, // Trying to bypass with 'published'!
  } as any, contribCtx);

  assert('Anti-Bypass: Contributor status is forced to DRAFT regardless of payload', 
    newSeries.status === ContentLifecycleStatus.draft
  );
  assert('Series authorId is set to Contributor ID', newSeries.authorId === contributor!.id);
  assert('Initial version is v1.0', newSeries.version === 'v1.0');

  // 2.2 Contributor creates a lab inside this series
  const testLabSlug = `test-lab-${Date.now()}`;
  const newLab = await labsService.create({
    seriesId: newSeries.id,
    title: 'Automated E2E Testing Lab',
    slug: testLabSlug,
    sandboxType: 'js_worker',
    objective: 'Test lifecycle',
    instructions: '# Content',
    initialSnippet: '// code',
    testScript: 'assert(true)',
    solution: '// verified solution',
    status: ContentLifecycleStatus.published, // Bypass attempt!
  } as any, contribCtx);

  assert('Anti-Bypass: Lab status is forced to DRAFT', newLab.status === ContentLifecycleStatus.draft);
  assert('Lab authorId is set to Contributor ID', newLab.authorId === contributor!.id);

  // 2.3 Contributor update anti-bypass
  const updatedLab = await labsService.update(newLab.id, {
    title: 'Updated Automated Lab Title',
    status: ContentLifecycleStatus.published,
  } as any, contribCtx);
  assert('Anti-Bypass: Contributor cannot promote status via update API', 
    updatedLab.status === ContentLifecycleStatus.draft
  );

  console.log('\n--- 3. SPRINT BE-4: REVIEW QUEUE & CONTENT LIFECYCLE JOURNEY ---');
  // 3.1 Contributor submits lab for review
  const submittedLab = await labsService.submitForReview(newLab.id, contribCtx);
  assert('Lab status transitions to SUBMITTED', submittedLab.status === ContentLifecycleStatus.submitted);

  // 3.2 Admin Review Queue lists submitted lab
  const queueBefore = await reviewService.getReviewQueue({ status: ContentLifecycleStatus.submitted });
  assert('Review Queue contains submitted lab', 
    queueBefore.items.some(item => item.id === newLab.id && item.type === 'lab')
  );

  // 3.3 Admin requests changes
  const changeReq = await reviewService.requestChanges('lab', newLab.id, 'Need more test assertions', admin!.id);
  assert('Admin successfully requests changes', changeReq.item.status === ContentLifecycleStatus.changes_requested);
  assert('Review feedback is saved in database', changeReq.item.reviewFeedback === 'Need more test assertions');

  // 3.4 Contributor resubmits -> Version bumps from v1.0 to v1.1
  const resubmittedLab = await labsService.submitForReview(newLab.id, contribCtx);
  assert('Resubmitted lab status is SUBMITTED', resubmittedLab.status === ContentLifecycleStatus.submitted);
  assert('Resubmitted lab version is incremented to v1.1', resubmittedLab.version === 'v1.1');

  // 3.5 Admin approves lab (NOT PUBLISHED YET)
  const approvedLab = await reviewService.approve('lab', newLab.id, admin!.id);
  assert('Admin approves lab -> status is APPROVED', approvedLab.item.status === ContentLifecycleStatus.approved);

  console.log('\n--- 4. SPRINT BE-5: STUDENT ISOLATION & ACCESS CONTROL ---');
  // 4.1 Student tries to access unapproved/approved lab -> MUST NOT BE VISIBLE
  let studentAccessBlocked = false;
  try {
    await labsService.findBySlug(testLabSlug, studentCtx);
  } catch (err: any) {
    if (err.status === 404) studentAccessBlocked = true;
  }
  assert('Catalog Isolation: Student cannot view APPROVED lab before Publish (404)', studentAccessBlocked);

  // 4.2 Author CAN view approved lab via preview mode
  const authorPreview = await labsService.findBySlug(testLabSlug, contribCtx);
  assert('Preview Mode: Author can view non-published lab', authorPreview.id === newLab.id);

  // 4.3 Admin publishes lab
  const publishedLab = await reviewService.publish('lab', newLab.id, admin!.id);
  assert('Admin publishes lab -> status is PUBLISHED', publishedLab.item.status === ContentLifecycleStatus.published);

  // 4.4 Student CAN now view published lab
  const studentView = await labsService.findBySlug(testLabSlug, studentCtx);
  assert('Student can now access PUBLISHED lab', studentView.id === newLab.id);
  assert('Student cannot view solution unless entitled', studentView.solution === null);

  // 4.5 Author can view solution of own lab
  const authorView = await labsService.findBySlug(testLabSlug, contribCtx);
  assert('Author can view solution of own lab', authorView.solution !== null);

  console.log('\n--- 5. SPRINT BE-6: OWNERSHIP TRANSFER ---');
  // 5.1 Transfer lab ownership to Admin
  const transferred = await reviewService.transferOwnership('lab', newLab.id, admin!.id, 'Handover', admin!.id);
  assert('Ownership transferred to Admin', transferred.item.authorId === admin!.id);

  // Clean up test items
  await prisma.lab.delete({ where: { id: newLab.id } });
  await prisma.labSeries.delete({ where: { id: newSeries.id } });
  console.log('🧹 Cleaned up temporary test artifacts.');

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');
}

runE2ESuite()
  .catch((e) => {
    console.error('❌ E2E Test Suite Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
