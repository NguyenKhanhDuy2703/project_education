import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Series (Topics)
  const series1 = await prisma.labSeries.upsert({
    where: { slug: 'testing-co-ban' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      title: 'Testing Cơ Bản cho Người Mới',
      slug: 'testing-co-ban',
      category: 'testing',
      description: 'Học cách viết Test Case, kiểm thử manual và hiểu quy trình QA từ đầu. Phù hợp hoàn toàn cho người chưa có kinh nghiệm.',
      level: 'beginner',
      coverEmoji: '🧪',
      orderIndex: 1,
      isProOnly: false,
      isActive: true,
    },
  });

  const series2 = await prisma.labSeries.upsert({
    where: { slug: 'api-testing-postman' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000002',
      title: 'API Testing với Postman & Swagger',
      slug: 'api-testing-postman',
      category: 'testing',
      description: 'Thực hành test REST API thực tế: viết collection, thiết lập environment, kiểm tra response schema và status code.',
      level: 'intermediate',
      coverEmoji: '📮',
      orderIndex: 2,
      isProOnly: false,
      isActive: true,
    },
  });

  // 2. Seed Labs
  await prisma.lab.upsert({
    where: { slug: 'test-case-la-gi' },
    update: {},
    create: {
      seriesId: series1.id,
      title: 'Test Case là gì? Viết test case đầu tiên',
      slug: 'test-case-la-gi',
      sandboxType: 'js_worker',
      objective: 'Hiểu cấu trúc và viết test case kiểm thử email',
      instructions: `# Test Case là gì?\n\nMột **Test Case** là tập hợp các bước kiểm thử để xác nhận một tính năng hoạt động đúng.\n\n## Cấu trúc Test Case chuẩn\n\n| Trường | Mô tả |\n|---|---|\n| **ID** | Mã định danh duy nhất (TC-001) |\n| **Title** | Mô tả ngắn gọn mục tiêu test |\n| **Precondition** | Điều kiện trước khi chạy test |\n| **Steps** | Các bước thực hiện |\n| **Expected Result** | Kết quả mong đợi |\n\n## Bài tập\n\nViết hàm \`isValidEmail(email)\` trả về \`true\` nếu email hợp lệ.\n\n**Điều kiện hợp lệ:**\n- Có ký tự \`@\`\n- Có tên miền sau \`@\` (ví dụ: \`gmail.com\`)\n- Không có khoảng trắng\n\n## Ví dụ\n\n\`\`\`js\nisValidEmail('user@gmail.com') // true\nisValidEmail('invalid-email')  // false\nisValidEmail('a @b.com')       // false\n\`\`\``,
      initialSnippet: `/**\n * Viết hàm isValidEmail(email) bên dưới.\n * Trả về true nếu email hợp lệ, false nếu không.\n */\nfunction isValidEmail(email) {\n  // TODO: implement\n}\n`,
      testScript: `assert('Email hợp lệ cơ bản', isValidEmail('user@gmail.com') === true);\nassert('Email thiếu @', isValidEmail('invalidemail') === false);\nassert('Email có khoảng trắng', isValidEmail('a b@gmail.com') === false);\nassert('Email thiếu tên miền', isValidEmail('user@') === false);\nassert('Email trống', isValidEmail('') === false);\n`,
      solution: `function isValidEmail(email) {\n  if (!email || email.includes(' ')) return false;\n  const parts = email.split('@');\n  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');\n}`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'phan-loai-bug' },
    update: {},
    create: {
      seriesId: series1.id,
      title: 'Phân loại Bug: Critical, Major, Minor, Trivial',
      slug: 'phan-loai-bug',
      sandboxType: 'js_worker',
      objective: 'Phân loại mức độ nghiêm trọng (Severity) của bug',
      instructions: `# Phân loại mức độ Bug\n\nMỗi bug có mức độ ảnh hưởng khác nhau:\n\n- **Critical** 🔴 — Hệ thống sập, mất tiền, không thể dùng\n- **Major** 🟠 — Tính năng chính bị lỗi nhưng có cách đi vòng\n- **Minor** 🟡 — Tính năng bị ảnh hưởng nhẹ, vẫn dùng được\n- **Trivial** ⚪ — Lỗi UI nhỏ, không ảnh hưởng tính năng\n\n## Bài tập\n\nViết hàm \`classifyBug(description)\` nhận mô tả bug và trả về mức độ severity.\n\n**Quy tắc đơn giản:**\n- Chứa \`'crash'\` hoặc \`'data loss'\` → \`'critical'\`\n- Chứa \`'broken'\` hoặc \`'error'\` → \`'major'\`\n- Chứa \`'slow'\` hoặc \`'wrong'\` → \`'minor'\`\n- Còn lại → \`'trivial'\``,
      initialSnippet: `/**\n * Phân loại bug dựa theo mô tả.\n * @param {string} description - Mô tả bug\n * @returns {'critical' | 'major' | 'minor' | 'trivial'}\n */\nfunction classifyBug(description) {\n  const desc = description.toLowerCase();\n  // TODO: implement\n}\n`,
      testScript: `assert('Crash = Critical', classifyBug('App crash on login') === 'critical');\nassert('Data loss = Critical', classifyBug('data loss on submit') === 'critical');\nassert('Broken = Major', classifyBug('Broken checkout flow') === 'major');\nassert('Error = Major', classifyBug('Error 500 on save') === 'major');\nassert('Slow = Minor', classifyBug('slow loading on dashboard') === 'minor');\nassert('Typo = Trivial', classifyBug('typo in footer text') === 'trivial');\n`,
      solution: `function classifyBug(description) {\n  const d = description.toLowerCase();\n  if (d.includes('crash') || d.includes('data loss')) return 'critical';\n  if (d.includes('broken') || d.includes('error')) return 'major';\n  if (d.includes('slow') || d.includes('wrong')) return 'minor';\n  return 'trivial';\n}`,
      durationMinutes: 25,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 2,
      isActive: true,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'http-methods-co-ban' },
    update: {},
    create: {
      seriesId: series2.id,
      title: 'HTTP Methods: GET, POST, PUT, DELETE',
      slug: 'http-methods-co-ban',
      sandboxType: 'js_worker',
      objective: 'Nắm vững các phương thức giao tiếp API RESTful',
      instructions: `# HTTP Methods cơ bản\n\nCác phương thức HTTP được dùng để thực hiện các thao tác CRUD:\n\n| Method | Mục đích | Idempotent? |\n|---|---|---|\n| **GET** | Lấy dữ liệu | ✅ Có |\n| **POST** | Tạo mới | ❌ Không |\n| **PUT** | Cập nhật toàn bộ | ✅ Có |\n| **PATCH** | Cập nhật một phần | ✅ Có |\n| **DELETE** | Xóa | ✅ Có |\n\n## Bài tập\n\nViết hàm \`getHttpMethod(action)\` trả về HTTP method phù hợp.\n\n**Mapping:**\n- \`'create'\` → \`'POST'\`\n- \`'read'\` → \`'GET'\`\n- \`'update'\` → \`'PUT'\`\n- \`'delete'\` → \`'DELETE'\``,
      initialSnippet: `/**\n * Trả về HTTP method phù hợp cho action CRUD.\n * @param {'create'|'read'|'update'|'delete'} action\n * @returns {string}\n */\nfunction getHttpMethod(action) {\n  // TODO: implement\n}\n`,
      testScript: `assert('create → POST', getHttpMethod('create') === 'POST');\nassert('read → GET', getHttpMethod('read') === 'GET');\nassert('update → PUT', getHttpMethod('update') === 'PUT');\nassert('delete → DELETE', getHttpMethod('delete') === 'DELETE');\n`,
      solution: `function getHttpMethod(action) {\n  const map = { create: 'POST', read: 'GET', update: 'PUT', delete: 'DELETE' };\n  return map[action] || 'GET';\n}`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
    },
  });

  // 3. Seed Platform Features
  const fRunWorker = await prisma.feature.upsert({
    where: { code: 'RUN_JS_WORKER' },
    update: {},
    create: {
      code: 'RUN_JS_WORKER',
      name: 'Run Code In Browser',
      description: 'Execute JavaScript code within secure in-browser Web Workers',
      category: 'lab_execution',
      isActive: true,
    },
  });

  const fSubmitLab = await prisma.feature.upsert({
    where: { code: 'SUBMIT_LAB' },
    update: {},
    create: {
      code: 'SUBMIT_LAB',
      name: 'Submit Practice Lab',
      description: 'Submit lab attempts and record score on user progress dashboard',
      category: 'lab_execution',
      isActive: true,
    },
  });

  const fViewSolution = await prisma.feature.upsert({
    where: { code: 'VIEW_SOLUTION' },
    update: {},
    create: {
      code: 'VIEW_SOLUTION',
      name: 'View Practice Solution',
      description: 'Unlock and view official verified solution code for practice labs',
      category: 'content_access',
      isActive: true,
    },
  });

  const fAiMentor = await prisma.feature.upsert({
    where: { code: 'AI_CODE_REVIEW' },
    update: {},
    create: {
      code: 'AI_CODE_REVIEW',
      name: 'AI Code Mentor',
      description: 'Get automated AI hints and code review feedback when tests fail',
      category: 'ai_assistant',
      isActive: true,
    },
  });

  const fDownloadRepo = await prisma.feature.upsert({
    where: { code: 'DOWNLOAD_REPO' },
    update: {},
    create: {
      code: 'DOWNLOAD_REPO',
      name: 'Download Source Code',
      description: 'Export and download complete project repository codebases',
      category: 'system_operation',
      isActive: true,
    },
  });

  // 4. Seed Subscription Plans
  const planFree = await prisma.subscriptionPlan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      code: 'FREE',
      name: 'Free Tier',
      description: 'Standard free access for beginners to practice basic labs',
      price: 0,
      billingCycle: 'FREE',
      isDefault: true,
      isActive: true,
    },
  });

  const planProMonthly = await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO_MONTHLY' },
    update: {},
    create: {
      code: 'PRO_MONTHLY',
      name: 'Pro Student (Monthly)',
      description: 'Full access to solutions, AI review, and premium practice labs',
      price: 199000,
      billingCycle: 'MONTHLY',
      isDefault: false,
      isActive: true,
    },
  });

  const planProYearly = await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO_YEARLY' },
    update: {},
    create: {
      code: 'PRO_YEARLY',
      name: 'Pro Student (Yearly)',
      description: 'Annual VIP membership with full access and priority support',
      price: 1990000,
      billingCycle: 'YEARLY',
      isDefault: false,
      isActive: true,
    },
  });

  // 5. Map Features to Plans
  const freeFeatureIds = [fRunWorker.id, fSubmitLab.id];
  for (const featureId of freeFeatureIds) {
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: planFree.id, featureId } },
      update: {},
      create: { planId: planFree.id, featureId },
    });
  }

  const proFeatureIds = [
    fRunWorker.id,
    fSubmitLab.id,
    fViewSolution.id,
    fAiMentor.id,
    fDownloadRepo.id,
  ];
  for (const featureId of proFeatureIds) {
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: planProMonthly.id, featureId } },
      update: {},
      create: { planId: planProMonthly.id, featureId },
    });
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: planProYearly.id, featureId } },
      update: {},
      create: { planId: planProYearly.id, featureId },
    });
  }

  console.log('✅ Seed completed successfully with Features & Plans!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
