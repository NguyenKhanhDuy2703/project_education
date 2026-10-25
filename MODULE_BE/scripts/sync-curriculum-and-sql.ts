import { PrismaClient, ContentLifecycleStatus } from '@prisma/client';

if (!process.argv.includes('--allow-destructive-legacy-sync')) {
  throw new Error(
    'Blocked legacy sync: this script deletes submissions for selected series. Use audit-curriculum-state.ts and sync-legacy-sql-fixtures-safe.ts instead.',
  );
}

const prisma = new PrismaClient();

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

function insertRows(table: string, rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0]);
  const colList = columns.join(', ');
  const values = rows
    .map((row) => {
      const rowValues = columns.map((col) => {
        const val = row[col];
        if (typeof val === 'number') return `${val}`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (val === null || val === undefined) return 'NULL';
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `(${rowValues.join(', ')})`;
    })
    .join(',\n    ');
  return `INSERT INTO ${table} (${colList}) VALUES\n    ${values};`;
}

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

const sql10Labs = [
  {
    legacySlug: 'w3schools-sql-01-select',
    slug: 'sql-01-select',
    title: 'SQL 01: Câu Lệnh SELECT',
    summary: 'Lấy tất cả cột từ bảng Customers',
    sampleData: customersSampleData,
    expectedQueryResult: customersSampleData,
    instructions: `# SQL 01: Câu Lệnh SELECT\n\nCâu lệnh \`SELECT\` được sử dụng để đọc và truy xuất dữ liệu từ một cơ sở dữ liệu.\n\n### Bảng dữ liệu: \`Customers\`\nCấu trúc các cột: \`CustomerID\`, \`CustomerName\`, \`ContactName\`, \`Address\`, \`City\`, \`PostalCode\`, \`Country\`.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để truy vấn toàn bộ dữ liệu (tất cả các cột) từ bảng \`Customers\`.`,
    initialSnippet: `-- Viết câu lệnh SQL để truy vấn toàn bộ dữ liệu từ bảng Customers\nSELECT `,
    testScript: `assert('Truy vấn bảng Customers', code.toUpperCase().includes('FROM CUSTOMERS') || code.toUpperCase().includes('FROM "CUSTOMERS"'));`,
    solution: `SELECT * FROM Customers;`,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    orderIndex: 1,
  },
  {
    legacySlug: 'w3schools-sql-02-select-columns',
    slug: 'sql-02-select-columns',
    title: 'SQL 02: SELECT Cột Cụ Thể',
    summary: 'Chỉ lấy 2 cột CustomerName và City từ bảng Customers',
    sampleData: customersSampleData,
    expectedQueryResult: customersSampleData.map((r) => ({ CustomerName: r.CustomerName, City: r.City })),
    instructions: `# SQL 02: SELECT Cột Cụ Thể\n\nThay vì dùng \`*\` để lấy toàn bộ cột, bạn có thể chỉ định chính xác tên các cột cần lấy, ngăn cách nhau bởi dấu phẩy.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL chỉ lấy 2 cột \`CustomerName\` và \`City\` từ bảng \`Customers\`.`,
    initialSnippet: `-- Viết câu lệnh SELECT chỉ lấy 2 cột CustomerName và City\nSELECT /* TODO: Điền CustomerName, City */\nFROM Customers;`,
    testScript: `assert('Lấy đúng 2 cột CustomerName và City', code.toUpperCase().includes('CUSTOMERNAME') && code.toUpperCase().includes('CITY') && code.toUpperCase().includes('FROM CUSTOMERS'));`,
    solution: `SELECT CustomerName, City FROM Customers;`,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    orderIndex: 2,
  },
  {
    legacySlug: 'w3schools-sql-03-select-distinct',
    slug: 'sql-03-select-distinct',
    title: 'SQL 03: SELECT DISTINCT',
    summary: 'Lấy danh sách các quốc gia Country không trùng lặp',
    sampleData: customersSampleData,
    expectedQueryResult: Array.from(new Set(customersSampleData.map((r) => r.Country))).map((c) => ({ Country: c })),
    instructions: `# SQL 03: SELECT DISTINCT\n\nTừ khóa \`SELECT DISTINCT\` dùng để trả về danh sách các giá trị khác nhau (loại bỏ các bản ghi trùng lặp).\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để lấy danh sách các quốc gia (\`Country\`) duy nhất từ bảng \`Customers\`.`,
    initialSnippet: `-- Lấy danh sách các Country không trùng lặp\nSELECT /* TODO: Thêm DISTINCT */ Country\nFROM Customers;`,
    testScript: `assert('Có từ khóa DISTINCT cho cột Country', code.toUpperCase().includes('DISTINCT') && code.toUpperCase().includes('COUNTRY') && code.toUpperCase().includes('FROM CUSTOMERS'));`,
    solution: `SELECT DISTINCT Country FROM Customers;`,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    orderIndex: 3,
  },
  {
    legacySlug: 'w3schools-sql-04-where',
    slug: 'sql-04-where',
    title: 'SQL 04: Mệnh Đề WHERE',
    summary: 'Lọc tất cả khách hàng tại Mexico',
    sampleData: customersSampleData,
    expectedQueryResult: customersSampleData.filter((r) => r.Country === 'Mexico'),
    instructions: `# SQL 04: Mệnh Đề WHERE\n\nMệnh đề \`WHERE\` được sử dụng để lọc các bản ghi, chỉ trích xuất những bản ghi thỏa mãn điều kiện chỉ định.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để lấy tất cả khách hàng sống tại quốc gia \`'Mexico'\` từ bảng \`Customers\`.`,
    initialSnippet: `-- Lọc khách hàng có Country là 'Mexico'\nSELECT * FROM Customers\nWHERE /* TODO: Thêm điều kiện Country = 'Mexico' */;`,
    testScript: `assert('Mệnh đề WHERE Country = Mexico', code.toUpperCase().includes('WHERE') && code.toUpperCase().includes('COUNTRY') && code.toUpperCase().includes('MEXICO'));`,
    solution: `SELECT * FROM Customers WHERE Country = 'Mexico';`,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    orderIndex: 4,
  },
  {
    legacySlug: 'w3schools-sql-05-order-by',
    slug: 'sql-05-order-by',
    title: 'SQL 05: Sắp Xếp ORDER BY',
    summary: 'Sắp xếp sản phẩm theo Price giảm dần (DESC)',
    sampleData: productsSampleData,
    expectedQueryResult: [...productsSampleData].sort((a, b) => b.Price - a.Price),
    instructions: `# SQL 05: Sắp Xếp ORDER BY\n\nTừ khóa \`ORDER BY\` được sử dụng để sắp xếp tập kết quả theo thứ tự tăng dần (\`ASC\`) hoặc giảm dần (\`DESC\`).\n\n### Bảng dữ liệu: \`Products\`\nCấu trúc các cột: \`ProductID\`, \`ProductName\`, \`CategoryID\`, \`Unit\`, \`Price\`.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để lấy toàn bộ sản phẩm từ bảng \`Products\`, sắp xếp theo giá (\`Price\`) giảm dần (\`DESC\`).`,
    initialSnippet: `-- Lấy sản phẩm và sắp xếp theo Price giảm dần\nSELECT * FROM Products\nORDER BY /* TODO: Sắp xếp theo Price DESC */;`,
    testScript: `assert('Sắp xếp ORDER BY Price DESC', code.toUpperCase().includes('ORDER BY') && code.toUpperCase().includes('PRICE') && code.toUpperCase().includes('DESC'));`,
    solution: `SELECT * FROM Products ORDER BY Price DESC;`,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    orderIndex: 5,
  },
  {
    legacySlug: 'w3schools-sql-06-and-or',
    slug: 'sql-06-and-or',
    title: 'SQL 06: Toán Tử AND & OR',
    summary: 'Lọc khách hàng sống tại Germany VÀ ở Berlin',
    sampleData: customersSampleData,
    expectedQueryResult: customersSampleData.filter((r) => r.Country === 'Germany' && r.City === 'Berlin'),
    instructions: `# SQL 06: Toán Tử AND & OR\n\nToán tử \`AND\` hiển thị bản ghi nếu TẤT CẢ các điều kiện đều đúng. Toán tử \`OR\` hiển thị bản ghi nếu BẤT KỲ điều kiện nào đúng.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL lấy khách hàng sống tại quốc gia \`'Germany'\` VÀ có thành phố là \`'Berlin'\`.`,
    initialSnippet: `-- Kết hợp điều kiện AND\nSELECT * FROM Customers\nWHERE Country = 'Germany' AND /* TODO: City = 'Berlin' */;`,
    testScript: `assert('Kết hợp điều kiện AND giữa Germany và Berlin', code.toUpperCase().includes('AND') && code.toUpperCase().includes('GERMANY') && code.toUpperCase().includes('BERLIN'));`,
    solution: `SELECT * FROM Customers WHERE Country = 'Germany' AND City = 'Berlin';`,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    orderIndex: 6,
  },
  {
    legacySlug: 'w3schools-sql-07-like',
    slug: 'sql-07-like',
    title: 'SQL 07: Toán Tử ILIKE & Ký Tự Đại Diện',
    summary: 'Tìm khách hàng có tên bắt đầu bằng chữ a',
    sampleData: customersSampleData,
    expectedQueryResult: customersSampleData.filter((r) => r.CustomerName.toLowerCase().startsWith('a')),
    instructions: `# SQL 07: Toán Tử ILIKE & Wildcards\n\nToán tử \`ILIKE\` của PostgreSQL tìm kiếm mẫu không phân biệt chữ hoa/chữ thường. Ký tự đại diện \`%\` đại diện cho 0, 1 hoặc nhiều ký tự.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL để tìm tất cả khách hàng có \`CustomerName\` bắt đầu bằng chữ \`'a'\` hoặc \`'A'\` (\`ILIKE 'a%'\`).`,
    initialSnippet: `-- Tìm khách hàng tên bắt đầu bằng chữ 'a'\nSELECT * FROM Customers\nWHERE CustomerName ILIKE /* TODO: Điền mẫu 'a%' */;`,
    testScript: `assert('Sử dụng toán tử ILIKE a%', code.toUpperCase().includes('ILIKE') && (code.includes("'a%'") || code.includes("'A%'") || code.toUpperCase().includes("'A%'")));`,
    solution: `SELECT * FROM Customers WHERE CustomerName ILIKE 'a%';`,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    orderIndex: 7,
  },
  {
    legacySlug: 'w3schools-sql-08-in',
    slug: 'sql-08-in',
    title: 'SQL 08: Toán Tử IN',
    summary: 'Lọc khách hàng thuộc Germany, France, UK',
    sampleData: customersSampleData,
    expectedQueryResult: customersSampleData.filter((r) => ['Germany', 'France', 'UK'].includes(r.Country)),
    instructions: `# SQL 08: Toán Tử IN\n\nToán tử \`IN\` cho phép bạn chỉ định nhiều giá trị trong một mệnh đề \`WHERE\`, tương đương với viết nhiều điều kiện \`OR\`.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL lấy khách hàng thuộc một trong ba quốc gia: \`'Germany'\`, \`'France'\`, \`'UK'\`.`,
    initialSnippet: `-- Lọc khách hàng thuộc 3 quốc gia\nSELECT * FROM Customers\nWHERE Country IN (/* TODO: 'Germany', 'France', 'UK' */);`,
    testScript: `assert('Sử dụng IN với Germany, France, UK', code.toUpperCase().includes('IN') && code.toUpperCase().includes('GERMANY') && code.toUpperCase().includes('UK'));`,
    solution: `SELECT * FROM Customers WHERE Country IN ('Germany', 'France', 'UK');`,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    orderIndex: 8,
  },
  {
    legacySlug: 'w3schools-sql-09-between',
    slug: 'sql-09-between',
    title: 'SQL 09: Toán Tử BETWEEN',
    summary: 'Lọc sản phẩm có giá nằm trong khoảng từ 10 đến 20',
    sampleData: productsSampleData,
    expectedQueryResult: productsSampleData.filter((r) => r.Price >= 10 && r.Price <= 20),
    instructions: `# SQL 09: Toán Tử BETWEEN\n\nToán tử \`BETWEEN\` chọn các giá trị trong một phạm vi nhất định (bao gồm cả hai giá trị đầu và cuối).\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL lấy các sản phẩm từ bảng \`Products\` có giá (\`Price\`) nằm trong khoảng từ \`10\` đến \`20\`.`,
    initialSnippet: `-- Lọc sản phẩm có Price từ 10 đến 20\nSELECT * FROM Products\nWHERE Price BETWEEN /* TODO: 10 AND 20 */;`,
    testScript: `assert('Toán tử BETWEEN 10 AND 20', code.toUpperCase().includes('BETWEEN') && code.includes('10') && code.includes('20'));`,
    solution: `SELECT * FROM Products WHERE Price BETWEEN 10 AND 20;`,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    orderIndex: 9,
  },
  {
    legacySlug: 'w3schools-sql-10-count-group-by',
    slug: 'sql-10-count-group-by',
    title: 'SQL 10: Hàm COUNT & Mệnh Đề GROUP BY',
    summary: 'Đếm số lượng khách hàng theo từng quốc gia Country',
    sampleData: customersSampleData,
    expectedQueryResult: [
      { count: 1, Country: 'Germany' },
      { count: 3, Country: 'Mexico' },
      { count: 1, Country: 'UK' },
      { count: 1, Country: 'Sweden' },
      { count: 1, Country: 'France' },
    ],
    instructions: `# SQL 10: Hàm COUNT() & Mệnh Đề GROUP BY\n\nMệnh đề \`GROUP BY\` thường được sử dụng cùng các hàm tổng hợp (\`COUNT()\`, \`MAX()\`, \`MIN()\`, \`SUM()\`, \`AVG()\`) để nhóm tập kết quả theo một hoặc nhiều cột.\n\n### Nhiệm Vụ Của Bạn:\nViết câu lệnh SQL đếm số lượng khách hàng ở mỗi quốc gia (\`COUNT(CustomerID)\`), nhóm theo cột \`Country\`.`,
    initialSnippet: `-- Đếm khách hàng nhóm theo Country\nSELECT COUNT(CustomerID), Country\nFROM Customers\nGROUP BY /* TODO: Nhóm theo Country */;`,
    testScript: `assert('COUNT và GROUP BY Country', code.toUpperCase().includes('COUNT') && code.toUpperCase().includes('GROUP BY') && code.toUpperCase().includes('COUNTRY'));`,
    solution: `SELECT COUNT(CustomerID), Country FROM Customers GROUP BY Country;`,
    durationMinutes: 25,
    isFreePreview: false,
    isProOnly: true,
    orderIndex: 10,
  },
];

async function main() {
  console.log('🚀 Starting safe sync and cleanup...');

  // 1. DELETE JUNK COURSES & LABS
  console.log('🧹 Purging junk courses: dcv, hjgh, nfgds...');
  const junkSlugs = ['dcv', 'hjgh', 'nfgds'];
  const junkSeries = await prisma.labSeries.findMany({ where: { slug: { in: junkSlugs } } });
  for (const js of junkSeries) {
    await prisma.labSubmission.deleteMany({ where: { lab: { seriesId: js.id } } });
    await prisma.lab.deleteMany({ where: { seriesId: js.id } });
    await prisma.labSeries.delete({ where: { id: js.id } });
    console.log(`  Deleted junk series: ${js.slug} (${js.id})`);
  }

  // Deactivate legacy series outside the primary triad
  const legacyInactiveSlugs = ['sql-database-fundamentals', 'nestjs-api-co-ban', 'docker-co-ban', 'api-testing-postman'];
  await prisma.labSeries.updateMany({
    where: { slug: { in: legacyInactiveSlugs } },
    data: { isActive: false },
  });
  console.log('  Deactivated legacy inactive series:', legacyInactiveSlugs.join(', '));

  // 2. FIND OR UPSERT PRIMARY SQL SERIES
  let sqlSeries = await prisma.labSeries.findFirst({
    where: {
      OR: [
        { slug: 'sql-query-fundamentals' },
        { slug: 'w3schools-sql-fundamentals' },
      ],
    },
  });

  if (!sqlSeries) {
    sqlSeries = await prisma.labSeries.create({
      data: {
        title: 'SQL Query Fundamentals',
        slug: 'sql-query-fundamentals',
        category: 'database',
        description: 'Làm chủ 10 câu lệnh truy vấn SQL kinh điển: SELECT, DISTINCT, WHERE, ORDER BY, AND/OR, LIKE, IN, BETWEEN, COUNT, GROUP BY.',
        level: 'beginner',
        coverEmoji: '🗄️',
        orderIndex: 1,
        isProOnly: false,
        isActive: true,
        status: ContentLifecycleStatus.published,
      },
    });
  } else {
    sqlSeries = await prisma.labSeries.update({
      where: { id: sqlSeries.id },
      data: {
        title: 'SQL Query Fundamentals',
        description: 'Làm chủ 10 câu lệnh truy vấn SQL kinh điển: SELECT, DISTINCT, WHERE, ORDER BY, AND/OR, LIKE, IN, BETWEEN, COUNT, GROUP BY.',
        isActive: true,
        status: ContentLifecycleStatus.published,
      },
    });
  }
  console.log(`✅ SQL Series synced: ${sqlSeries.title} (${sqlSeries.slug})`);

  // 3. UPSERT THE 10 SQL LABS WITH COMPLETE SCHEMA AND SEED
  for (const lab of sql10Labs) {
    const usesProducts = lab.sampleData === productsSampleData;
    const schemaSql = usesProducts ? productsSchemaSql : customersSchemaSql;
    const seedSql = usesProducts ? productsSeedSql : customersSeedSql;

    const objectiveData = JSON.stringify({
      version: '2.0',
      summary: lab.summary,
      schemaSql,
      seedSql,
      sampleData: lab.sampleData,
      expectedQueryResult: lab.expectedQueryResult,
      statementPolicy: 'read_only',
      timeoutMs: 3000,
      maxResultRows: 500,
      maxResultColumns: 50,
    });

    // Check if lab exists under legacySlug or new slug
    const existing = await prisma.lab.findFirst({
      where: {
        OR: [
          { slug: lab.slug },
          { slug: lab.legacySlug },
        ],
      },
    });

    if (existing) {
      await prisma.lab.update({
        where: { id: existing.id },
        data: {
          seriesId: sqlSeries.id,
          title: lab.title,
          slug: lab.slug, // modernize slug
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
        },
      });
      console.log(`  Updated SQL Lab: ${lab.title} (${lab.slug}) with schemaSql & seedSql`);
    } else {
      await prisma.lab.create({
        data: {
          seriesId: sqlSeries.id,
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
        },
      });
      console.log(`  Created SQL Lab: ${lab.title} (${lab.slug})`);
    }
  }

  // 4. FIX INITIALSNIPPET FOR E-COMMERCE SQL LABS IF THEY EXIST
  const ecomRevLab = await prisma.lab.findUnique({ where: { slug: 'sql-ecom-revenue-by-customer' } });
  if (ecomRevLab) {
    await prisma.lab.update({
      where: { id: ecomRevLab.id },
      data: {
        initialSnippet: `-- Tính tổng doanh thu các đơn completed của từng khách hàng\nSELECT c.name, /* TODO: SUM(o.total_amount) AS revenue */\nFROM customers c\nINNER JOIN orders o ON /* TODO: c.id = o.customer_id */\nWHERE o.status = 'completed'\nGROUP BY /* TODO: c.name */;`,
      },
    });
    console.log('  Updated initialSnippet for sql-ecom-revenue-by-customer');
  }

  const ecomVipLab = await prisma.lab.findUnique({ where: { slug: 'sql-ecom-having-vip-revenue' } });
  if (ecomVipLab) {
    await prisma.lab.update({
      where: { id: ecomVipLab.id },
      data: {
        initialSnippet: `-- Lọc khách hàng có tổng revenue > 1000000 với HAVING\nSELECT c.name, SUM(o.total_amount) AS revenue\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.name\nHAVING /* TODO: SUM(o.total_amount) > 1000000 */;`,
      },
    });
    console.log('  Updated initialSnippet for sql-ecom-having-vip-revenue');
  }

  // 5. CONFIRM ACTIVE COURSES IN DB
  const activeSeries = await prisma.labSeries.findMany({
    where: { isActive: true },
    select: { id: true, title: true, slug: true, category: true },
  });
  console.log(`\n🎉 Sync complete! Total active series in DB: ${activeSeries.length}`);
  for (const s of activeSeries) {
    const labCount = await prisma.lab.count({ where: { seriesId: s.id, isActive: true } });
    console.log(`- [${s.category}] ${s.title} (${s.slug}): ${labCount} labs`);
  }
}

main()
  .catch((err) => {
    console.error('Error during sync:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
