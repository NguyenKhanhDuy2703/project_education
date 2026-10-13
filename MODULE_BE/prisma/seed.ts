import { PrismaClient, UserRole, ContentLifecycleStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with IAM Groups, Personas & Content Lifecycle...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Personas
  const adminUser = await prisma.user.upsert({
    where: { phone: '0900000001' },
    update: {
      role: UserRole.admin,
      email: 'admin@studyweb.dev',
      name: 'Super Admin',
    },
    create: {
      id: 'u0000000-0000-0000-0000-000000000001',
      name: 'Super Admin',
      email: 'admin@studyweb.dev',
      phone: '0900000001',
      password: defaultPasswordHash,
      role: UserRole.admin,
      isActive: true,
    },
  });

  const contributorUser = await prisma.user.upsert({
    where: { phone: '0900000002' },
    update: {
      role: UserRole.contributor,
      email: 'contributor@studyweb.dev',
      name: 'Alex Contributor',
    },
    create: {
      id: 'u0000000-0000-0000-0000-000000000002',
      name: 'Alex Contributor',
      email: 'contributor@studyweb.dev',
      phone: '0900000002',
      password: defaultPasswordHash,
      role: UserRole.contributor,
      isActive: true,
    },
  });

  const proStudent = await prisma.user.upsert({
    where: { phone: '0900000003' },
    update: {
      role: UserRole.userPro,
      email: 'vip.student@studyweb.dev',
      name: 'Minh Pro Student',
    },
    create: {
      id: 'u0000000-0000-0000-0000-000000000003',
      name: 'Minh Pro Student',
      email: 'vip.student@studyweb.dev',
      phone: '0900000003',
      password: defaultPasswordHash,
      role: UserRole.userPro,
      isActive: true,
    },
  });

  const freeStudent = await prisma.user.upsert({
    where: { phone: '0900000004' },
    update: {
      role: UserRole.user,
      email: 'free.student@studyweb.dev',
      name: 'Nam Free Student',
    },
    create: {
      id: 'u0000000-0000-0000-0000-000000000004',
      name: 'Nam Free Student',
      email: 'free.student@studyweb.dev',
      phone: '0900000004',
      password: defaultPasswordHash,
      role: UserRole.user,
      isActive: true,
    },
  });

  // 2. Seed Platform Features
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

  // 3. Seed Permissions
  const permissionsData = [
    { code: 'content:create', name: 'Create Draft Content', module: 'content', description: 'Create draft topics, series, and labs' },
    { code: 'content:edit_own', name: 'Edit Own Content', module: 'content', description: 'Edit self-authored drafts and revisions' },
    { code: 'content:submit_review', name: 'Submit for Review', module: 'content', description: 'Submit content draft to review queue' },
    { code: 'content:publish', name: 'Direct Publish Content', module: 'content', description: 'Publish or unpublish content directly' },
    { code: 'admin:review_queue', name: 'Access Review Queue', module: 'admin', description: 'Review, approve, or reject submissions' },
    { code: 'admin:manage_groups', name: 'Manage IAM Groups', module: 'admin', description: 'Manage user groups and plan assignments' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    permissions[perm.code] = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

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

  // Map Permissions to Pro Yearly (used for IAM Admin/Contributor testing)
  const contributorPermCodes = ['content:create', 'content:edit_own', 'content:submit_review'];
  for (const code of contributorPermCodes) {
    await prisma.planPermission.upsert({
      where: { planId_permissionId: { planId: planProYearly.id, permissionId: permissions[code].id } },
      update: {},
      create: { planId: planProYearly.id, permissionId: permissions[code].id },
    });
  }

  // 6. Seed IAM User Groups
  const grpAdmin = await prisma.userGroup.upsert({
    where: { code: 'SUPER_ADMINS' },
    update: {},
    create: {
      code: 'SUPER_ADMINS',
      name: 'System Administrators',
      description: 'Full root access to review queue, user management, and system config',
      isActive: true,
    },
  });

  const grpContributor = await prisma.userGroup.upsert({
    where: { code: 'CONTRIBUTOR_TEAM' },
    update: {},
    create: {
      code: 'CONTRIBUTOR_TEAM',
      name: 'Content Contributor Team',
      description: 'Curators and educators with topic, series, and lab authoring access',
      isActive: true,
    },
  });

  const grpVip = await prisma.userGroup.upsert({
    where: { code: 'VIP_PRO_ANNUAL' },
    update: {},
    create: {
      code: 'VIP_PRO_ANNUAL',
      name: 'VIP Pro Members',
      description: 'Active annual subscribers with unlimited cloud runner access',
      isActive: true,
    },
  });

  const grpStandard = await prisma.userGroup.upsert({
    where: { code: 'STUDENT_STANDARD' },
    update: {},
    create: {
      code: 'STUDENT_STANDARD',
      name: 'Standard Student Cohort',
      description: 'Community members practicing fundamental exercises',
      isActive: true,
    },
  });

  // Assign Plans to Groups (AWS IAM Group Model)
  await prisma.groupPlan.upsert({
    where: { groupId_planId: { groupId: grpAdmin.id, planId: planProYearly.id } },
    update: {},
    create: { groupId: grpAdmin.id, planId: planProYearly.id },
  });

  await prisma.groupPlan.upsert({
    where: { groupId_planId: { groupId: grpContributor.id, planId: planProYearly.id } },
    update: {},
    create: { groupId: grpContributor.id, planId: planProYearly.id },
  });

  await prisma.groupPlan.upsert({
    where: { groupId_planId: { groupId: grpVip.id, planId: planProYearly.id } },
    update: {},
    create: { groupId: grpVip.id, planId: planProYearly.id },
  });

  await prisma.groupPlan.upsert({
    where: { groupId_planId: { groupId: grpStandard.id, planId: planFree.id } },
    update: {},
    create: { groupId: grpStandard.id, planId: planFree.id },
  });

  // Assign Users to Groups
  await prisma.userGroupMember.upsert({
    where: { userId_groupId: { userId: adminUser.id, groupId: grpAdmin.id } },
    update: {},
    create: { userId: adminUser.id, groupId: grpAdmin.id },
  });

  await prisma.userGroupMember.upsert({
    where: { userId_groupId: { userId: contributorUser.id, groupId: grpContributor.id } },
    update: {},
    create: { userId: contributorUser.id, groupId: grpContributor.id },
  });

  await prisma.userGroupMember.upsert({
    where: { userId_groupId: { userId: proStudent.id, groupId: grpVip.id } },
    update: {},
    create: { userId: proStudent.id, groupId: grpVip.id },
  });

  await prisma.userGroupMember.upsert({
    where: { userId_groupId: { userId: freeStudent.id, groupId: grpStandard.id } },
    update: {},
    create: { userId: freeStudent.id, groupId: grpStandard.id },
  });

  // 7. Seed Series & Labs (4 Topics & 11 Labs hoàn chỉnh)

  // ── Topic 1: Testing Cơ Bản (QA/QC) ───────────────────────────────────
  const seriesTesting = await prisma.labSeries.upsert({
    where: { slug: 'testing-co-ban' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'testing',
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      title: 'Testing Cơ Bản cho Người Mới',
      slug: 'testing-co-ban',
      category: 'testing',
      description: 'Học cách viết Test Case, kiểm thử manual và hiểu quy trình QA từ đầu. Phù hợp hoàn toàn cho người chưa có kinh nghiệm.',
      level: 'beginner',
      coverEmoji: '📚',
      orderIndex: 1,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'test-case-la-gi' },
    update: { seriesId: seriesTesting.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesTesting.id,
      title: 'Test Case là gì? Viết test case đầu tiên',
      slug: 'test-case-la-gi',
      sandboxType: 'js_worker',
      objective: 'Hiểu cấu trúc và viết test case kiểm thử email',
      instructions: `# Test Case là gì?\n\nMột **Test Case** là tập hợp các bước kiểm thử để xác nhận một tính năng hoạt động đúng.\n\n### Nhiệm vụ:\nHoàn thành hàm \`isValidEmail(email)\` trả về \`true\` nếu email hợp lệ.`,
      initialSnippet: `function isValidEmail(email) {\n  // TODO: kiểm tra email có chứa '@' và kết thúc bằng '.com'\n  return false;\n}\n`,
      testScript: `assert('Email chuẩn', isValidEmail('user@gmail.com') === true);\nassert('Thiếu @', isValidEmail('usergmail.com') === false);\n`,
      solution: `function isValidEmail(email) {\n  return email.includes('@') && email.endsWith('.com');\n}`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'phan-loai-bug' },
    update: { seriesId: seriesTesting.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesTesting.id,
      title: 'Phân loại Bug: Critical, Major, Minor, Trivial',
      slug: 'phan-loai-bug',
      sandboxType: 'js_worker',
      objective: 'Phân loại mức độ nghiêm trọng (Severity) của bug',
      instructions: `# Phân loại mức độ Bug\n\nMỗi bug có mức độ ảnh hưởng khác nhau:\n- **Critical**: Hệ thống sập, mất tiền, không thể dùng.\n- **Major**: Tính năng chính lỗi nhưng có cách đi vòng.\n- **Minor**: Lỗi giao diện nhỏ, chính tả.\n\n### Nhiệm vụ:\nViết hàm \`classifyBug(type)\` phân loại đúng severity.`,
      initialSnippet: `function classifyBug(type) {\n  // TODO: Return 'critical', 'major', or 'minor'\n  return 'minor';\n}\n`,
      testScript: `assert('Crash -> critical', classifyBug('crash') === 'critical');\nassert('UI typo -> minor', classifyBug('typo') === 'minor');\n`,
      solution: `function classifyBug(type) {\n  if (type === 'crash') return 'critical';\n  if (type === 'typo') return 'minor';\n  return 'major';\n}`,
      durationMinutes: 25,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 2,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'viet-test-case-api-postman' },
    update: { seriesId: seriesTesting.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesTesting.id,
      title: 'API Response Schema Validation Test Cases',
      slug: 'viet-test-case-api-postman',
      sandboxType: 'js_worker',
      objective: 'Viết assertions kiểm tra status 200 và cấu trúc payload JSON',
      instructions: `# Kiểm tra API Response Schema\n\nKiểm thử tự động API cần đảm bảo response code là 200 và chứa các trường bắt buộc (\`id\`, \`token\`).`,
      initialSnippet: `function validateAuthResponse(res) {\n  // TODO: return true nếu res.status === 200 và có token\n  return false;\n}\n`,
      testScript: `assert('Status 200 có token', validateAuthResponse({ status: 200, data: { token: 'xyz' } }) === true);\n`,
      solution: `function validateAuthResponse(res) {\n  return res.status === 200 && Boolean(res.data?.token);\n}`,
      durationMinutes: 30,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 3,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  // ── Topic 2: Database & SQL ───────────────────────────────────────────
  const seriesSql = await prisma.labSeries.upsert({
    where: { slug: 'sql-database-fundamentals' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'database',
    },
    create: {
      title: 'Database & SQL Fundamentals',
      slug: 'sql-database-fundamentals',
      category: 'database',
      description: 'Làm chủ các câu lệnh truy vấn SQL từ cơ bản đến nâng cao: SELECT, WHERE, GROUP BY, JOIN và tối ưu hóa hiệu năng index.',
      level: 'beginner',
      coverEmoji: '🗄️',
      orderIndex: 2,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'loc-khach-hang-vip-sql' },
    update: { seriesId: seriesSql.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesSql.id,
      title: 'Lọc khách hàng VIP bằng câu lệnh SQL WHERE',
      slug: 'loc-khach-hang-vip-sql',
      sandboxType: 'sql_worker',
      objective: 'Sử dụng mệnh đề WHERE và điều kiện lọc số tiền chi tiêu > 10,000,000 VNĐ',
      instructions: `# Lọc Khách Hàng VIP\n\nCho bảng \`customers(id, name, total_spent, is_active)\`.\n\nHãy viết câu lệnh SQL để lấy tất cả khách hàng VIP có \`total_spent >= 10000000\` và \`is_active = true\`.`,
      initialSnippet: `SELECT id, name, total_spent\nFROM customers\nWHERE total_spent >= 10000000 AND is_active = true;`,
      testScript: `assert('SELECT Query', code.toUpperCase().includes('WHERE') && code.toUpperCase().includes('TOTAL_SPENT'));`,
      solution: `SELECT id, name, total_spent FROM customers WHERE total_spent >= 10000000 AND is_active = true;`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'kiem-tra-indexing-db' },
    update: { seriesId: seriesSql.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesSql.id,
      title: 'Kiểm tra kiến thức Indexing & Hiệu năng Database',
      slug: 'kiem-tra-indexing-db',
      sandboxType: 'quizlet',
      objective: 'Hiểu cấu trúc B-Tree Index và cách tránh Sequential Scan trong PostgreSQL',
      instructions: `# Trắc Nghiệm: Tối Ưu Hóa Index trong Database\n\n1. Khi nào nên tạo Index?\n2. Composite Index hoạt động theo thứ tự nào?`,
      initialSnippet: `// Trắc nghiệm kiểm tra kiến thức Indexing`,
      testScript: `assert('Index Quiz', true);`,
      solution: `// B-Tree Index là lựa chọn mặc định tốt nhất cho truy vấn đẳng thức và phạm vi.`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 2,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'truy-van-join-nhieu-bang' },
    update: { seriesId: seriesSql.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesSql.id,
      title: 'Truy vấn JOIN nhiều bảng trong PostgreSQL',
      slug: 'truy-van-join-nhieu-bang',
      sandboxType: 'sql_worker',
      objective: 'Liên kết bảng orders và order_items bằng INNER JOIN',
      instructions: `# Truy Vấn INNER JOIN\n\nNối bảng \`orders\` với \`order_items\` theo \`order_id\` để tính tổng tiền của từng đơn hàng.`,
      initialSnippet: `SELECT o.id, o.customer_name, SUM(i.price * i.quantity) AS total\nFROM orders o\nINNER JOIN order_items i ON o.id = i.order_id\nGROUP BY o.id, o.customer_name;`,
      testScript: `assert('JOIN query', code.toUpperCase().includes('JOIN'));`,
      solution: `SELECT o.id, o.customer_name, SUM(i.price * i.quantity) AS total FROM orders o INNER JOIN order_items i ON o.id = i.order_id GROUP BY o.id, o.customer_name;`,
      durationMinutes: 25,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 3,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  // ── Topic 3: Backend API với NestJS ───────────────────────────────────
  const seriesNest = await prisma.labSeries.upsert({
    where: { slug: 'nestjs-api-co-ban' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'backend',
    },
    create: {
      title: 'Xây dựng RESTful API chuyên nghiệp với NestJS',
      slug: 'nestjs-api-co-ban',
      category: 'backend',
      description: 'Lập trình Backend hiện đại bằng TypeScript, Dependency Injection, Validation Pipes và Guard phân quyền.',
      level: 'intermediate',
      coverEmoji: '🚀',
      orderIndex: 3,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'http-methods-co-ban' },
    update: { seriesId: seriesNest.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesNest.id,
      title: 'HTTP Methods: GET, POST, PUT, DELETE trong API',
      slug: 'http-methods-co-ban',
      sandboxType: 'js_worker',
      objective: 'Sử dụng đúng phương thức HTTP cho từng hành động CRUD',
      instructions: `# HTTP Methods Chuẩn RESTful\n\n- GET: Đọc dữ liệu\n- POST: Tạo mới\n- PUT: Cập nhật toàn bộ\n- DELETE: Xóa dữ liệu`,
      initialSnippet: `function getMethodForAction(action) {\n  // TODO: return 'GET' | 'POST' | 'PUT' | 'DELETE'\n  return 'GET';\n}\n`,
      testScript: `assert('create -> POST', getMethodForAction('create') === 'POST');\nassert('read -> GET', getMethodForAction('read') === 'GET');\n`,
      solution: `function getMethodForAction(action) {\n  const map = { create: 'POST', read: 'GET', update: 'PUT', delete: 'DELETE' };\n  return map[action] || 'GET';\n}`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'tao-controller-service-nestjs' },
    update: { seriesId: seriesNest.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesNest.id,
      title: 'Tạo Controller & Service theo Dependency Injection',
      slug: 'tao-controller-service-nestjs',
      sandboxType: 'js_worker',
      objective: 'Khởi tạo NestJS service và tiêm vào controller qua constructor',
      instructions: `# Dependency Injection trong NestJS\n\nThực hành nguyên lý IoC (Inversion of Control) bằng cách truyền Service vào Controller.`,
      initialSnippet: `class UsersService {\n  getUsers() { return ['Alice', 'Bob']; }\n}\nclass UsersController {\n  constructor(private service) {}\n  findAll() { return this.service.getUsers(); }\n}\n`,
      testScript: `const c = new UsersController(new UsersService());\nassert('findAll returns users', c.findAll().length === 2);\n`,
      solution: `class UsersService {\n  getUsers() { return ['Alice', 'Bob']; }\n}\nclass UsersController {\n  constructor(service) { this.service = service; }\n  findAll() { return this.service.getUsers(); }\n}`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 2,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'bao-mat-endpoint-jwt-guard' },
    update: { seriesId: seriesNest.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesNest.id,
      title: 'Bảo vệ Endpoint với JWT AuthGuard & Cookie',
      slug: 'bao-mat-endpoint-jwt-guard',
      sandboxType: 'js_worker',
      objective: 'Viết logic kiểm tra token JWT hợp lệ từ Header Authorization',
      instructions: `# JWT Guard Authentication\n\nTrích xuất Bearer token từ Request Header và verify tính toàn vẹn của token.`,
      initialSnippet: `function verifyAuthHeader(header) {\n  // TODO: return true nếu header bắt đầu bằng 'Bearer '\n  return false;\n}\n`,
      testScript: `assert('Valid Bearer', verifyAuthHeader('Bearer eyJhbGci...') === true);\nassert('Missing Bearer', verifyAuthHeader('Basic 1234') === false);\n`,
      solution: `function verifyAuthHeader(header) {\n  return typeof header === 'string' && header.startsWith('Bearer ') && header.length > 10;\n}`,
      durationMinutes: 25,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 3,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  // ── Topic 4: DevOps & Docker ──────────────────────────────────────────
  const seriesDocker = await prisma.labSeries.upsert({
    where: { slug: 'docker-co-ban' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'devops',
    },
    create: {
      title: 'DevOps & Docker cho Lập trình viên',
      slug: 'docker-co-ban',
      category: 'devops',
      description: 'Đóng gói ứng dụng thành container độc lập, tối ưu kích thước image nhiều tầng (multi-stage build) và orchestration với Docker Compose.',
      level: 'intermediate',
      coverEmoji: '🐳',
      orderIndex: 4,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'viet-dockerfile-nodejs' },
    update: { seriesId: seriesDocker.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesDocker.id,
      title: 'Viết Dockerfile chuẩn Production cho Node.js',
      slug: 'viet-dockerfile-nodejs',
      sandboxType: 'js_worker',
      objective: 'Viết các chỉ thị FROM, WORKDIR, COPY, RUN npm install, CMD chuẩn hóa',
      instructions: `# Viết Dockerfile Cho Node.js\n\nÁp dụng kỹ thuật copy file \`package*.json\` trước để tận dụng Docker layer cache.`,
      initialSnippet: `function validateDockerfileInstructions(instructions) {\n  // TODO: kiểm tra có chứa FROM, WORKDIR, COPY, CMD\n  return false;\n}\n`,
      testScript: `assert('Dockerfile valid', validateDockerfileInstructions(['FROM node:20', 'WORKDIR /app', 'COPY . .', 'CMD npm start']) === true);\n`,
      solution: `function validateDockerfileInstructions(instructions) {\n  const s = instructions.join(' ');\n  return s.includes('FROM') && s.includes('WORKDIR') && s.includes('CMD');\n}`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'docker-compose-multi-service' },
    update: { seriesId: seriesDocker.id, authorId: contributorUser.id, status: ContentLifecycleStatus.published },
    create: {
      seriesId: seriesDocker.id,
      title: 'Kết nối NestJS và PostgreSQL với Docker Compose',
      slug: 'docker-compose-multi-service',
      sandboxType: 'js_worker',
      objective: 'Cấu hình docker-compose.yml định nghĩa services, ports, environment và volumes',
      instructions: `# Multi-container Orchestration\n\nThiết lập liên kết giữa ứng dụng backend và container cơ sở dữ liệu PostgreSQL qua mạng nội bộ Docker bridge.`,
      initialSnippet: `function parseComposeServices(yamlContent) {\n  // TODO: return true nếu có cả service 'app' và 'postgres'\n  return false;\n}\n`,
      testScript: `assert('Has app and db', parseComposeServices('services:\n  app:\n  postgres:') === true);\n`,
      solution: `function parseComposeServices(yaml) {\n  return yaml.includes('app:') && yaml.includes('postgres:');\n}`,
      durationMinutes: 25,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 2,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  console.log('✅ Seed completed successfully with 4 Series and 11 Labs into PostgreSQL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
