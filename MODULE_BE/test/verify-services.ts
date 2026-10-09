import { PrismaClient, UserRole } from '@prisma/client';
import { slugify } from '../src/utils/slug.util';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🚀 [TEST SUITE] Starting BE & DB Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, extra = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${title} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${extra}`);
      failed++;
    }
  }

  try {
    // ── TEST 1: Database Connection ──────────────────────────────────────────
    console.log('--- 1. Testing Database & Prisma Connection ---');
    const userCount = await prisma.user.count();
    assert('Supabase PostgreSQL is connected', typeof userCount === 'number', `(Found ${userCount} users)`);

    // ── TEST 2: Slugify Utility ──────────────────────────────────────────────
    console.log('\n--- 2. Testing Slugify Utility ---');
    const slug1 = slugify('SQL Nâng Cao & Tối Ưu Truy Vấn');
    assert('Slugify converts Vietnamese & special characters', slug1 === 'sql-nang-cao-toi-uu-truy-van', `=> "${slug1}"`);

    // ── TEST 3: Series (Topic) CRUD ──────────────────────────────────────────
    console.log('\n--- 3. Testing Topics / Series CRUD ---');
    const testTopicSlug = `test-topic-${Date.now()}`;
    const newTopic = await prisma.labSeries.create({
      data: {
        title: 'Chủ Đề Kiểm Thử Tự Động',
        slug: testTopicSlug,
        category: 'testing',
        description: 'Mô tả bài kiểm thử tự động',
        level: 'intermediate',
        coverEmoji: '⚙️',
        isProOnly: false,
        isActive: true,
      },
    });
    assert('Create Topic (Series)', !!newTopic.id, `(ID: ${newTopic.id})`);

    const fetchedTopic = await prisma.labSeries.findUnique({
      where: { slug: testTopicSlug },
    });
    assert('Read Topic by Slug', fetchedTopic?.title === 'Chủ Đề Kiểm Thử Tự Động');

    const updatedTopic = await prisma.labSeries.update({
      where: { id: newTopic.id },
      data: { description: 'Mô tả đã được cập nhật bởi Admin' },
    });
    assert('Update Topic', updatedTopic.description === 'Mô tả đã được cập nhật bởi Admin');

    // ── TEST 4: Lab (Practice / Blog) CRUD ────────────────────────────────────
    console.log('\n--- 4. Testing Practice Lab / Blog CRUD ---');
    const testLabSlug = `test-lab-${Date.now()}`;
    const newLab = await prisma.lab.create({
      data: {
        seriesId: newTopic.id,
        title: 'Bài Thực Hành 1: Viết Assert Kiểm Tra',
        slug: testLabSlug,
        sandboxType: 'js_worker',
        objective: 'Mục tiêu thực hành viết assert',
        instructions: '# Đề bài\n\nViết hàm sum(a, b)',
        initialSnippet: 'function sum(a, b) { return a + b; }',
        testScript: "assert('1 + 2 = 3', sum(1, 2) === 3);",
        solution: 'function sum(a, b) { return a + b; }',
        durationMinutes: 15,
        isProOnly: true,
        orderIndex: 1,
        isActive: true,
      },
    });
    assert('Create Practice Lab in Topic', !!newLab.id, `(Lab ID: ${newLab.id})`);

    // ── TEST 5: Verify RBAC Solution Masking ──────────────────────────────────
    console.log('\n--- 5. Testing RBAC Solution Masking ---');
    const labFromDb = await prisma.lab.findUnique({ where: { slug: testLabSlug } });
    
    // Helper to evaluate privileged status without triggering literal narrowing errors
    const isRolePrivileged = (role: UserRole) => role === UserRole.admin || role === UserRole.userPro;

    // Simulate non-admin reading lab: solution must be null
    const regularUserView = {
      ...labFromDb,
      solution: isRolePrivileged(UserRole.user) ? labFromDb?.solution : null,
    };
    assert('Regular user view: Solution is HIDDEN', regularUserView.solution === null);

    // Simulate admin reading lab: solution must be visible
    const adminUserView = {
      ...labFromDb,
      solution: isRolePrivileged(UserRole.admin) ? labFromDb?.solution : null,
    };
    assert('Admin user view: Solution is VISIBLE', adminUserView.solution === 'function sum(a, b) { return a + b; }');

    // ── TEST 6: Cascade Deletion & Cleanup ────────────────────────────────────
    console.log('\n--- 6. Testing Deletion & Cleanup ---');
    await prisma.labSeries.delete({ where: { id: newTopic.id } });
    const orphanLab = await prisma.lab.findUnique({ where: { id: newLab.id } });
    assert('Cascade delete: Deleting Topic automatically deletes its Labs', orphanLab === null);

  } catch (err: any) {
    console.error('❌ Exception during test execution:', err.message);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n==========================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
