import { PrismaClient, UserRole, ContentLifecycleStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertRows(table: string, rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  const values = rows
    .map((row) => `(${columns.map((column) => sqlLiteral(row[column])).join(', ')})`)
    .join(',\n');
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values};`;
}

async function main() {
  console.log('🌱 Seeding database with IAM Groups, Personas & Content Lifecycle...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Personas
  const adminUser = await prisma.user.upsert({
    where: { email: 'nguyenkhanhduy270304@gmail.com' },
    update: {
      role: UserRole.admin,
      name: 'Nguyễn Khánh Duy',
      isActive: true,
      password: defaultPasswordHash,
    },
    create: {
      id: '1e154f74-4e46-4f81-b03d-e5fe949f27ae',
      name: 'Nguyễn Khánh Duy',
      email: 'nguyenkhanhduy270304@gmail.com',
      phone: '0889266484',
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
      password: defaultPasswordHash,
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

  const additionalContributorsData = [
    {
      id: 'b38a7563-cebc-47b1-952c-9495a152859d',
      name: 'Trang Lieu',
      email: 'lieutrang236@gmail.com',
      phone: 'google_109052768646977192191',
      googleId: '109052768646977192191',
    },
    {
      id: 'c8104283-1830-4358-a5b6-5aeac68a5085',
      name: 'Phan Nguyễn Anh Thư',
      email: 'anhthuphan0102@gmail.com',
      phone: '0911309340',
      googleId: null,
    },
    {
      id: 'be3c51ca-0ad2-4a34-a3d3-df229d675afa',
      name: 'Đinh Ngọc Hân',
      email: 'ngochawn123@gmail.com',
      phone: '0905965498',
      googleId: null,
    },
  ];

  for (const c of additionalContributorsData) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {
        role: UserRole.contributor,
        name: c.name,
        isActive: true,
        googleId: c.googleId,
        phone: c.phone,
      },
      create: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        googleId: c.googleId,
        role: UserRole.contributor,
        isActive: true,
        password: defaultPasswordHash,
      },
    });
  }

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

  for (const c of additionalContributorsData) {
    await prisma.userGroupMember.upsert({
      where: { userId_groupId: { userId: c.id, groupId: grpContributor.id } },
      update: {},
      create: { userId: c.id, groupId: grpContributor.id },
    });
  }

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

  // 7. CLEANUP & PURGE OLD MOCK SERIES/LABS
  console.log('🧹 Purging old sample courses, labs, and submissions...');
  await prisma.labSubmission.deleteMany({});
  await prisma.lab.deleteMany({});
  await prisma.labSeries.deleteMany({});

  console.log('🚀 Seeding curated courses: SQL, Testing Quizel & Automation Test Syntax...');

  // ── Series 1: W3Schools SQL Fundamentals ──────────────────────────────
  const seriesW3Sql = await prisma.labSeries.upsert({
    where: { slug: 'w3schools-sql-fundamentals' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'database',
      orderIndex: 1,
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      title: 'W3Schools SQL Fundamentals',
      slug: 'w3schools-sql-fundamentals',
      category: 'database',
      description: 'Làm chủ 10 câu lệnh truy vấn SQL kinh điển theo chuẩn giáo trình W3Schools: SELECT, DISTINCT, WHERE, ORDER BY, AND/OR, LIKE, IN, BETWEEN, COUNT, GROUP BY.',
      level: 'beginner',
      coverEmoji: '🗄️',
      orderIndex: 1,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  const customersSampleData = [
    { CustomerID: 1, CustomerName: 'Alfreds Futterkiste', ContactName: 'Maria Anders', Address: 'Obere Str. 57', City: 'Berlin', PostalCode: '12209', Country: 'Germany' },
    { CustomerID: 2, CustomerName: 'Ana Trujillo Emparedados y helados', ContactName: 'Ana Trujillo', Address: 'Avda. de la Constitución 2222', City: 'México D.F.', PostalCode: '05021', Country: 'Mexico' },
    { CustomerID: 3, CustomerName: 'Antonio Moreno Taquería', ContactName: 'Antonio Moreno', Address: 'Mataderos 2312', City: 'México D.F.', PostalCode: '05023', Country: 'Mexico' },
    { CustomerID: 4, CustomerName: 'Around the Horn', ContactName: 'Thomas Hardy', Address: '120 Hanover Sq.', City: 'London', PostalCode: 'WA1 1DP', Country: 'UK' },
    { CustomerID: 5, CustomerName: 'Berglunds snabbköp', ContactName: 'Christina Berglund', Address: 'Berguvsvägen 8', City: 'Luleå', PostalCode: 'S-958 22', Country: 'Sweden' },
    { CustomerID: 7, CustomerName: 'Blondel père et fils', ContactName: 'Frédérique Citeaux', Address: '24, place Kléber', City: 'Strasbourg', PostalCode: '67000', Country: 'France' },
    { CustomerID: 13, CustomerName: 'Centro comercial Moctezuma', ContactName: 'Francisco Chang', Address: 'Sierras de Granada 9993', City: 'México D.F.', PostalCode: '05022', Country: 'Mexico' },
  ];

  const productsSampleData = [
    { ProductID: 1, ProductName: 'Chais', CategoryID: 1, Unit: '10 boxes x 20 bags', Price: 18 },
    { ProductID: 2, ProductName: 'Chang', CategoryID: 1, Unit: '24 - 12 oz bottles', Price: 19 },
    { ProductID: 3, ProductName: 'Aniseed Syrup', CategoryID: 2, Unit: '12 - 550 ml bottles', Price: 10 },
    { ProductID: 4, ProductName: "Chef Anton's Cajun Seasoning", CategoryID: 2, Unit: '48 - 6 oz jars', Price: 22 },
    { ProductID: 5, ProductName: "Chef Anton's Gumbo Mix", CategoryID: 2, Unit: '36 boxes', Price: 21.35 },
    { ProductID: 6, ProductName: "Grandma's Boysenberry Spread", CategoryID: 2, Unit: '12 - 8 oz jars', Price: 25 },
  ];
  const customersSchemaSql = `CREATE TABLE Customers (
    CustomerID INTEGER PRIMARY KEY,
    CustomerName TEXT NOT NULL,
    ContactName TEXT NOT NULL,
    Address TEXT NOT NULL,
    City TEXT NOT NULL,
    PostalCode TEXT NOT NULL,
    Country TEXT NOT NULL
  );`;
  const productsSchemaSql = `CREATE TABLE Products (
    ProductID INTEGER PRIMARY KEY,
    ProductName TEXT NOT NULL,
    CategoryID INTEGER NOT NULL,
    Unit TEXT NOT NULL,
    Price NUMERIC(10, 2) NOT NULL
  );`;
  const customersSeedSql = insertRows('Customers', customersSampleData);
  const productsSeedSql = insertRows('Products', productsSampleData);

  const sqlLabs = [
    {
      slug: 'w3schools-sql-01-select',
      title: 'W3Schools SQL 01: Câu Lệnh SELECT',
      summary: 'Lấy tất cả cột từ bảng Customers',
      sampleData: customersSampleData,
      expectedQueryResult: customersSampleData,
      instructions: `# W3Schools SQL 01: Câu Lệnh SELECT\n\nCâu lệnh \`SELECT\` được sử dụng để đọc và truy xuất dữ liệu từ một cơ sở dữ liệu.\n\n### Bảng dữ liệu: \`Customers\`\nCấu trúc các cột: \`CustomerID\`, \`CustomerName\`, \`ContactName\`, \`Address\`, \`City\`, \`PostalCode\`, \`Country\`.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để truy vấn toàn bộ dữ liệu (tất cả các cột) từ bảng \`Customers\`.`,
      initialSnippet: `SELECT * FROM Customers;`,
      testScript: `assert('Truy vấn bảng Customers', code.toUpperCase().includes('FROM CUSTOMERS') || code.toUpperCase().includes('FROM "CUSTOMERS"'));`,
      solution: `SELECT * FROM Customers;`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
    },
    {
      slug: 'w3schools-sql-02-select-columns',
      title: 'W3Schools SQL 02: SELECT Cột Cụ Thể',
      summary: 'Chỉ lấy 2 cột CustomerName và City từ bảng Customers',
      sampleData: customersSampleData,
      expectedQueryResult: customersSampleData.map((r) => ({ CustomerName: r.CustomerName, City: r.City })),
      instructions: `# W3Schools SQL 02: SELECT Cột Cụ Thể\n\nThay vì dùng \`*\` để lấy toàn bộ cột, bạn có thể chỉ định chính xác tên các cột cần lấy, ngăn cách nhau bởi dấu phẩy.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL chỉ lấy 2 cột \`CustomerName\` và \`City\` từ bảng \`Customers\`.`,
      initialSnippet: `-- Viết câu lệnh SELECT chỉ lấy 2 cột CustomerName và City\nSELECT /* TODO: Điền CustomerName, City */\nFROM Customers;`,
      testScript: `assert('Lấy đúng 2 cột CustomerName và City', code.toUpperCase().includes('CUSTOMERNAME') && code.toUpperCase().includes('CITY') && code.toUpperCase().includes('FROM CUSTOMERS'));`,
      solution: `SELECT CustomerName, City FROM Customers;`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 2,
    },
    {
      slug: 'w3schools-sql-03-select-distinct',
      title: 'W3Schools SQL 03: SELECT DISTINCT',
      summary: 'Lấy danh sách các quốc gia Country không trùng lặp',
      sampleData: customersSampleData,
      expectedQueryResult: Array.from(new Set(customersSampleData.map((r) => r.Country))).map((c) => ({ Country: c })),
      instructions: `# W3Schools SQL 03: SELECT DISTINCT\n\nTừ khóa \`SELECT DISTINCT\` dùng để trả về danh sách các giá trị khác nhau (loại bỏ các bản ghi trùng lặp).\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để lấy danh sách các quốc gia (\`Country\`) duy nhất từ bảng \`Customers\`.`,
      initialSnippet: `-- Lấy danh sách các Country không trùng lặp\nSELECT /* TODO: Thêm DISTINCT */ Country\nFROM Customers;`,
      testScript: `assert('Có từ khóa DISTINCT cho cột Country', code.toUpperCase().includes('DISTINCT') && code.toUpperCase().includes('COUNTRY') && code.toUpperCase().includes('FROM CUSTOMERS'));`,
      solution: `SELECT DISTINCT Country FROM Customers;`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 3,
    },
    {
      slug: 'w3schools-sql-04-where',
      title: 'W3Schools SQL 04: Mệnh Đề WHERE',
      summary: 'Lọc tất cả khách hàng tại Mexico',
      sampleData: customersSampleData,
      expectedQueryResult: customersSampleData.filter((r) => r.Country === 'Mexico'),
      instructions: `# W3Schools SQL 04: Mệnh Đề WHERE\n\nMệnh đề \`WHERE\` được sử dụng để lọc các bản ghi, chỉ trích xuất những bản ghi thỏa mãn điều kiện chỉ định.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để lấy tất cả khách hàng sống tại quốc gia \`'Mexico'\` từ bảng \`Customers\`.`,
      initialSnippet: `-- Lọc khách hàng có Country là 'Mexico'\nSELECT * FROM Customers\nWHERE /* TODO: Thêm điều kiện Country = 'Mexico' */;`,
      testScript: `assert('Mệnh đề WHERE Country = Mexico', code.toUpperCase().includes('WHERE') && code.toUpperCase().includes('COUNTRY') && code.toUpperCase().includes('MEXICO'));`,
      solution: `SELECT * FROM Customers WHERE Country = 'Mexico';`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 4,
    },
    {
      slug: 'w3schools-sql-05-order-by',
      title: 'W3Schools SQL 05: Sắp Xếp ORDER BY',
      summary: 'Sắp xếp sản phẩm theo Price giảm dần (DESC)',
      sampleData: productsSampleData,
      expectedQueryResult: [...productsSampleData].sort((a, b) => b.Price - a.Price),
      instructions: `# W3Schools SQL 05: Sắp Xếp ORDER BY\n\nTừ khóa \`ORDER BY\` được sử dụng để sắp xếp tập kết quả theo thứ tự tăng dần (\`ASC\`) hoặc giảm dần (\`DESC\`).\n\n### Bảng dữ liệu: \`Products\`\nCấu trúc các cột: \`ProductID\`, \`ProductName\`, \`CategoryID\`, \`Unit\`, \`Price\`.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để lấy toàn bộ sản phẩm từ bảng \`Products\`, sắp xếp theo giá (\`Price\`) giảm dần (\`DESC\`).`,
      initialSnippet: `-- Lấy sản phẩm và sắp xếp theo Price giảm dần\nSELECT * FROM Products\nORDER BY /* TODO: Sắp xếp theo Price DESC */;`,
      testScript: `assert('Sắp xếp ORDER BY Price DESC', code.toUpperCase().includes('ORDER BY') && code.toUpperCase().includes('PRICE') && code.toUpperCase().includes('DESC'));`,
      solution: `SELECT * FROM Products ORDER BY Price DESC;`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 5,
    },
    {
      slug: 'w3schools-sql-06-and-or',
      title: 'W3Schools SQL 06: Toán Tử AND & OR',
      summary: 'Lọc khách hàng sống tại Germany VÀ ở Berlin',
      sampleData: customersSampleData,
      expectedQueryResult: customersSampleData.filter((r) => r.Country === 'Germany' && r.City === 'Berlin'),
      instructions: `# W3Schools SQL 06: Toán Tử AND & OR\n\nToán tử \`AND\` hiển thị bản ghi nếu TẤT CẢ các điều kiện đều đúng. Toán tử \`OR\` hiển thị bản ghi nếu BẤT KỲ điều kiện nào đúng.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL lấy khách hàng sống tại quốc gia \`'Germany'\` VÀ có thành phố là \`'Berlin'\`.`,
      initialSnippet: `-- Kết hợp điều kiện AND\nSELECT * FROM Customers\nWHERE Country = 'Germany' AND /* TODO: City = 'Berlin' */;`,
      testScript: `assert('Kết hợp điều kiện AND giữa Germany và Berlin', code.toUpperCase().includes('AND') && code.toUpperCase().includes('GERMANY') && code.toUpperCase().includes('BERLIN'));`,
      solution: `SELECT * FROM Customers WHERE Country = 'Germany' AND City = 'Berlin';`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 6,
    },
    {
      slug: 'w3schools-sql-07-like',
      title: 'PostgreSQL SQL 07: Toán Tử ILIKE & Ký Tự Đại Diện',
      summary: 'Tìm khách hàng có tên bắt đầu bằng chữ a',
      sampleData: customersSampleData,
      expectedQueryResult: customersSampleData.filter((r) => r.CustomerName.toLowerCase().startsWith('a')),
      instructions: `# PostgreSQL SQL 07: Toán Tử ILIKE & Wildcards\n\nToán tử \`ILIKE\` của PostgreSQL tìm kiếm mẫu không phân biệt chữ hoa/chữ thường. Ký tự đại diện \`%\` đại diện cho 0, 1 hoặc nhiều ký tự.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để tìm tất cả khách hàng có \`CustomerName\` bắt đầu bằng chữ \`'a'\` hoặc \`'A'\` (\`ILIKE 'a%'\`).`,
      initialSnippet: `-- Tìm khách hàng tên bắt đầu bằng chữ 'a'\nSELECT * FROM Customers\nWHERE CustomerName ILIKE /* TODO: Điền mẫu 'a%' */;`,
      testScript: `assert('Sử dụng toán tử ILIKE a%', code.toUpperCase().includes('ILIKE') && (code.includes("'a%'") || code.includes("'A%'") || code.toUpperCase().includes("'A%'")));`,
      solution: `SELECT * FROM Customers WHERE CustomerName ILIKE 'a%';`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 7,
    },
    {
      slug: 'w3schools-sql-08-in',
      title: 'W3Schools SQL 08: Toán Tử IN',
      summary: 'Lọc khách hàng thuộc Germany, France, UK',
      sampleData: customersSampleData,
      expectedQueryResult: customersSampleData.filter((r) => ['Germany', 'France', 'UK'].includes(r.Country)),
      instructions: `# W3Schools SQL 08: Toán Tử IN\n\nToán tử \`IN\` cho phép bạn chỉ định nhiều giá trị trong một mệnh đề \`WHERE\`, tương đương với viết nhiều điều kiện \`OR\`.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL lấy khách hàng thuộc một trong ba quốc gia: \`'Germany'\`, \`'France'\`, \`'UK'\`.`,
      initialSnippet: `-- Lọc khách hàng thuộc 3 quốc gia\nSELECT * FROM Customers\nWHERE Country IN (/* TODO: 'Germany', 'France', 'UK' */);`,
      testScript: `assert('Sử dụng IN với Germany, France, UK', code.toUpperCase().includes('IN') && code.toUpperCase().includes('GERMANY') && code.toUpperCase().includes('UK'));`,
      solution: `SELECT * FROM Customers WHERE Country IN ('Germany', 'France', 'UK');`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 8,
    },
    {
      slug: 'w3schools-sql-09-between',
      title: 'W3Schools SQL 09: Toán Tử BETWEEN',
      summary: 'Lọc sản phẩm có giá nằm trong khoảng từ 10 đến 20',
      sampleData: productsSampleData,
      expectedQueryResult: productsSampleData.filter((r) => r.Price >= 10 && r.Price <= 20),
      instructions: `# W3Schools SQL 09: Toán Tử BETWEEN\n\nToán tử \`BETWEEN\` chọn các giá trị trong một phạm vi nhất định (bao gồm cả hai giá trị đầu và cuối).\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL lấy các sản phẩm từ bảng \`Products\` có giá (\`Price\`) nằm trong khoảng từ \`10\` đến \`20\`.`,
      initialSnippet: `-- Lọc sản phẩm có Price từ 10 đến 20\nSELECT * FROM Products\nWHERE Price BETWEEN /* TODO: 10 AND 20 */;`,
      testScript: `assert('Toán tử BETWEEN 10 AND 20', code.toUpperCase().includes('BETWEEN') && code.includes('10') && code.includes('20'));`,
      solution: `SELECT * FROM Products WHERE Price BETWEEN 10 AND 20;`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 9,
    },
    {
      slug: 'w3schools-sql-10-count-group-by',
      title: 'W3Schools SQL 10: Hàm COUNT & Mệnh Đề GROUP BY',
      summary: 'Đếm số lượng khách hàng theo từng quốc gia Country',
      sampleData: customersSampleData,
      expectedQueryResult: [
        { count: 1, Country: 'Germany' },
        { count: 3, Country: 'Mexico' },
        { count: 1, Country: 'UK' },
        { count: 1, Country: 'Sweden' },
        { count: 1, Country: 'France' },
      ],
      instructions: `# W3Schools SQL 10: Hàm COUNT() & Mệnh Đề GROUP BY\n\nMệnh đề \`GROUP BY\` thường được sử dụng cùng các hàm tổng hợp (\`COUNT()\`, \`MAX()\`, \`MIN()\`, \`SUM()\`, \`AVG()\`) để nhóm tập kết quả theo một hoặc nhiều cột.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL đếm số lượng khách hàng ở mỗi quốc gia (\`COUNT(CustomerID)\`), nhóm theo cột \`Country\`.`,
      initialSnippet: `-- Đếm khách hàng nhóm theo Country\nSELECT COUNT(CustomerID), Country\nFROM Customers\nGROUP BY /* TODO: Nhóm theo Country */;`,
      testScript: `assert('COUNT và GROUP BY Country', code.toUpperCase().includes('COUNT') && code.toUpperCase().includes('GROUP BY') && code.toUpperCase().includes('COUNTRY'));`,
      solution: `SELECT COUNT(CustomerID), Country FROM Customers GROUP BY Country;`,
      durationMinutes: 25,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 10,
    },
  ];

  for (const lab of sqlLabs) {
    const usesProducts = lab.sampleData === productsSampleData;
    const objectiveData = JSON.stringify({
      version: '2.0',
      summary: lab.summary,
      schemaSql: usesProducts ? productsSchemaSql : customersSchemaSql,
      seedSql: usesProducts ? productsSeedSql : customersSeedSql,
      sampleData: lab.sampleData,
      expectedQueryResult: lab.expectedQueryResult,
      statementPolicy: 'read_only',
      timeoutMs: 3000,
      maxResultRows: 500,
      maxResultColumns: 50,
    });
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: {
        seriesId: seriesW3Sql.id,
        title: lab.title,
        sandboxType: 'sql_worker',
        objective: objectiveData,
        instructions: lab.instructions,
        initialSnippet: lab.initialSnippet,
        testScript: lab.testScript,
        solution: lab.solution,
        durationMinutes: lab.durationMinutes,
        isFreePreview: lab.isFreePreview,
        isProOnly: lab.isProOnly,
        orderIndex: lab.orderIndex,
        status: ContentLifecycleStatus.published,
        authorId: contributorUser.id,
      },
      create: {
        seriesId: seriesW3Sql.id,
        title: lab.title,
        slug: lab.slug,
        sandboxType: 'sql_worker',
        objective: objectiveData,
        instructions: lab.instructions,
        initialSnippet: lab.initialSnippet,
        testScript: lab.testScript,
        solution: lab.solution,
        durationMinutes: lab.durationMinutes,
        isFreePreview: lab.isFreePreview,
        isProOnly: lab.isProOnly,
        orderIndex: lab.orderIndex,
        isActive: true,
        status: ContentLifecycleStatus.published,
        authorId: contributorUser.id,
      },
    });
  }

  // ── Series 2: SQL E-Commerce Analytics & Business Queries ────────────
  const seriesSqlAnalytics = await prisma.labSeries.upsert({
    where: { slug: 'sql-ecommerce-analytics-mastery' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'database',
      orderIndex: 2,
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000002',
      title: 'SQL E-Commerce Analytics & Business Queries',
      slug: 'sql-ecommerce-analytics-mastery',
      category: 'database',
      description: 'Thực chiến phân tích số liệu kinh doanh thương mại điện tử với PostgreSQL: Thống kê tổng doanh thu theo khách hàng với INNER JOIN và lọc nhóm doanh số cao với mệnh đề HAVING.',
      level: 'intermediate',
      coverEmoji: '📊',
      orderIndex: 2,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  const ecomAnalyticsSchema = `CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL
  );
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL
  );`;

  const ecomAnalyticsSeed = `INSERT INTO customers VALUES
    (1, 'Nguyễn Văn An', 'Hà Nội'),
    (2, 'Trần Thị Bình', 'Đà Nẵng'),
    (3, 'Lê Hoàng Cường', 'TP. Hồ Chí Minh'),
    (4, 'Phạm Minh Đức', 'Hà Nội');
  INSERT INTO orders VALUES
    (101, 1, 1250000, 'completed'),
    (102, 1, 450000, 'completed'),
    (103, 2, 2100000, 'completed'),
    (104, 3, 300000, 'completed'),
    (105, 4, 900000, 'cancelled');`;

  const ecomRevenueByCustomerData = [
    { name: 'Nguyễn Văn An', revenue: 1700000 },
    { name: 'Trần Thị Bình', revenue: 2100000 },
    { name: 'Lê Hoàng Cường', revenue: 300000 },
  ];

  await prisma.lab.upsert({
    where: { slug: 'sql-ecom-revenue-by-customer' },
    update: {
      seriesId: seriesSqlAnalytics.id,
      title: 'Tính Tổng Doanh Thu Khách Hàng với INNER JOIN & SUM',
      sandboxType: 'sql_worker',
      objective: JSON.stringify({
        version: '2.0',
        summary: 'Nối bảng customers và orders, tính tổng doanh thu các đơn completed theo từng khách hàng',
        schemaSql: ecomAnalyticsSchema,
        seedSql: ecomAnalyticsSeed,
        expectedQueryResult: ecomRevenueByCustomerData,
        statementPolicy: 'read_only',
        timeoutMs: 3000,
        maxResultRows: 500,
        maxResultColumns: 50,
      }),
      instructions: `# Tính Tổng Doanh Thu Khách Hàng (Revenue by Customer)\n\n### Bảng Dữ Liệu:\n- \`customers(id, name, city)\`\n- \`orders(id, customer_id, total_amount, status)\`\n\n### Nhiệm Vụ Của Bạn:\nHãy viết câu lệnh SQL để:\n1. Nối bảng \`customers\` và \`orders\` theo khóa ngoại \`orders.customer_id = customers.id\`.\n2. Chỉ lấy các đơn hàng có \`status = 'completed'\`.\n3. Tính tổng doanh thu đặt tên cột là \`revenue\` (\`SUM(o.total_amount) AS revenue\`).\n4. Nhóm theo tên khách hàng (\`GROUP BY c.name\`).`,
      initialSnippet: `-- Tính tổng doanh thu các đơn completed của từng khách hàng\nSELECT c.name, SUM(o.total_amount) AS revenue\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.name;`,
      testScript: `assert('JOIN orders', code.toUpperCase().includes('JOIN') && code.toUpperCase().includes('SUM') && code.toUpperCase().includes('GROUP BY'));`,
      solution: `SELECT c.name, SUM(o.total_amount) AS revenue FROM customers c INNER JOIN orders o ON c.id = o.customer_id WHERE o.status = 'completed' GROUP BY c.name;`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesSqlAnalytics.id,
      title: 'Tính Tổng Doanh Thu Khách Hàng với INNER JOIN & SUM',
      slug: 'sql-ecom-revenue-by-customer',
      sandboxType: 'sql_worker',
      objective: JSON.stringify({
        version: '2.0',
        summary: 'Nối bảng customers và orders, tính tổng doanh thu các đơn completed theo từng khách hàng',
        schemaSql: ecomAnalyticsSchema,
        seedSql: ecomAnalyticsSeed,
        expectedQueryResult: ecomRevenueByCustomerData,
        statementPolicy: 'read_only',
        timeoutMs: 3000,
        maxResultRows: 500,
        maxResultColumns: 50,
      }),
      instructions: `# Tính Tổng Doanh Thu Khách Hàng (Revenue by Customer)\n\n### Bảng Dữ Liệu:\n- \`customers(id, name, city)\`\n- \`orders(id, customer_id, total_amount, status)\`\n\n### Nhiệm Vụ Của Bạn:\nHãy viết câu lệnh SQL để:\n1. Nối bảng \`customers\` và \`orders\` theo khóa ngoại \`orders.customer_id = customers.id\`.\n2. Chỉ lấy các đơn hàng có \`status = 'completed'\`.\n3. Tính tổng doanh thu đặt tên cột là \`revenue\` (\`SUM(o.total_amount) AS revenue\`).\n4. Nhóm theo tên khách hàng (\`GROUP BY c.name\`).`,
      initialSnippet: `-- Tính tổng doanh thu các đơn completed của từng khách hàng\nSELECT c.name, SUM(o.total_amount) AS revenue\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.name;`,
      testScript: `assert('JOIN orders', code.toUpperCase().includes('JOIN') && code.toUpperCase().includes('SUM') && code.toUpperCase().includes('GROUP BY'));`,
      solution: `SELECT c.name, SUM(o.total_amount) AS revenue FROM customers c INNER JOIN orders o ON c.id = o.customer_id WHERE o.status = 'completed' GROUP BY c.name;`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  const ecomVipRevenueData = [
    { name: 'Nguyễn Văn An', revenue: 1700000 },
    { name: 'Trần Thị Bình', revenue: 2100000 },
  ];

  await prisma.lab.upsert({
    where: { slug: 'sql-ecom-having-vip-revenue' },
    update: {
      seriesId: seriesSqlAnalytics.id,
      title: 'Lọc Khách Hàng Doanh Số Cao với Mệnh Đề HAVING',
      sandboxType: 'sql_worker',
      objective: JSON.stringify({
        version: '2.0',
        summary: 'Lọc nhóm khách hàng có tổng doanh thu > 1,000,000 VNĐ bằng mệnh đề HAVING',
        schemaSql: ecomAnalyticsSchema,
        seedSql: ecomAnalyticsSeed,
        expectedQueryResult: ecomVipRevenueData,
        statementPolicy: 'read_only',
        timeoutMs: 3000,
        maxResultRows: 500,
        maxResultColumns: 50,
      }),
      instructions: `# Lọc Khách Hàng VIP với HAVING\n\nKhi cần lọc trên kết quả của một hàm tổng hợp (\`SUM()\`, \`COUNT()\`), chúng ta KHÔNG ĐƯỢC dùng \`WHERE\` mà phải dùng \`HAVING\` sau mệnh đề \`GROUP BY\`.\n\n### Nhiệm Vụ Của Bạn:\nTruy vấn \`name\` và \`SUM(o.total_amount) AS revenue\` từ \`customers c\` và \`orders o\` (đơn \`status = 'completed'\`), chỉ lấy các khách hàng có tổng doanh thu trên 1,000,000 VNĐ (\`HAVING SUM(o.total_amount) > 1000000\`).`,
      initialSnippet: `-- Lọc khách hàng có tổng revenue > 1000000 với HAVING\nSELECT c.name, SUM(o.total_amount) AS revenue\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.name\nHAVING SUM(o.total_amount) > 1000000;`,
      testScript: `assert('HAVING clause', code.toUpperCase().includes('HAVING') && code.toUpperCase().includes('1000000'));`,
      solution: `SELECT c.name, SUM(o.total_amount) AS revenue FROM customers c INNER JOIN orders o ON c.id = o.customer_id WHERE o.status = 'completed' GROUP BY c.name HAVING SUM(o.total_amount) > 1000000;`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 2,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesSqlAnalytics.id,
      title: 'Lọc Khách Hàng Doanh Số Cao với Mệnh Đề HAVING',
      slug: 'sql-ecom-having-vip-revenue',
      sandboxType: 'sql_worker',
      objective: JSON.stringify({
        version: '2.0',
        summary: 'Lọc nhóm khách hàng có tổng doanh thu > 1,000,000 VNĐ bằng mệnh đề HAVING',
        schemaSql: ecomAnalyticsSchema,
        seedSql: ecomAnalyticsSeed,
        expectedQueryResult: ecomVipRevenueData,
        statementPolicy: 'read_only',
        timeoutMs: 3000,
        maxResultRows: 500,
        maxResultColumns: 50,
      }),
      instructions: `# Lọc Khách Hàng VIP với HAVING\n\nKhi cần lọc trên kết quả của một hàm tổng hợp (\`SUM()\`, \`COUNT()\`), chúng ta KHÔNG ĐƯỢC dùng \`WHERE\` mà phải dùng \`HAVING\` sau mệnh đề \`GROUP BY\`.\n\n### Nhiệm Vụ Của Bạn:\nTruy vấn \`name\` và \`SUM(o.total_amount) AS revenue\` từ \`customers c\` và \`orders o\` (đơn \`status = 'completed'\`), chỉ lấy các khách hàng có tổng doanh thu trên 1,000,000 VNĐ (\`HAVING SUM(o.total_amount) > 1000000\`).`,
      initialSnippet: `-- Lọc khách hàng có tổng revenue > 1000000 với HAVING\nSELECT c.name, SUM(o.total_amount) AS revenue\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.name\nHAVING SUM(o.total_amount) > 1000000;`,
      testScript: `assert('HAVING clause', code.toUpperCase().includes('HAVING') && code.toUpperCase().includes('1000000'));`,
      solution: `SELECT c.name, SUM(o.total_amount) AS revenue FROM customers c INNER JOIN orders o ON c.id = o.customer_id WHERE o.status = 'completed' GROUP BY c.name HAVING SUM(o.total_amount) > 1000000;`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 2,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  // ── Series 3: Testing Theory & ISTQB Foundation Quizel ─────────────────
  const seriesIstqbQuiz = await prisma.labSeries.upsert({
    where: { slug: 'testing-theory-istqb-quizel' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'testing',
      orderIndex: 3,
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000003',
      title: 'Testing Theory & ISTQB Foundation Quizel',
      slug: 'testing-theory-istqb-quizel',
      category: 'testing',
      description: 'Luyện tập lý thuyết kiểm thử phần mềm chuyên sâu theo chuẩn quốc tế ISTQB CTFL v4.0: 7 nguyên lý kiểm thử, vòng đời lỗi (Defect Lifecycle), phân cấp kiểm thử và kỹ thuật thiết kế test case tương tác.',
      level: 'beginner',
      coverEmoji: '🎯',
      orderIndex: 3,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  const istqbPrinciplesQuestions = [
    {
      id: 'istqb-p-1',
      question: 'Nguyên lý "Testing shows the presence of defects, not their absence" (Kiểm thử chỉ ra sự hiện diện của lỗi chứ không chứng minh sự vắng mặt của lỗi) có ý nghĩa thực tế nào sau đây?',
      options: [
        'Nếu chạy qua 100% test case mà đều Passed thì có thể cam đoan phần mềm 100% không còn lỗi.',
        'Kiểm thử làm giảm xác suất lỗi chưa được phát hiện, nhưng việc không tìm thấy lỗi không thể chứng minh phần mềm hoàn hảo.',
        'Chỉ cần tìm ra được ít nhất 1 lỗi là đủ để kết luận toàn bộ phần mềm bị hỏng hoàn toàn.',
        'Người kiểm thử không có trách nhiệm tìm lỗi vì lỗi là do lập trình viên sinh ra.',
      ],
      correctIndex: 1,
      explanation: 'Theo chuẩn ISTQB, kiểm thử làm giảm nguy cơ lỗi tiềm ẩn nhưng không thể chứng minh phần mềm không có lỗi (Zero defects là bất khả thi).',
      hint: 'Việc không tìm thấy lỗi có đồng nghĩa với việc phần mềm đã hoàn hảo 100%?',
    },
    {
      id: 'istqb-p-2',
      question: 'Tại sao nguyên lý "Exhaustive testing is impossible" (Kiểm thử cạn kiệt là bất khả thi) lại là một nguyên tắc nền tảng của QA/QC?',
      options: [
        'Vì tester không đủ thời gian học hết tài liệu của dự án.',
        'Vì việc thử nghiệm mọi tổ hợp dữ liệu đầu vào và tiền điều kiện là không khả thi về thời gian và chi phí, do đó cần phân tích rủi ro và độ ưu tiên.',
        'Vì hệ thống cơ sở dữ liệu sẽ sập nếu tester thực thi quá 1,000 ca kiểm thử.',
        'Vì khách hàng không bao giờ cho phép thực thi kiểm thử tự động.',
      ],
      correctIndex: 1,
      explanation: 'Kiểm thử cạn kiệt (mọi input kết hợp mọi điều kiện) đòi hỏi tài nguyên vô hạn. Tester chuyên nghiệp phải dùng phân tích rủi ro (Risk-based testing) và kỹ thuật test design để chọn tập test tối ưu.',
      hint: 'Hãy nghĩ về số lượng tổ hợp khi một biểu mẫu có 10 trường nhập liệu.',
    },
    {
      id: 'istqb-p-3',
      question: 'Khái niệm "Pesticide Paradox" (Nghịch lý thuốc trừ sâu) trong kiểm thử phần mềm được giải quyết bằng cách nào?',
      options: [
        'Chạy lại cùng một bộ test case cũ với tần suất gấp đôi mỗi tuần.',
        'Định kỳ rà soát, cập nhật và viết thêm các test case mới để tìm ra các lỗi mới phát sinh trong các phần vừa chỉnh sửa.',
        'Xóa bỏ toàn bộ test case cũ và chỉ kiểm thử thủ công (manual exploratory testing).',
        'Ngừng kiểm thử tự động để chuyển sang kiểm thử chấp nhận người dùng (UAT).',
      ],
      correctIndex: 1,
      explanation: 'Nếu lặp đi lặp lại cùng một bộ test case, phần mềm sẽ "kháng thuốc" và không phát hiện thêm lỗi mới. Cần thường xuyên cập nhật kịch bản kiểm thử.',
      hint: 'Giống như sâu bọ kháng thuốc trừ sâu, bạn cần làm gì với các bài test cũ?',
    },
    {
      id: 'istqb-p-4',
      question: 'Nguyên tắc "Early Testing" (Kiểm thử sớm / Shift-Left Testing) mang lại lợi ích tài chính lớn nhất như thế nào cho dự án phần mềm?',
      options: [
        'Chi phí tìm và sửa lỗi ở giai đoạn Requirement/Design luôn thấp hơn rất nhiều lần so với khi lỗi đã lọt vào Production.',
        'Giúp lập trình viên không phải viết code nữa.',
        'Giảm thời gian họp hàng ngày của nhóm Agile.',
        'Tự động sinh ra tài liệu hướng dẫn người dùng mà không tốn công biên soạn.',
      ],
      correctIndex: 0,
      explanation: 'Quy tắc "Rule of Ten" trong kiểm thử: Lỗi phát hiện ở giai đoạn Requirement tốn chi phí rẻ hơn hàng chục đến hàng trăm lần so với sửa lỗi khi đã phát hành đến tay khách hàng.',
      hint: 'Sửa bản vẽ thiết kế trên giấy dễ hơn hay đập ngôi nhà đã xây xong dễ hơn?',
    },
    {
      id: 'istqb-p-5',
      question: 'Quan niệm sai lầm "Absence-of-errors fallacy" (Ảo tưởng không có lỗi) cảnh báo điều gì cho đội ngũ phát triển sản phẩm?',
      options: [
        'Hệ thống không có lỗi kỹ thuật (bug-free) nhưng vẫn thất bại nếu không đáp ứng đúng nhu cầu và kỳ vọng thực tế của người dùng.',
        'Phần mềm có nhiều lỗi luôn được người dùng ưa chuộng hơn phần mềm ít lỗi.',
        'Tester không nên báo cáo lỗi để tránh làm chậm tiến độ bàn giao sản phẩm.',
        'Mọi phần mềm hoàn chỉnh đều tự động sửa lỗi mà không cần sự can thiệp của con người.',
      ],
      correctIndex: 0,
      explanation: 'Một hệ thống chạy hoàn hảo không có bug nhưng xây sai nghiệp vụ người dùng cần thì sản phẩm đó vẫn thất bại về mặt kinh doanh.',
      hint: 'Một sản phẩm chạy trơn tru nhưng khách hàng không ai muốn dùng thì có thành công không?',
    },
  ];

  await prisma.lab.upsert({
    where: { slug: 'istqb-01-7-testing-principles' },
    update: {
      seriesId: seriesIstqbQuiz.id,
      title: '7 Nguyên Lý Kiểm Thử Phần Mềm Cốt Lõi (ISTQB Principles)',
      sandboxType: 'quizlet',
      objective: JSON.stringify({
        summary: '5 câu hỏi trắc nghiệm chuẩn ISTQB CTFL v4.0 về 7 nguyên lý kiểm thử và Shift-Left testing',
        quizList: istqbPrinciplesQuestions,
      }),
      instructions: `# 7 Nguyên Lý Kiểm Thử Phần Mềm (ISTQB CTFL v4.0)\n\nLý thuyết kiểm thử không chỉ là bấm nút tìm lỗi mà là tư duy tối ưu chất lượng.\n\n### Hướng dẫn bài học:\n- Đọc kỹ tình huống của từng câu hỏi ở bảng câu hỏi bên phải.\n- Chọn phương án chính xác nhất và xem giải thích chi tiết cho từng phương án.`,
      initialSnippet: `// Trắc nghiệm tương tác Quizlet - Chọn đáp án bên phải`,
      testScript: `assert('ISTQB Principles Quiz', true);`,
      solution: `1. B | 2. B | 3. B | 4. A | 5. A`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesIstqbQuiz.id,
      title: '7 Nguyên Lý Kiểm Thử Phần Mềm Cốt Lõi (ISTQB Principles)',
      slug: 'istqb-01-7-testing-principles',
      sandboxType: 'quizlet',
      objective: JSON.stringify({
        summary: '5 câu hỏi trắc nghiệm chuẩn ISTQB CTFL v4.0 về 7 nguyên lý kiểm thử và Shift-Left testing',
        quizList: istqbPrinciplesQuestions,
      }),
      instructions: `# 7 Nguyên Lý Kiểm Thử Phần Mềm (ISTQB CTFL v4.0)\n\nLý thuyết kiểm thử không chỉ là bấm nút tìm lỗi mà là tư duy tối ưu chất lượng.\n\n### Hướng dẫn bài học:\n- Đọc kỹ tình huống của từng câu hỏi ở bảng câu hỏi bên phải.\n- Chọn phương án chính xác nhất và xem giải thích chi tiết cho từng phương án.`,
      initialSnippet: `// Trắc nghiệm tương tác Quizlet - Chọn đáp án bên phải`,
      testScript: `assert('ISTQB Principles Quiz', true);`,
      solution: `1. B | 2. B | 3. B | 4. A | 5. A`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  const istqbDefectQuestions = [
    {
      id: 'istqb-d-1',
      question: 'Phân biệt chính xác giữa các thuật ngữ: Error (Mistake), Defect (Bug/Fault) và Failure trong tiêu chuẩn ISTQB:',
      options: [
        'Con người phạm một Error -> tạo ra một Defect trong mã nguồn -> khi thực thi mã lỗi đó gây ra Failure của hệ thống.',
        'Failure tạo ra Defect, và Defect do Error của máy tính tự sinh ra.',
        'Error và Failure là lỗi phần mềm, còn Defect là lỗi của người dùng cuối.',
        'Cả ba thuật ngữ này có nghĩa hoàn toàn giống nhau, dùng thay thế lẫn nhau.',
      ],
      correctIndex: 0,
      explanation: 'Quy trình hình thành: Human makes an Error (sai sót của người) -> results in a Defect/Bug in software -> execution of defect causes a Failure (hệ thống sai lệch so với kỳ vọng).',
      hint: 'Hành động của con người gây ra khuyết tật trong code, khi chạy code thì điều gì xảy ra?',
    },
    {
      id: 'istqb-d-2',
      question: 'Tình huống: Logo công ty ở góc trái màn hình chính bị sai chính tả tên thương hiệu, nhưng mọi tính năng thanh toán và đặt hàng vẫn hoạt động bình thường. Đánh giá Severity và Priority nào là chuẩn xác nhất?',
      options: [
        'Severity: Critical | Priority: Low',
        'Severity: Minor / Low | Priority: High / Immediate',
        'Severity: High | Priority: Low',
        'Severity: Critical | Priority: High',
      ],
      correctIndex: 1,
      explanation: 'Về mặt kỹ thuật, lỗi này chỉ là hiển thị sai chữ (Severity Minor/Low vì không gây sập app hay sai tiền). Nhưng ảnh hưởng nghiêm trọng đến uy tín thương hiệu nên cần sửa ngay lập tức (Priority High).',
      hint: 'Lỗi có làm sập hệ thống không (Severity)? Khách hàng nhìn vào có muốn sửa ngay không (Priority)?',
    },
    {
      id: 'istqb-d-3',
      question: 'Trong Vòng đời của Lỗi (Defect Lifecycle), sau khi Lập trình viên thông báo đã sửa lỗi (Status: Fixed), Tester cần thực hiện hành động nào tiếp theo?',
      options: [
        'Đóng lỗi (Closed) ngay lập tức mà không cần kiểm tra lại.',
        'Thực hiện Kiểm thử xác nhận (Confirmation Testing / Retest) trên đúng môi trường vừa build; nếu đạt thì Close, nếu vẫn lỗi thì Reopen.',
        'Chuyển lỗi sang trạng thái Deferred để đợi quý sau xử lý.',
        'Xóa bản ghi lỗi khỏi hệ thống Jira.',
      ],
      correctIndex: 1,
      explanation: 'Khi Dev đổi trạng thái sang Fixed, Tester phải Retest trên môi trường mới. Nếu bug đã biến mất -> Closed. Nếu bug vẫn còn -> Reopened.',
      hint: 'Tester có được phép tin tưởng lời nói mà không kiểm tra thực tế hay không?',
    },
    {
      id: 'istqb-d-4',
      question: 'Kỹ thuật Phân Tích Giá Trị Biên (Boundary Value Analysis - BVA) 2-point trên trường tuổi hợp lệ từ 18 đến 60 tuổi gồm bộ giá trị kiểm thử nào?',
      options: [
        '17, 18, 60, 61',
        '10, 20, 50, 70',
        '18, 30, 45, 60',
        '-1, 0, 100, 200',
      ],
      correctIndex: 0,
      explanation: 'BVA 2-point kiểm tra giá trị ngay biên và ngay ngoài biên: Cận dưới là 18 (hợp lệ) và 17 (không hợp lệ); Cận trên là 60 (hợp lệ) và 61 (không hợp lệ).',
      hint: 'Kiểm tra ngay tại biên và sát ngay bên ngoài biên.',
    },
    {
      id: 'istqb-d-5',
      question: 'Mục đích chính của Kiểm Thử Hồi Quy (Regression Testing) là gì?',
      options: [
        'Kiểm tra xem tính năng mới có chạy đúng theo mô tả hay không.',
        'Đảm bảo rằng các thay đổi mã nguồn mới (sửa lỗi hoặc bổ sung tính năng) không gây ra tác dụng phụ tiêu cực làm hỏng các tính năng cũ đang hoạt động ổn định.',
        'Kiểm tra tốc độ tải trang của người dùng ở khu vực nông thôn.',
        'Đánh giá giao diện phần mềm có đẹp mắt theo xu hướng hiện đại hay không.',
      ],
      correctIndex: 1,
      explanation: 'Regression testing là việc chạy lại các test case cũ để phát hiện xem code mới có vô tình làm gãy các chức năng cũ (side-effects) hay không.',
      hint: 'Từ "Regression" có nghĩa là thụt lùi/ảnh hưởng ngược lại.',
    },
  ];

  await prisma.lab.upsert({
    where: { slug: 'istqb-02-defect-lifecycle-bva' },
    update: {
      seriesId: seriesIstqbQuiz.id,
      title: 'Vòng Đời Lỗi (Defect Lifecycle) & Kỹ Thuật Phân Tích Biên BVA',
      sandboxType: 'quizlet',
      objective: JSON.stringify({
        summary: '5 câu hỏi trắc nghiệm chuyên sâu về Error-Defect-Failure, Severity vs Priority, và BVA',
        quizList: istqbDefectQuestions,
      }),
      instructions: `# Vòng Đời Lỗi & Kỹ Thuật Kiểm Thử Hộp Đen (BVA)\n\nHiểu sâu quy trình quản lý defect và áp dụng các kỹ thuật thiết kế test case chuẩn quốc tế.\n\n### Hướng dẫn bài học:\n- Chọn đáp án chính xác và tham khảo giải thích chi tiết sau mỗi câu hỏi.`,
      initialSnippet: `// Trắc nghiệm tương tác Quizlet - Chọn đáp án bên phải`,
      testScript: `assert('ISTQB Defect Quiz', true);`,
      solution: `1. A | 2. B | 3. B | 4. A | 5. B`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 2,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesIstqbQuiz.id,
      title: 'Vòng Đời Lỗi (Defect Lifecycle) & Kỹ Thuật Phân Tích Biên BVA',
      slug: 'istqb-02-defect-lifecycle-bva',
      sandboxType: 'quizlet',
      objective: JSON.stringify({
        summary: '5 câu hỏi trắc nghiệm chuyên sâu về Error-Defect-Failure, Severity vs Priority, và BVA',
        quizList: istqbDefectQuestions,
      }),
      instructions: `# Vòng Đời Lỗi & Kỹ Thuật Kiểm Thử Hộp Đen (BVA)\n\nHiểu sâu quy trình quản lý defect và áp dụng các kỹ thuật thiết kế test case chuẩn quốc tế.\n\n### Hướng dẫn bài học:\n- Chọn đáp án chính xác và tham khảo giải thích chi tiết sau mỗi câu hỏi.`,
      initialSnippet: `// Trắc nghiệm tương tác Quizlet - Chọn đáp án bên phải`,
      testScript: `assert('ISTQB Defect Quiz', true);`,
      solution: `1. A | 2. B | 3. B | 4. A | 5. B`,
      durationMinutes: 20,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 2,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  // ── Series 4: Automation Test Syntax & Matchers Masterclass ──────────
  const seriesAutoSyntax = await prisma.labSeries.upsert({
    where: { slug: 'automation-test-syntax-masterclass' },
    update: {
      authorId: contributorUser.id,
      status: ContentLifecycleStatus.published,
      category: 'testing',
      orderIndex: 4,
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000004',
      title: 'Automation Test Syntax & Matchers Masterclass',
      slug: 'automation-test-syntax-masterclass',
      category: 'testing',
      description: 'Làm chủ cú pháp viết kịch bản kiểm thử tự động với Jest/Vitest: cấu trúc describe/test/it, làm chủ các Assertion Matchers (toBe, toEqual, toContain, toBeDefined), và assertions API response chuyên nghiệp.',
      level: 'intermediate',
      coverEmoji: '⚡',
      orderIndex: 4,
      isProOnly: false,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  await prisma.lab.upsert({
    where: { slug: 'auto-syntax-01-describe-test-structure' },
    update: {
      seriesId: seriesAutoSyntax.id,
      title: 'Cấu Trúc Test Suite & Test Case (describe, test, it)',
      sandboxType: 'js_worker',
      objective: 'Tổ chức các kịch bản kiểm thử rõ ràng theo cú pháp BDD với describe và test',
      instructions: `# Cấu Trúc Bộ Kiểm Thử Tự Động (Test Suite Structure)\n\nTrong các framework kiểm thử hiện đại (Jest, Vitest, Mocha):\n- \`describe('Tên nhóm', () => { ... })\` dùng để gom nhóm các ca kiểm thử liên quan.\n- \`test('Hành vi kỳ vọng', () => { ... })\` (hoặc \`it()\`) đại diện cho một ca kiểm thử cụ thể.\n\n### Nhiệm Vụ Của Bạn:\nHoàn thành hàm \`applyDiscount(amount, code)\` và các câu kiểm tra bên dưới để tất cả test cases đều Passed!`,
      initialSnippet: `// 1. Hàm tính toán giảm giá cần kiểm thử
function applyDiscount(amount, code) {
  if (code === 'DISCOUNT10') return amount * 0.9;
  if (code === 'DISCOUNT20') return amount * 0.8;
  return amount;
}

// 2. Kịch bản kiểm thử
function runSuite() {
  const t1 = applyDiscount(100, 'DISCOUNT10') === 90;
  const t2 = applyDiscount(100, 'DISCOUNT20') === 80;
  const t3 = applyDiscount(100, 'INVALID') === 100;
  return t1 && t2 && t3;
}
`,
      testScript: `assert('applyDiscount tồn tại', typeof applyDiscount === 'function');
assert('Discount 10% tính đúng', applyDiscount(200, 'DISCOUNT10') === 180);
assert('Discount 20% tính đúng', applyDiscount(200, 'DISCOUNT20') === 160);
assert('Mã sai giữ nguyên giá', applyDiscount(200, 'NONE') === 200);
assert('Bộ test suite passed', runSuite() === true);
`,
      solution: `function applyDiscount(amount, code) {
  if (code === 'DISCOUNT10') return amount * 0.9;
  if (code === 'DISCOUNT20') return amount * 0.8;
  return amount;
}

function runSuite() {
  const t1 = applyDiscount(100, 'DISCOUNT10') === 90;
  const t2 = applyDiscount(100, 'DISCOUNT20') === 80;
  const t3 = applyDiscount(100, 'INVALID') === 100;
  return t1 && t2 && t3;
}`,
      durationMinutes: 15,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 1,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesAutoSyntax.id,
      title: 'Cấu Trúc Test Suite & Test Case (describe, test, it)',
      slug: 'auto-syntax-01-describe-test-structure',
      sandboxType: 'js_worker',
      objective: 'Tổ chức các kịch bản kiểm thử rõ ràng theo cú pháp BDD với describe và test',
      instructions: `# Cấu Trúc Bộ Kiểm Thử Tự Động (Test Suite Structure)\n\nTrong các framework kiểm thử hiện đại (Jest, Vitest, Mocha):\n- \`describe('Tên nhóm', () => { ... })\` dùng để gom nhóm các ca kiểm thử liên quan.\n- \`test('Hành vi kỳ vọng', () => { ... })\` (hoặc \`it()\`) đại diện cho một ca kiểm thử cụ thể.\n\n### Nhiệm Vụ Của Bạn:\nHoàn thành hàm \`applyDiscount(amount, code)\` và các câu kiểm tra bên dưới để tất cả test cases đều Passed!`,
      initialSnippet: `// 1. Hàm tính toán giảm giá cần kiểm thử
function applyDiscount(amount, code) {
  if (code === 'DISCOUNT10') return amount * 0.9;
  if (code === 'DISCOUNT20') return amount * 0.8;
  return amount;
}

// 2. Kịch bản kiểm thử
function runSuite() {
  const t1 = applyDiscount(100, 'DISCOUNT10') === 90;
  const t2 = applyDiscount(100, 'DISCOUNT20') === 80;
  const t3 = applyDiscount(100, 'INVALID') === 100;
  return t1 && t2 && t3;
}
`,
      testScript: `assert('applyDiscount tồn tại', typeof applyDiscount === 'function');
assert('Discount 10% tính đúng', applyDiscount(200, 'DISCOUNT10') === 180);
assert('Discount 20% tính đúng', applyDiscount(200, 'DISCOUNT20') === 160);
assert('Mã sai giữ nguyên giá', applyDiscount(200, 'NONE') === 200);
assert('Bộ test suite passed', runSuite() === true);
`,
      solution: `function applyDiscount(amount, code) {
  if (code === 'DISCOUNT10') return amount * 0.9;
  if (code === 'DISCOUNT20') return amount * 0.8;
  return amount;
}

function runSuite() {
  const t1 = applyDiscount(100, 'DISCOUNT10') === 90;
  const t2 = applyDiscount(100, 'DISCOUNT20') === 80;
  const t3 = applyDiscount(100, 'INVALID') === 100;
  return t1 && t2 && t3;
}`,
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
    where: { slug: 'auto-syntax-02-core-matchers-primitive-vs-deep' },
    update: {
      seriesId: seriesAutoSyntax.id,
      title: 'Làm Chủ Assertion Matchers: toBe vs toEqual vs toContain',
      sandboxType: 'js_worker',
      objective: 'Phân biệt so sánh tham chiếu primitives (toBe) và so sánh sâu object/array (toEqual), kiểm tra phần tử mảng (toContain)',
      instructions: `# Phân Biệt Matcher: toBe vs toEqual vs toContain\n\n- \`toBe(x)\`: Dùng so sánh bằng tham chiếu (\`===\`) cho kiểu nguyên thủy: \`number\`, \`string\`, \`boolean\`.\n- \`toEqual(obj)\`: So sánh cấu trúc sâu (Deep equality) duyệt qua tất cả các thuộc tính của Object/Array.\n- \`toContain(item)\`: Kiểm tra mảng có chứa một phần tử nhất định.\n\n### Nhiệm Vụ Của Bạn:\nHoàn thành hàm \`assertProductPayload(product)\` trả về \`true\` nếu thỏa mãn:\n1. \`product.id\` là 101.\n2. \`product.categories\` có chứa \`'electronics'\`.\n3. \`product.specs\` khớp cấu trúc \`{ ram: '16GB', storage: '512GB' }\`.`,
      initialSnippet: `function assertProductPayload(product) {
  // TODO: Kiểm tra id === 101, categories chứa 'electronics', specs đúng { ram: '16GB', storage: '512GB' }
  const isIdValid = product.id === 101;
  const hasCategory = Array.isArray(product.categories) && product.categories.includes('electronics');
  const isSpecsValid = product.specs?.ram === '16GB' && product.specs?.storage === '512GB';
  
  return isIdValid && hasCategory && isSpecsValid;
}
`,
      testScript: `const validProduct = {
  id: 101,
  name: 'Ultra Laptop',
  categories: ['laptops', 'electronics'],
  specs: { ram: '16GB', storage: '512GB' }
};
const invalidProduct1 = { id: 102, categories: ['electronics'], specs: { ram: '16GB', storage: '512GB' } };
const invalidProduct2 = { id: 101, categories: ['fashion'], specs: { ram: '16GB', storage: '512GB' } };

assert('Payload hợp lệ -> true', assertProductPayload(validProduct) === true);
assert('Sai ID -> false', assertProductPayload(invalidProduct1) === false);
assert('Thiếu category -> false', assertProductPayload(invalidProduct2) === false);
`,
      solution: `function assertProductPayload(product) {
  const isIdValid = product.id === 101;
  const hasCategory = Array.isArray(product.categories) && product.categories.includes('electronics');
  const isSpecsValid = product.specs?.ram === '16GB' && product.specs?.storage === '512GB';
  return isIdValid && hasCategory && isSpecsValid;
}`,
      durationMinutes: 20,
      isFreePreview: true,
      isProOnly: false,
      orderIndex: 2,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesAutoSyntax.id,
      title: 'Làm Chủ Assertion Matchers: toBe vs toEqual vs toContain',
      slug: 'auto-syntax-02-core-matchers-primitive-vs-deep',
      sandboxType: 'js_worker',
      objective: 'Phân biệt so sánh tham chiếu primitives (toBe) và so sánh sâu object/array (toEqual), kiểm tra phần tử mảng (toContain)',
      instructions: `# Phân Biệt Matcher: toBe vs toEqual vs toContain\n\n- \`toBe(x)\`: Dùng so sánh bằng tham chiếu (\`===\`) cho kiểu nguyên thủy: \`number\`, \`string\`, \`boolean\`.\n- \`toEqual(obj)\`: So sánh cấu trúc sâu (Deep equality) duyệt qua tất cả các thuộc tính của Object/Array.\n- \`toContain(item)\`: Kiểm tra mảng có chứa một phần tử nhất định.\n\n### Nhiệm Vụ Của Bạn:\nHoàn thành hàm \`assertProductPayload(product)\` trả về \`true\` nếu thỏa mãn:\n1. \`product.id\` là 101.\n2. \`product.categories\` có chứa \`'electronics'\`.\n3. \`product.specs\` khớp cấu trúc \`{ ram: '16GB', storage: '512GB' }\`.`,
      initialSnippet: `function assertProductPayload(product) {
  // TODO: Kiểm tra id === 101, categories chứa 'electronics', specs đúng { ram: '16GB', storage: '512GB' }
  const isIdValid = product.id === 101;
  const hasCategory = Array.isArray(product.categories) && product.categories.includes('electronics');
  const isSpecsValid = product.specs?.ram === '16GB' && product.specs?.storage === '512GB';
  
  return isIdValid && hasCategory && isSpecsValid;
}
`,
      testScript: `const validProduct = {
  id: 101,
  name: 'Ultra Laptop',
  categories: ['laptops', 'electronics'],
  specs: { ram: '16GB', storage: '512GB' }
};
const invalidProduct1 = { id: 102, categories: ['electronics'], specs: { ram: '16GB', storage: '512GB' } };
const invalidProduct2 = { id: 101, categories: ['fashion'], specs: { ram: '16GB', storage: '512GB' } };

assert('Payload hợp lệ -> true', assertProductPayload(validProduct) === true);
assert('Sai ID -> false', assertProductPayload(invalidProduct1) === false);
assert('Thiếu category -> false', assertProductPayload(invalidProduct2) === false);
`,
      solution: `function assertProductPayload(product) {
  const isIdValid = product.id === 101;
  const hasCategory = Array.isArray(product.categories) && product.categories.includes('electronics');
  const isSpecsValid = product.specs?.ram === '16GB' && product.specs?.storage === '512GB';
  return isIdValid && hasCategory && isSpecsValid;
}`,
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
    where: { slug: 'auto-syntax-03-api-response-schema-assert' },
    update: {
      seriesId: seriesAutoSyntax.id,
      title: 'Viết Kịch Bản Kiểm Thử API Response Schema Chuyên Nghiệp',
      sandboxType: 'js_worker',
      objective: 'Viết assertions kiểm tra status 200, JWT token, không lộ password, và kiểm tra quyền RBAC',
      instructions: `# Viết Assertions Kiểm Thử API Response Chuẩn Production\n\nMột bài test API chuyên nghiệp luôn cần khẳng định:\n1. Status Code bằng 200.\n2. Header Content-Type là \`application/json\`.\n3. Trường \`tokens.accessToken\` tồn tại và là chuỗi không rỗng.\n4. Thông tin \`data.user\` tuyệt đối không bị rò rỉ trường \`password\` hoặc \`passwordHash\`.\n\n### Nhiệm Vụ Của Bạn:\nHoàn thành hàm \`validateLoginResponse(response)\` trả về \`true\` nếu response đáp ứng đủ 4 tiêu chí an toàn trên.`,
      initialSnippet: `function validateLoginResponse(response) {
  // TODO: Trả về true nếu thỏa mãn:
  // 1. response.status === 200
  // 2. response.headers['content-type'] chứa 'application/json'
  // 3. response.data?.tokens?.accessToken có độ dài > 20
  // 4. !('password' in (response.data?.user || {})) && !('passwordHash' in (response.data?.user || {}))
  
  return false;
}
`,
      testScript: `const goodRes = {
  status: 200,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  data: {
    user: { id: 'u1', name: 'Tester Pro' },
    tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MSJ9...' }
  }
};
const leakedRes = {
  status: 200,
  headers: { 'content-type': 'application/json' },
  data: {
    user: { id: 'u1', passwordHash: 'secret_hash_123' },
    tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  }
};
const badStatusRes = { ...goodRes, status: 500 };

assert('Good response -> true', validateLoginResponse(goodRes) === true);
assert('Leaked password -> false', validateLoginResponse(leakedRes) === false);
assert('Bad status -> false', validateLoginResponse(badStatusRes) === false);
`,
      solution: `function validateLoginResponse(response) {
  const isStatusOk = response.status === 200;
  const isJson = Boolean(response.headers?.['content-type']?.includes('application/json'));
  const hasToken = typeof response.data?.tokens?.accessToken === 'string' && response.data.tokens.accessToken.length > 20;
  const user = response.data?.user || {};
  const noPasswordLeak = !('password' in user) && !('passwordHash' in user);

  return isStatusOk && isJson && hasToken && noPasswordLeak;
}`,
      durationMinutes: 25,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 3,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
    create: {
      seriesId: seriesAutoSyntax.id,
      title: 'Viết Kịch Bản Kiểm Thử API Response Schema Chuyên Nghiệp',
      slug: 'auto-syntax-03-api-response-schema-assert',
      sandboxType: 'js_worker',
      objective: 'Viết assertions kiểm tra status 200, JWT token, không lộ password, và kiểm tra quyền RBAC',
      instructions: `# Viết Assertions Kiểm Thử API Response Chuẩn Production\n\nMột bài test API chuyên nghiệp luôn cần khẳng định:\n1. Status Code bằng 200.\n2. Header Content-Type là \`application/json\`.\n3. Trường \`tokens.accessToken\` tồn tại và là chuỗi không rỗng.\n4. Thông tin \`data.user\` tuyệt đối không bị rò rỉ trường \`password\` hoặc \`passwordHash\`.\n\n### Nhiệm Vụ Của Bạn:\nHoàn thành hàm \`validateLoginResponse(response)\` trả về \`true\` nếu response đáp ứng đủ 4 tiêu chí an toàn trên.`,
      initialSnippet: `function validateLoginResponse(response) {
  // TODO: Trả về true nếu thỏa mãn:
  // 1. response.status === 200
  // 2. response.headers['content-type'] chứa 'application/json'
  // 3. response.data?.tokens?.accessToken có độ dài > 20
  // 4. !('password' in (response.data?.user || {})) && !('passwordHash' in (response.data?.user || {}))
  
  return false;
}
`,
      testScript: `const goodRes = {
  status: 200,
  headers: { 'content-type': 'application/json; charset=utf-8' },
  data: {
    user: { id: 'u1', name: 'Tester Pro' },
    tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1MSJ9...' }
  }
};
const leakedRes = {
  status: 200,
  headers: { 'content-type': 'application/json' },
  data: {
    user: { id: 'u1', passwordHash: 'secret_hash_123' },
    tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
  }
};
const badStatusRes = { ...goodRes, status: 500 };

assert('Good response -> true', validateLoginResponse(goodRes) === true);
assert('Leaked password -> false', validateLoginResponse(leakedRes) === false);
assert('Bad status -> false', validateLoginResponse(badStatusRes) === false);
`,
      solution: `function validateLoginResponse(response) {
  const isStatusOk = response.status === 200;
  const isJson = Boolean(response.headers?.['content-type']?.includes('application/json'));
  const hasToken = typeof response.data?.tokens?.accessToken === 'string' && response.data.tokens.accessToken.length > 20;
  const user = response.data?.user || {};
  const noPasswordLeak = !('password' in user) && !('passwordHash' in user);

  return isStatusOk && isJson && hasToken && noPasswordLeak;
}`,
      durationMinutes: 25,
      isFreePreview: false,
      isProOnly: true,
      orderIndex: 3,
      isActive: true,
      status: ContentLifecycleStatus.published,
      authorId: contributorUser.id,
    },
  });

  console.log('✅ Seed completed successfully with 4 Curated Series and 17 Labs into PostgreSQL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
