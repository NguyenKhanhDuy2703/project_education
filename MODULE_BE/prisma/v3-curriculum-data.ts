/**
 * v3-curriculum-data.ts
 *
 * Full MVP 24-lesson Curriculum Data for study-web:
 * - 8 PostgreSQL Business Scenario SQL Labs
 * - 8 Scenario-Based Testing Theory Quiz Labs (40 questions total)
 * - 8 Playwright Automation Low-Code Labs (Block Builder, Smart Cloze, Guided/Full Code)
 *
 * Principles:
 * - First 3 lessons in each series are Free Preview (isFreePreview: true, isProOnly: false).
 * - Last 5 lessons in each series are Pro (isFreePreview: false, isProOnly: true).
 * - Vietnamese pedagogy explanations; English code, selectors, and API contracts.
 */

// ============================================================================
// 1. Series 1: SQL In-Browser Mastery (8 Practical Business Labs)
// ============================================================================

export const V3_SQL_SERIES = {
  id: 'series-sql-v3-mastery',
  slug: 'postgresql-business-scenarios',
  title: 'PostgreSQL: 8 Tình Huống Truy Vấn Nghiệp Vụ Thực Tế',
  category: 'database',
  level: 'beginner',
  coverEmoji: '🐘',
  orderIndex: 1,
  isProOnly: false,
  description:
    'Lộ trình 8 bài thực hành SQL trên PGlite in-memory WebAssembly. Học truy vấn dữ liệu từ các tình huống nghiệp vụ thực tế của Manual QA và Data Analyst: điều tra đơn hàng failed, phân khúc khách hàng, phát hiện tài khoản ảo, đối soát doanh thu, cảnh báo kho hàng, và xếp hạng sản phẩm.',
};

export const V3_SQL_SECTIONS = [
  { id: 'sec-sql-01', seriesId: 'series-sql-v3-mastery', title: 'Module 1: Truy Vấn & Lọc Dữ Liệu Cơ Bản', orderIndex: 0 },
  { id: 'sec-sql-02', seriesId: 'series-sql-v3-mastery', title: 'Module 2: Thống Kê & Kết Hợp Bảng Nghiệp Vụ', orderIndex: 1 },
  { id: 'sec-sql-03', seriesId: 'series-sql-v3-mastery', title: 'Module 3: Bẫy Logic & Dữ Liệu Bất Thường', orderIndex: 2 },
  { id: 'sec-sql-04', seriesId: 'series-sql-v3-mastery', title: 'Module 4: Tối Ưu & Phân Tích Chuyên Sâu (CTE & Window Functions)', orderIndex: 3 },
];

export const V3_QUIZ_SECTIONS = [
  { id: 'sec-quiz-01', seriesId: 'series-quiz-v3-certification', title: 'Module 1: Nền Tảng & Vòng Đời Kiểm Thử', orderIndex: 0 },
  { id: 'sec-quiz-02', seriesId: 'series-quiz-v3-certification', title: 'Module 2: Kỹ Thuật Thiết Kế Test Case', orderIndex: 1 },
  { id: 'sec-quiz-03', seriesId: 'series-quiz-v3-certification', title: 'Module 3: Báo Cáo Bug & Phân Loại Lỗi', orderIndex: 2 },
  { id: 'sec-quiz-04', seriesId: 'series-quiz-v3-certification', title: 'Module 4: Kiểm Thử Nghiệp Vụ Thực Tế & API Status', orderIndex: 3 },
];

export const V3_AUTO_SECTIONS = [
  { id: 'sec-auto-01', seriesId: 'series-auto-v3-playwright', title: 'Module 1: Cấu Trúc Kiểm Thử & Định Vị Resilient', orderIndex: 0 },
  { id: 'sec-auto-02', seriesId: 'series-auto-v3-playwright', title: 'Module 2: Thao Tác Người Dùng & Web-First Assertions', orderIndex: 1 },
  { id: 'sec-auto-03', seriesId: 'series-auto-v3-playwright', title: 'Module 3: Kịch Bản Xác Thực & Dữ Liệu Tham Số Hóa', orderIndex: 2 },
  { id: 'sec-auto-04', seriesId: 'series-auto-v3-playwright', title: 'Module 4: Quy Trình E2E Production & Cô Lập Kiểm Thử', orderIndex: 3 },
];

export const V3_SQL_LABS = [
  {
    id: 'lab-sql-v3-01',
    slug: 'sql-v3-01-failed-orders',
    title: 'Bài 1: Điều Tra Đơn Hàng Thất Bại (SELECT & WHERE)',
    sandboxType: 'sql_worker',
    orderIndex: 1,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Khách hàng khiếu nại tài khoản ngân hàng đã bị trừ tiền nhưng giao diện ứng dụng báo "Giao dịch không thành công". Là QA điều tra sự cố, bạn cần truy vấn bảng \`orders\` để lọc ra tất cả các đơn hàng thất bại gần nhất.

### 2. Sơ Đồ Cấu Trúc Bảng (Schema Diagram)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| \`id\` | SERIAL | PRIMARY KEY | Định danh đơn hàng |
| \`order_code\` | VARCHAR(20) | NOT NULL | Mã đơn hàng (VD: ORD-9001) |
| \`customer_name\` | VARCHAR(100) | NOT NULL | Tên khách hàng |
| \`amount\` | NUMERIC(10,2) | NOT NULL | Giá trị giao dịch |
| \`status\` | VARCHAR(20) | NOT NULL | Trạng thái: 'completed', 'failed', 'pending' |
| \`created_at\` | TIMESTAMPTZ | NOT NULL | Thời điểm khởi tạo đơn |

### 3. Nhiệm Vụ Của Bạn
Viết câu lệnh SQL lấy 3 cột:
- \`order_code\`: Mã đơn hàng
- \`customer_name\`: Tên khách hàng
- \`amount\`: Số tiền giao dịch
Chỉ lấy các đơn hàng có trạng thái \`status = 'failed'\`, sắp xếp giảm dần theo thời gian tạo (\`created_at DESC\`).

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Dùng \`SELECT *\` thay vì liệt kê chính xác 3 cột yêu cầu làm sai lệch cấu trúc dữ liệu trả về.
- Quên mệnh đề \`DESC\` khiến kết quả sắp xếp tăng dần từ cũ nhất đến mới nhất.
- Dùng dấu nháy kép \`"failed"\` thay vì dấu nháy đơn \`'failed'\`.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Sử dụng mệnh đề \`WHERE\` để so sánh chuỗi chính xác và mệnh đề \`ORDER BY\` kết hợp từ khóa sắp xếp giảm dần.
- **Tầng 2 (Cú pháp)**: \`SELECT col1, col2 FROM tbl WHERE col = 'val' ORDER BY date_col DESC;\`

### 6. Thử Thách Mở Rộng
Hãy thử tìm thêm tổng số tiền (\`SUM(amount)\`) của toàn bộ các giao dịch thất bại trong ngày hôm đó!`,
    initialSnippet: '-- Viết câu truy vấn tìm các đơn hàng failed gần nhất\nSELECT ',
    solution: `SELECT order_code, customer_name, amount\nFROM orders\nWHERE status = 'failed'\nORDER BY created_at DESC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);`,
      seedSql: `INSERT INTO orders (id, order_code, customer_name, amount, status, created_at) VALUES
  (1, 'ORD-9001', 'Nguyen Van An', 150.00, 'completed', '2026-10-01 10:00:00+07'),
  (2, 'ORD-9002', 'Tran Thi Binh', 220.50, 'failed', '2026-10-01 10:15:00+07'),
  (3, 'ORD-9003', 'Le Hoang Cuong', 85.00, 'pending', '2026-10-01 10:30:00+07'),
  (4, 'ORD-9004', 'Pham Minh Duc', 310.00, 'failed', '2026-10-01 11:00:00+07'),
  (5, 'ORD-9005', 'Vo Thi Em', 45.00, 'completed', '2026-10-01 11:20:00+07'),
  (6, 'ORD-9006', 'Dang Van Giang', 500.00, 'failed', '2026-10-01 12:00:00+07'),
  (7, 'ORD-9007', 'Hoang My Hanh', 120.00, 'completed', '2026-10-01 12:30:00+07'),
  (8, 'ORD-9008', 'Ngo Quoc Khanh', 95.00, 'failed', '2026-10-01 13:00:00+07');`,
      expectedQueryResult: [
        { order_code: 'ORD-9008', customer_name: 'Ngo Quoc Khanh', amount: '95.00' },
        { order_code: 'ORD-9006', customer_name: 'Dang Van Giang', amount: '500.00' },
        { order_code: 'ORD-9004', customer_name: 'Pham Minh Duc', amount: '310.00' },
        { order_code: 'ORD-9002', customer_name: 'Tran Thi Binh', amount: '220.50' },
      ],
      expectedColumns: ['order_code', 'customer_name', 'amount'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-02',
    slug: 'sql-v3-02-customer-segments',
    title: 'Bài 2: Phân Khúc Khách Hàng Cho Chiến Dịch (IN, BETWEEN, ILIKE)',
    sandboxType: 'sql_worker',
    orderIndex: 2,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Đội ngũ Marketing chạy chiến dịch gửi quà tặng tri ân khách hàng. Đối tượng ưu tiên là khách hàng ở thành phố lớn ('Hanoi', 'Danang') có mức chi tiêu từ 500 đến 2000 USD, HOẶC khách hàng sử dụng email tổ chức (đuôi email kết thúc bằng \`.org\`).

### 2. Sơ Đồ Cấu Trúc Bảng (Schema Diagram)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| \`id\` | SERIAL | PRIMARY KEY | Định danh khách hàng |
| \`name\` | VARCHAR(100) | NOT NULL | Họ và tên khách hàng |
| \`email\` | VARCHAR(100) | NOT NULL | Địa chỉ thư điện tử |
| \`city\` | VARCHAR(50) | NOT NULL | Thành phố cư trú |
| \`total_spent\` | NUMERIC(10,2) | NOT NULL | Tổng tích lũy chi tiêu |

### 3. Nhiệm Vụ Của Bạn
Viết câu truy vấn lấy danh sách gồm 4 cột: \`name\`, \`email\`, \`city\`, \`total_spent\` từ bảng \`customers\` thỏa mãn điều kiện trên. Sắp xếp tăng dần theo \`name ASC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Không đóng mở ngoặc đơn \`()\` cho cặp điều kiện \`AND\`, dẫn đến độ ưu tiên toán tử sai lệch giữa \`AND\` và \`OR\`.
- Sử dụng \`LIKE\` hoa thường nhạy cảm thay vì \`ILIKE\` để so sánh không phân biệt hoa thường với đuôi \`.org\`.
- Nhầm lẫn giữa toán tử \`BETWEEN ... AND ...\` (bao gồm cả 2 đầu mút 500 và 2000).

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Gom nhóm điều kiện thành phố và chi tiêu: \`(city IN (...) AND total_spent BETWEEN ...) OR email ILIKE '%.org'\`.
- **Tầng 2 (Cú pháp)**: Ký tự đại diện \`%\` trong SQL khớp với chuỗi ký tự bất kỳ đứng trước.

### 6. Thử Thách Mở Rộng
Thử đếm số lượng khách hàng theo từng thành phố bằng \`GROUP BY city\` kết hợp điều kiện lọc \`HAVING\`!`,
    initialSnippet: '-- Viết câu truy vấn lọc khách hàng theo điều kiện kết hợp\nSELECT ',
    solution: `SELECT name, email, city, total_spent\nFROM customers\nWHERE (city IN ('Hanoi', 'Danang') AND total_spent BETWEEN 500 AND 2000)\n   OR email ILIKE '%.org'\nORDER BY name ASC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  total_spent NUMERIC(10,2) NOT NULL
);`,
      seedSql: `INSERT INTO customers (id, name, email, city, total_spent) VALUES
  (1, 'Alice Nguyen', 'alice@fpt.edu.vn', 'Hanoi', 650.00),
  (2, 'Bob Tran', 'bob@gmail.com', 'Hanoi', 400.00),
  (3, 'Charlie Le', 'charlie@techcorp.org', 'Saigon', 350.00),
  (4, 'David Pham', 'david@danang.edu.vn', 'Danang', 1200.00),
  (5, 'Emma Vo', 'emma@yahoo.com', 'Danang', 750.00),
  (6, 'Frank Dang', 'frank@gmail.com', 'Hue', 900.00),
  (7, 'Grace Hoang', 'grace@ngo.org', 'Saigon', 1500.00),
  (8, 'Henry Ngo', 'henry@hust.edu.vn', 'Haiphong', 200.00);`,
      expectedQueryResult: [
        { name: 'Alice Nguyen', email: 'alice@fpt.edu.vn', city: 'Hanoi', total_spent: '650.00' },
        { name: 'Charlie Le', email: 'charlie@techcorp.org', city: 'Saigon', total_spent: '350.00' },
        { name: 'David Pham', email: 'david@danang.edu.vn', city: 'Danang', total_spent: '1200.00' },
        { name: 'Emma Vo', email: 'emma@yahoo.com', city: 'Danang', total_spent: '750.00' },
        { name: 'Grace Hoang', email: 'grace@ngo.org', city: 'Saigon', total_spent: '1500.00' },
      ],
      expectedColumns: ['name', 'email', 'city', 'total_spent'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-03',
    slug: 'sql-v3-03-duplicate-accounts',
    title: 'Bài 3: Phát Hiện Tài Khoản Trùng Lặp (COUNT & HAVING)',
    sandboxType: 'sql_worker',
    orderIndex: 3,
    durationMinutes: 20,
    isFreePreview: true,
    isProOnly: false,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Hệ thống phòng chống gian lận (Anti-Fraud) nghi ngờ một số đối tượng cố tình đăng ký nhiều tài khoản bằng cùng một số điện thoại để trục lợi mã giảm giá chào mừng người dùng mới.

### 2. Sơ Đồ Cấu Trúc Bảng (Schema Diagram)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| \`id\` | SERIAL | PRIMARY KEY | Định danh tài khoản |
| \`username\` | VARCHAR(50) | NOT NULL | Tên tài khoản đăng nhập |
| \`phone\` | VARCHAR(20) | NOT NULL | Số điện thoại đăng ký |
| \`created_at\` | DATE | NOT NULL | Ngày tạo tài khoản |

### 3. Nhiệm Vụ Của Bạn
Viết câu truy vấn tìm các số điện thoại (\`phone\`) xuất hiện từ 2 tài khoản trở lên trong bảng \`user_accounts\`, kèm theo số lượng tài khoản \`account_count\`. Sắp xếp giảm dần theo \`account_count DESC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Dùng \`WHERE COUNT(*) >= 2\` thay vì \`HAVING COUNT(*) >= 2\` (hàm tổng hợp không được dùng trong \`WHERE\`).
- Quên đặt bí danh (alias) \`AS account_count\` cho cột đếm số lượng.
- Liệt kê các cột không nằm trong mệnh đề \`GROUP BY\` dẫn đến lỗi \`must appear in the GROUP BY clause\`.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Gom nhóm theo \`phone\`, đếm số bản ghi bằng \`COUNT(*)\`, và lọc nhóm bằng \`HAVING\`.
- **Tầng 2 (Cú pháp)**: \`SELECT phone, COUNT(*) AS account_count FROM user_accounts GROUP BY phone HAVING COUNT(*) >= 2 ORDER BY account_count DESC;\`

### 6. Thử Thách Mở Rộng
Lấy danh sách các \`username\` cùng chia sẻ số điện thoại trùng lặp bằng cách sử dụng \`STRING_AGG(username, ', ')\`!`,
    initialSnippet: '-- Tìm các số điện thoại trùng lặp có >= 2 tài khoản\nSELECT ',
    solution: `SELECT phone, COUNT(*) AS account_count\nFROM user_accounts\nGROUP BY phone\nHAVING COUNT(*) >= 2\nORDER BY account_count DESC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE user_accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at DATE NOT NULL
);`,
      seedSql: `INSERT INTO user_accounts (id, username, phone, created_at) VALUES
  (1, 'user_an', '0901234567', '2026-10-01'),
  (2, 'user_binh', '0909999888', '2026-10-01'),
  (3, 'user_an_2', '0901234567', '2026-10-02'),
  (4, 'user_cuong', '0905555444', '2026-10-02'),
  (5, 'user_an_clone', '0901234567', '2026-10-03'),
  (6, 'user_duc', '0907777111', '2026-10-03'),
  (7, 'user_binh_vip', '0909999888', '2026-10-04'),
  (8, 'user_hoa', '0903333222', '2026-10-04');`,
      expectedQueryResult: [
        { phone: '0901234567', account_count: 3 },
        { phone: '0909999888', account_count: 2 },
      ],
      expectedColumns: ['phone', 'account_count'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-04',
    slug: 'sql-v3-04-ecommerce-revenue-reconciliation',
    title: 'Bài 4: Đối Soát Doanh Thu Thương Mại Điện Tử (INNER JOIN & SUM)',
    sandboxType: 'sql_worker',
    orderIndex: 4,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Kế toán đối soát doanh thu cần biết tổng số tiền thanh toán thực tế của từng khách hàng doanh nghiệp từ các đơn hàng thành công (\`status = 'completed'\`).

### 2. Sơ Đồ Quan Hệ & Cấu Trúc Bảng (Schema Diagram)
\`\`\`
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ clients                         │       │ client_orders                   │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK, SERIAL)                 │ 1:N   │ id (PK, SERIAL)                 │
│ client_name (VARCHAR)           │<──────┤ client_id (FK -> clients.id)    │
│                                 │       │ total_amount (NUMERIC)          │
│                                 │       │ status (VARCHAR)                │
└─────────────────────────────────┘       └─────────────────────────────────┘
\`\`\`

### 3. Nhiệm Vụ Của Bạn
Viết câu truy vấn ghép bảng \`clients\` và \`client_orders\` bằng \`INNER JOIN\` để tính tổng doanh thu \`total_revenue\` theo từng \`client_name\`. Sắp xếp giảm dần theo \`total_revenue DESC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Quên điều kiện lọc \`status = 'completed'\` dẫn đến cộng gộp cả các đơn bị hủy (\`cancelled\`) hoặc thất bại (\`failed\`).
- Quên gom nhóm \`GROUP BY c.client_name\` khi thực hiện hàm tổng hợp \`SUM(o.total_amount)\`.
- Nhầm lẫn giữa \`INNER JOIN\` và \`LEFT JOIN\` khi báo cáo chỉ yêu cầu các doanh nghiệp có đơn hàng thành công.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Ghép bảng trên khóa ngoại \`c.id = o.client_id\`, lọc \`o.status = 'completed'\` trước khi tính tổng.
- **Tầng 2 (Cú pháp)**: \`SELECT c.client_name, SUM(o.total_amount) AS total_revenue FROM clients c INNER JOIN ... GROUP BY c.client_name ORDER BY total_revenue DESC;\`

### 6. Thử Thách Mở Rộng
Thử dùng \`ROUND(SUM(o.total_amount), 2)\` và tính giá trị trung bình mỗi đơn (\`AVG(o.total_amount)\`) của từng khách hàng!`,
    initialSnippet: '-- Nối bảng clients và client_orders để tính tổng doanh thu completed\nSELECT ',
    solution: `SELECT c.client_name, SUM(o.total_amount) AS total_revenue\nFROM clients c\nINNER JOIN client_orders o ON c.id = o.client_id\nWHERE o.status = 'completed'\nGROUP BY c.client_name\nORDER BY total_revenue DESC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL
);
CREATE TABLE client_orders (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id),
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL
);`,
      seedSql: `INSERT INTO clients (id, client_name) VALUES
  (1, 'Minh Beta Corp'), (2, 'Hoa Phat Tech'), (3, 'Viet Retail'), (4, 'Global Logistics');
INSERT INTO client_orders (id, client_id, total_amount, status) VALUES
  (101, 1, 1200.00, 'completed'),
  (102, 1, 800.00, 'completed'),
  (103, 1, 300.00, 'cancelled'),
  (104, 2, 2500.00, 'completed'),
  (105, 3, 400.00, 'failed'),
  (106, 2, 1500.00, 'completed');`,
      expectedQueryResult: [
        { client_name: 'Hoa Phat Tech', total_revenue: '4000.00' },
        { client_name: 'Minh Beta Corp', total_revenue: '2000.00' },
      ],
      expectedColumns: ['client_name', 'total_revenue'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-05',
    slug: 'sql-v3-05-unclaimed-customers-products',
    title: 'Bài 5: Tìm Khách Hàng Bị Bỏ Quên (LEFT JOIN & IS NULL)',
    sandboxType: 'sql_worker',
    orderIndex: 5,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Để kích hoạt người dùng mới đăng ký, phòng CRM cần trích xuất danh sách các thành viên chưa từng đặt bất kỳ đơn hàng nào.

### 2. Sơ Đồ Quan Hệ & Cấu Trúc Bảng (Schema Diagram)
\`\`\`
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ registered_users                │       │ purchase_orders                 │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK, SERIAL)                 │ 1:N   │ id (PK, SERIAL)                 │
│ full_name (VARCHAR)             │<──────┤ user_id (FK -> users.id)        │
│ email (VARCHAR)                 │       │ order_date (DATE)               │
└─────────────────────────────────┘       └─────────────────────────────────┘
\`\`\`

### 3. Nhiệm Vụ Của Bạn
Dùng \`LEFT JOIN\` giữa \`registered_users\` và \`purchase_orders\`, kết hợp \`WHERE p.id IS NULL\` để tìm \`full_name\` và \`email\` của những khách hàng chưa mua hàng. Sắp xếp tăng dần theo \`full_name ASC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Dùng \`p.id = NULL\` thay vì cú pháp chuẩn \`p.id IS NULL\` (trong SQL \`NULL = NULL\` trả về UNKNOWN thay vì TRUE).
- Dùng \`INNER JOIN\` thay vì \`LEFT JOIN\` (INNER JOIN sẽ loại bỏ hoàn toàn các bản ghi không khớp).
- Kiểm tra \`WHERE u.id IS NULL\` thay vì kiểm tra khóa của bảng bên phải \`p.id IS NULL\`.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: \`LEFT JOIN\` giữ lại toàn bộ người dùng. Với những người chưa mua, các cột của bảng đơn hàng sẽ là \`NULL\`.
- **Tầng 2 (Cú pháp)**: \`SELECT u.full_name, u.email FROM registered_users u LEFT JOIN purchase_orders p ON u.id = p.user_id WHERE p.id IS NULL ORDER BY u.full_name ASC;\`

### 6. Thử Thách Mở Rộng
Thực hiện truy vấn tương đương bằng kỹ thuật subquery \`WHERE u.id NOT IN (SELECT user_id FROM purchase_orders)\` hoặc \`NOT EXISTS\`!`,
    initialSnippet: '-- Tìm người dùng chưa có đơn hàng nào bằng LEFT JOIN\nSELECT ',
    solution: `SELECT u.full_name, u.email\nFROM registered_users u\nLEFT JOIN purchase_orders p ON u.id = p.user_id\nWHERE p.id IS NULL\nORDER BY u.full_name ASC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE registered_users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL
);
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES registered_users(id),
  order_date DATE NOT NULL
);`,
      seedSql: `INSERT INTO registered_users (id, full_name, email) VALUES
  (1, 'Le Van Tam', 'tam@gmail.com'),
  (2, 'Do Thi Mai', 'mai@gmail.com'),
  (3, 'Phan Minh Tuan', 'tuan@gmail.com'),
  (4, 'Vu Thi Ngoc', 'ngoc@gmail.com');
INSERT INTO purchase_orders (id, user_id, order_date) VALUES
  (1, 1, '2026-10-01'),
  (2, 3, '2026-10-02');`,
      expectedQueryResult: [
        { full_name: 'Do Thi Mai', email: 'mai@gmail.com' },
        { full_name: 'Vu Thi Ngoc', email: 'ngoc@gmail.com' },
      ],
      expectedColumns: ['full_name', 'email'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-06',
    slug: 'sql-v3-06-inventory-stock-alerts',
    title: 'Bài 6: Cảnh Báo Tồn Kho Hàng Hóa (CASE WHEN)',
    sandboxType: 'sql_worker',
    orderIndex: 6,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Hệ thống quản lý chuỗi cung ứng yêu cầu phân loại tình trạng hàng tồn kho: hết hàng (\`'out_of_stock'\`), sắp hết hàng (\`'low_stock'\`), và đủ hàng an toàn (\`'healthy'\`).

### 2. Sơ Đồ Cấu Trúc Bảng (Schema Diagram)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| \`id\` | SERIAL | PRIMARY KEY | Định danh mặt hàng |
| \`product_name\` | VARCHAR(100) | NOT NULL | Tên sản phẩm |
| \`stock_quantity\` | INT | NOT NULL | Số lượng tồn kho thực tế |

### 3. Nhiệm Vụ Của Bạn
Lấy 3 cột: \`product_name\`, \`stock_quantity\` và cột phân loại \`stock_status\` theo quy tắc biểu thức logic \`CASE WHEN\`:
- Nếu \`stock_quantity = 0\` thì \`'out_of_stock'\`
- Nếu \`stock_quantity <= 10\` thì \`'low_stock'\`
- Các trường hợp còn lại là \`'healthy'\`
Sắp xếp theo \`stock_quantity\` tăng dần (\`ASC\`), nếu bằng nhau thì sắp xếp theo \`product_name ASC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Thứ tự các nhánh \`WHEN\`: Nếu đặt điều kiện \`<= 10\` trước \`= 0\`, trường hợp \`= 0\` sẽ bị nuốt vào nhánh \`low_stock\`.
- Quên từ khóa kết thúc \`END\` hoặc quên đặt tên bí danh \`AS stock_status\`.
- Quên tiêu chí sắp xếp thứ hai \`product_name ASC\` khi có nhiều sản phẩm cùng số lượng tồn kho.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Mệnh đề \`CASE WHEN condition1 THEN val1 WHEN condition2 THEN val2 ELSE val3 END\`.
- **Tầng 2 (Cú pháp)**: Sắp xếp nhiều cột: \`ORDER BY col1 ASC, col2 ASC;\`.

### 6. Thử Thách Mở Rộng
Thử đếm số lượng mặt hàng thuộc từng nhóm trạng thái tồn kho bằng cách lồng \`CASE\` vào trong \`COUNT\` hoặc \`GROUP BY\`!`,
    initialSnippet: '-- Phân loại trạng thái tồn kho bằng biểu thức CASE\nSELECT ',
    solution: `SELECT product_name, stock_quantity,\n  CASE\n    WHEN stock_quantity = 0 THEN 'out_of_stock'\n    WHEN stock_quantity <= 10 THEN 'low_stock'\n    ELSE 'healthy'\n  END AS stock_status\nFROM warehouse_items\nORDER BY stock_quantity ASC, product_name ASC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE warehouse_items (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  stock_quantity INT NOT NULL
);`,
      seedSql: `INSERT INTO warehouse_items (id, product_name, stock_quantity) VALUES
  (1, 'USB Cable Type-C', 0),
  (2, 'Wireless Keyboard', 5),
  (3, '27-inch 4K Monitor', 45),
  (4, 'Gaming Mouse Pad', 8),
  (5, 'Bluetooth Earbuds', 0),
  (6, 'Laptop Stand', 25);`,
      expectedQueryResult: [
        { product_name: 'Bluetooth Earbuds', stock_quantity: 0, stock_status: 'out_of_stock' },
        { product_name: 'USB Cable Type-C', stock_quantity: 0, stock_status: 'out_of_stock' },
        { product_name: 'Wireless Keyboard', stock_quantity: 5, stock_status: 'low_stock' },
        { product_name: 'Gaming Mouse Pad', stock_quantity: 8, stock_status: 'low_stock' },
        { product_name: 'Laptop Stand', stock_quantity: 25, stock_status: 'healthy' },
        { product_name: '27-inch 4K Monitor', stock_quantity: 45, stock_status: 'healthy' },
      ],
      expectedColumns: ['product_name', 'stock_quantity', 'stock_status'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-07',
    slug: 'sql-v3-07-support-ticket-sla',
    title: 'Bài 7: Theo Dõi Cam Kết SLA Ticket Hỗ Trợ (CTE & Interval)',
    sandboxType: 'sql_worker',
    orderIndex: 7,
    durationMinutes: 25,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Đội ngũ hỗ trợ kỹ thuật cam kết: Ticket cấp độ \`'URGENT'\` phải phản hồi trong vòng 2 giờ (\`INTERVAL '2 hours'\`), ticket cấp độ \`'HIGH'\` phải phản hồi trong vòng 4 giờ (\`INTERVAL '4 hours'\`).

### 2. Sơ Đồ Cấu Trúc Bảng (Schema Diagram)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| \`id\` | SERIAL | PRIMARY KEY | Định danh ticket |
| \`ticket_code\` | VARCHAR(20) | NOT NULL | Mã tra cứu hỗ trợ |
| \`priority\` | VARCHAR(10) | NOT NULL | Mức độ ưu tiên ('URGENT', 'HIGH') |
| \`created_at\` | TIMESTAMPTZ | NOT NULL | Thời điểm khách tạo ticket |
| \`first_responded_at\` | TIMESTAMPTZ | NOT NULL | Thời điểm phản hồi đầu tiên |

### 3. Nhiệm Vụ Của Bạn
Dùng Common Table Expression (CTE \`WITH\`) để tính khoảng thời gian phản hồi \`first_responded_at - created_at\` và lọc ra danh sách \`ticket_code\`, \`priority\` của các ticket vi phạm thời hạn cam kết SLA. Sắp xếp tăng dần theo \`ticket_code ASC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Trừ nhầm thứ tự \`created_at - first_responded_at\` cho ra khoảng thời gian âm.
- Không dùng kiểu dữ liệu \`INTERVAL\` mà so sánh số nguyên thô với timestamp.
- Quên bao đóng dấu ngoặc đơn \`()\` khi kết hợp logic giữa \`priority\` và \`response_duration\`.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Định nghĩa CTE \`WITH sla_metrics AS (SELECT ticket_code, priority, (first_responded_at - created_at) AS response_duration FROM support_tickets)\`.
- **Tầng 2 (Cú pháp)**: Trong câu lệnh chính: \`SELECT ticket_code, priority FROM sla_metrics WHERE (priority = 'URGENT' AND response_duration > INTERVAL '2 hours') OR ...\`.

### 6. Thử Thách Mở Rộng
Tính số phút phản hồi trung bình (\`AVG(EXTRACT(EPOCH FROM response_duration)/60)\`) theo từng cấp độ ưu tiên!`,
    initialSnippet: '-- Viết CTE tính thời gian và lọc ticket vi phạm SLA\nWITH ',
    solution: `WITH sla_metrics AS (\n  SELECT ticket_code, priority,\n         (first_responded_at - created_at) AS response_duration\n  FROM support_tickets\n)\nSELECT ticket_code, priority\nFROM sla_metrics\nWHERE (priority = 'URGENT' AND response_duration > INTERVAL '2 hours')\n   OR (priority = 'HIGH' AND response_duration > INTERVAL '4 hours')\nORDER BY ticket_code ASC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  first_responded_at TIMESTAMPTZ NOT NULL
);`,
      seedSql: `INSERT INTO support_tickets (id, ticket_code, priority, created_at, first_responded_at) VALUES
  (1, 'TCK-101', 'URGENT', '2026-10-01 08:00:00+07', '2026-10-01 11:30:00+07'),
  (2, 'TCK-102', 'URGENT', '2026-10-01 09:00:00+07', '2026-10-01 09:45:00+07'),
  (3, 'TCK-103', 'HIGH',   '2026-10-01 08:30:00+07', '2026-10-01 13:00:00+07'),
  (4, 'TCK-104', 'HIGH',   '2026-10-01 10:00:00+07', '2026-10-01 12:00:00+07'),
  (5, 'TCK-105', 'URGENT', '2026-10-01 14:00:00+07', '2026-10-01 17:00:00+07');`,
      expectedQueryResult: [
        { ticket_code: 'TCK-101', priority: 'URGENT' },
        { ticket_code: 'TCK-103', priority: 'HIGH' },
        { ticket_code: 'TCK-105', priority: 'URGENT' },
      ],
      expectedColumns: ['ticket_code', 'priority'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },

  {
    id: 'lab-sql-v3-08',
    slug: 'sql-v3-08-category-product-ranking',
    title: 'Bài 8: Xếp Hạng Sản Phẩm Bán Chạy Nhất (ROW_NUMBER & PARTITION BY)',
    sandboxType: 'sql_worker',
    orderIndex: 8,
    durationMinutes: 25,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### 1. Bối Cảnh Nghiệp Vụ
Ban giám đốc yêu cầu báo cáo top 1 sản phẩm bán chạy nhất (số lượng \`units_sold\` cao nhất) trong từng danh mục hàng hóa (\`category\`).

### 2. Sơ Đồ Cấu Trúc Bảng (Schema Diagram)
| Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa |
| :--- | :--- | :--- | :--- |
| \`id\` | SERIAL | PRIMARY KEY | Định danh sản phẩm |
| \`category\` | VARCHAR(50) | NOT NULL | Danh mục (Audio, Display, Keyboard) |
| \`product_name\` | VARCHAR(100) | NOT NULL | Tên mặt hàng |
| \`units_sold\` | INT | NOT NULL | Số lượng đã bán |

### 3. Nhiệm Vụ Của Bạn
Sử dụng hàm xếp hạng Window Function \`ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC)\` trong CTE để lấy 3 cột: \`category\`, \`product_name\`, \`units_sold\` của các sản phẩm xếp hạng 1 (\`rank_pos = 1\`). Sắp xếp tăng dần theo \`category ASC\`.

### 4. Cạm Bẫy Phổ Biến Cần Tránh
- Cố gắng đặt điều kiện \`WHERE ROW_NUMBER() = 1\` trực tiếp trong cùng câu lệnh (Window Function không được dùng trực tiếp trong \`WHERE\`, bắt buộc phải bọc qua CTE hoặc subquery).
- Quên mệnh đề \`PARTITION BY category\` khiến hàm xếp hạng tính trên toàn bộ bảng thay vì từng danh mục.
- Nhầm thứ tự \`ORDER BY units_sold DESC\` bên trong mệnh đề \`OVER()\`.

### 5. Gợi Ý Phân Tầng
- **Tầng 1 (Tư duy)**: Đánh số thứ tự trong CTE: \`ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rank_pos\`.
- **Tầng 2 (Cú pháp)**: Truy vấn từ CTE: \`SELECT category, product_name, units_sold FROM ranked_products WHERE rank_pos = 1 ORDER BY category ASC;\`

### 6. Thử Thách Mở Rộng
Thay \`ROW_NUMBER()\` bằng \`DENSE_RANK()\` và quan sát sự khác biệt khi có 2 sản phẩm đồng hạng về doanh số!`,
    initialSnippet: '-- Sử dụng Window Function ROW_NUMBER() để xếp hạng sản phẩm theo danh mục\nWITH ',
    solution: `WITH ranked_products AS (\n  SELECT category, product_name, units_sold,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rank_pos\n  FROM catalog_products\n)\nSELECT category, product_name, units_sold\nFROM ranked_products\nWHERE rank_pos = 1\nORDER BY category ASC;`,
    config: {
      version: '2.0',
      schemaSql: `CREATE TABLE catalog_products (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  units_sold INT NOT NULL
);`,
      seedSql: `INSERT INTO catalog_products (id, category, product_name, units_sold) VALUES
  (1, 'Audio', 'AirPods Pro', 450),
  (2, 'Audio', 'Sony WH-1000XM5', 380),
  (3, 'Audio', 'JBL Flip 6', 290),
  (4, 'Display', 'Dell UltraSharp 27', 520),
  (5, 'Display', 'LG C3 OLED', 310),
  (6, 'Display', 'Samsung Odyssey G7', 410),
  (7, 'Keyboard', 'Keychron Q1 Pro', 620),
  (8, 'Keyboard', 'Logitech MX Keys', 580);`,
      expectedQueryResult: [
        { category: 'Audio', product_name: 'AirPods Pro', units_sold: 450 },
        { category: 'Display', product_name: 'Dell UltraSharp 27', units_sold: 520 },
        { category: 'Keyboard', product_name: 'Keychron Q1 Pro', units_sold: 620 },
      ],
      expectedColumns: ['category', 'product_name', 'units_sold'],
      orderSensitive: true,
      statementPolicy: 'read_only',
    },
  },
];


// ============================================================================
// 2. Series 2: Testing Theory Quizel Certification (8 Labs x 5 Questions = 40)
// ============================================================================

export const V3_QUIZ_SERIES = {
  id: 'series-quiz-v3-certification',
  slug: 'testing-theory-scenario-quiz',
  title: 'Testing Theory: 40 Tình Huống Kiểm Thử Thực Tế ISTQB & Security',
  category: 'testing',
  level: 'beginner',
  coverEmoji: '🎯',
  orderIndex: 2,
  isProOnly: false,
  description:
    'Bộ 8 bài kiểm tra trắc nghiệm tình huống chuyên sâu bám sát chuẩn ISTQB CTFL v4.0.1 và OWASP WSTG. Mỗi bài gồm 5 câu hỏi tình huống thực tế, giải thích cặn kẽ tại sao đúng và tại sao sai, giúp Manual QA làm chủ tư duy chất lượng phần mềm.',
};

export const V3_QUIZ_LABS = [
  {
    id: 'lab-quiz-v3-01',
    slug: 'quiz-v3-01-seven-testing-principles',
    title: 'Quiz 01: 7 Nguyên Lý Kiểm Thử Trong Đợt Release Có Deadline',
    sandboxType: 'quizlet',
    orderIndex: 1,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: 'Hãy phân tích từng tình huống thực tế dưới góc nhìn của 7 nguyên lý kiểm thử phần mềm ISTQB. Đạt tối thiểu 80% (4/5 câu đúng) để hoàn thành bài lab.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q1_1',
          question: 'Nhóm phát triển chuẩn bị release tính năng trước 17h. Toàn bộ 200 test case đã pass. Giám đốc hỏi QA Lead: "Chúng ta có chắc chắn 100% hệ thống không còn lỗi nào không?". Phản hồi chuẩn xác nhất là gì?',
          options: [
            'Đúng, nếu toàn bộ 200 test case pass thì hệ thống sạch lỗi hoàn toàn.',
            'Không, vì kiểm thử chỉ chứng minh sự hiện diện của lỗi, không thể chứng minh phần mềm không có lỗi (Testing shows presence of defects, not absence).',
            'Đúng, nhưng chỉ khi code coverage đạt 100%.',
            'Không, phần mềm chỉ hết lỗi sau khi khách hàng sử dụng 30 ngày.',
          ],
          correctIndex: 1,
          hint: 'Nhớ lại nguyên lý cơ bản số 1 của ISTQB.',
          explanation: 'Theo Nguyên lý 1 của ISTQB, testing chỉ giúp giảm xác suất lỗi còn sót lại; không một lượng kiểm thử nào có thể chứng minh sản phẩm sạch lỗi 100%.',
        },
        {
          id: 'q1_2',
          question: 'Một form thanh toán có 5 trường dữ liệu. Tester mới đề xuất kiểm thử mọi tổ hợp giá trị có thể nhập vào. Phản hồi hợp lý từ Senior QA là gì?',
          options: [
            'Hoan nghênh vì kiểm thử toàn bộ (Exhaustive Testing) là bắt buộc.',
            'Bác bỏ vì kiểm thử cạn kiệt toàn bộ mọi tổ hợp là bất khả thi; cần sử dụng phân tích rủi ro và kỹ thuật thiết kế test case để ưu tiên.',
            'Chỉ chạy kiểm thử cạn kiệt trên Staging, không chạy trên Dev.',
            'Thay bằng Playwright vì máy tính chạy hết mọi tổ hợp trong vài giây.',
          ],
          correctIndex: 1,
          hint: 'Xem xét số lượng tổ hợp của 5 trường dữ liệu.',
          explanation: 'Theo Nguyên lý 2 (Exhaustive testing is impossible), trừ hệ thống cực đơn giản, kiểm tra mọi tổ hợp là bất khả thi. Phải dùng Risk-based testing.',
        },
        {
          id: 'q1_3',
          question: 'Trong 6 sprint liên tiếp, QA lặp lại cùng một bộ 50 test case hồi quy. Số lỗi mới phát hiện về 0, nhưng lên Production khách hàng vẫn gặp lỗi. Hiện tượng này là gì?',
          options: [
            'Lỗi tập trung cục bộ (Defect Clustering).',
            'Nghịch lý thuốc trừ sâu (Pesticide Paradox) — lặp lại cùng một bộ test sẽ không tìm thêm được lỗi mới.',
            'Ảo tưởng về sự vắng bóng của lỗi (Absence-of-errors fallacy).',
            'Kiểm thử sớm (Early Testing).',
          ],
          correctIndex: 1,
          hint: 'Tương tự côn trùng kháng thuốc trừ sâu.',
          explanation: 'Theo Nguyên lý 5 (Pesticide Paradox), bộ test case cần được cập nhật và bổ sung kịch bản mới định kỳ để phát hiện lỗi trong phần code mới sửa đổi.',
        },
        {
          id: 'q1_4',
          question: 'Thống kê cho thấy 80% số lỗi nghiêm trọng chỉ xuất hiện trong module Khuyến mãi và Cổng thanh toán. Nguyên lý nào giải thích điều này?',
          options: [
            'Defect Clustering (Tập trung lỗi) — phần lớn lỗi tập trung ở một số ít module phức tạp.',
            'Early Testing — QA nên dừng test 2 module này chuyển sang module khác.',
            'Testing is context dependent.',
            'Exhaustive testing.',
          ],
          correctIndex: 0,
          hint: 'Quy luật Pareto 80/20 trong phân bố lỗi.',
          explanation: 'Theo Nguyên lý 4 (Defect Clustering), các module có logic phức tạp hoặc phụ thuộc nhiều dịch vụ thường chứa đa số lỗi của hệ thống.',
        },
        {
          id: 'q1_5',
          question: 'Ứng dụng quản trị kho bàn giao đúng hạn, pass 100% test case nhưng công nhân kho từ chối dùng vì thao tác quét mã vạch mất quá nhiều bước. Đây là ví dụ của:',
          options: [
            'Testing shows presence of defects.',
            'Early Testing saves time.',
            'Absence-of-errors fallacy (Ảo tưởng không có lỗi không đồng nghĩa với phần mềm đáp ứng đúng nhu cầu người dùng).',
            'Testing is context dependent.',
          ],
          correctIndex: 2,
          hint: 'Phần mềm không có lỗi kỹ thuật nhưng người dùng không dùng được.',
          explanation: 'Theo Nguyên lý 7 (Absence-of-errors fallacy), phần mềm không có bug kỹ thuật vẫn thất bại nếu không giải quyết đúng nhu cầu thực tế của người dùng.',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-02',
    slug: 'quiz-v3-02-static-testing-requirements-review',
    title: 'Quiz 02: Review Requirement & Static Testing Trước Khi Viết Code',
    sandboxType: 'quizlet',
    orderIndex: 2,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: 'Phân tích kỹ năng rà soát tài liệu yêu cầu, static analysis và kỹ thuật review trước khi lập trình viên bắt tay viết code.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q2_1',
          question: 'Trong bản đặc tả có câu: "Hệ thống phải phản hồi nhanh chóng khi bấm tìm kiếm". Lý do chính QA yêu cầu PO sửa lại là gì?',
          options: [
            'Từ "nhanh chóng" mang tính định tính, mơ hồ, không đo lường được và không kiểm thử được (Non-testable requirement).',
            'QA không có quyền can thiệp vào tài liệu của Product Owner.',
            'Tìm kiếm bắt buộc phải dùng Elasticsearch.',
            'Kiểm thử tĩnh không áp dụng cho User Story.',
          ],
          correctIndex: 0,
          hint: 'Tiêu chuẩn nghiệm thu phải đo lường được bằng số liệu cụ thể.',
          explanation: 'Yêu cầu kiểm thử được phải định lượng rõ ràng (ví dụ: phản hồi dưới 2 giây với 500 CCU). "Nhanh chóng" là mơ hồ.',
        },
        {
          id: 'q2_2',
          question: 'Hoạt động nào sau đây thuộc về Kiểm Thử Tĩnh (Static Testing)?',
          options: [
            'Chạy script Playwright trên trình duyệt.',
            'Đăng nhập và kiểm tra cookie trên browser.',
            'Thực hiện Peer Code Review và rà soát tài liệu kiến trúc mà không thực thi code.',
            'Dùng k6 bắn 10,000 requests để đo tải API.',
          ],
          correctIndex: 2,
          hint: 'Điểm khác biệt cốt lõi là có "chạy code" hay không.',
          explanation: 'Static Testing là kiểm tra tài liệu, mã nguồn (Code review, Linter) mà không cần chạy chương trình.',
        },
        {
          id: 'q2_3',
          question: 'Trong buổi Formal Inspection tài liệu kỹ thuật, vai trò nào chịu trách nhiệm điều phối cuộc họp và quản lý thời gian?',
          options: [
            'Author (Tác giả).',
            'Moderator / Facilitator (Người điều phối).',
            'Project Manager.',
            'Scribe (Người ghi chép).',
          ],
          correctIndex: 1,
          hint: 'Vai trò trung gian dẫn dắt cuộc họp theo quy chuẩn ISTQB.',
          explanation: 'Moderator điều phối cuộc họp, đảm bảo tiến độ và hòa giải thảo luận; Scribe ghi chép biên bản; Author giải trình.',
        },
        {
          id: 'q2_4',
          question: 'Tại sao phát hiện lỗi ở giai đoạn Yêu cầu (Requirements) tiết kiệm chi phí gấp hàng chục lần so với ở giai đoạn System Testing?',
          options: [
            'Sửa một dòng chữ trong tài liệu tốn ít chi phí hơn nhiều so với việc code lại và sửa database sau này.',
            'Tester không cần trả lương khi review tài liệu.',
            'Developer không bao giờ mắc lỗi nếu tài liệu chi tiết.',
            'Product Owner chịu toàn bộ chi phí phát sinh.',
          ],
          correctIndex: 0,
          hint: 'Đường cong chi phí sửa lỗi phần mềm tăng theo cấp số nhân.',
          explanation: 'Lỗi yêu cầu nếu lọt vào code sẽ kéo theo sai thiết kế, sai DB, sai API. Sửa muộn ở UAT hoặc Prod tốn chi phí gấp hàng chục lần.',
        },
        {
          id: 'q2_5',
          question: 'Khi review tài liệu API Specification, checklist nào sau đây là quan trọng nhất đối với QA?',
          options: [
            'Tài liệu có dùng font Times New Roman cỡ 13 không.',
            'Các mã phản hồi HTTP lỗi (400, 401, 403, 404, 422, 500) và schema lỗi có được định nghĩa chi tiết cho từng endpoint không.',
            'Tên developer có được ghi ở trang bìa không.',
            'Độ dài tài liệu có dưới 50 trang không.',
          ],
          correctIndex: 1,
          hint: 'Tính hoàn chỉnh của hợp đồng API cho cả trường hợp thất bại.',
          explanation: 'Tài liệu API chuẩn bắt buộc phải nêu rõ định dạng request/response cho cả Happy Path lẫn Unhappy Path.',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-03',
    slug: 'quiz-v3-03-test-levels-types-web-api-db',
    title: 'Quiz 03: Test Levels & Test Types Trong Luồng Web–API–Database',
    sandboxType: 'quizlet',
    orderIndex: 3,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: 'Phân biệt 4 cấp độ kiểm thử (Unit, Integration, System, UAT) và các loại kiểm thử (Functional, Non-functional, Regression).',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q3_1',
          question: 'Kiểm thử việc gọi API từ Service A sang Service B và ghi dữ liệu xuống cơ sở dữ liệu PostgreSQL thuộc về cấp độ nào?',
          options: [
            'Unit Testing (Kiểm thử đơn vị).',
            'Integration Testing (Kiểm thử tích hợp).',
            'Acceptance Testing (Kiểm thử chấp nhận người dùng).',
            'Alpha Testing.',
          ],
          correctIndex: 1,
          hint: 'Tập trung vào giao tiếp và truyền nhận dữ liệu giữa các module.',
          explanation: 'Integration Testing kiểm tra tính tương tác giữa các đơn vị thành phần (API gọi Database, Microservice tương tác).',
        },
        {
          id: 'q3_2',
          question: 'Kiểm thử toàn bộ luồng từ giao diện Web, gọi Backend API, xử lý nghiệp vụ và xác nhận email gửi về người dùng được gọi là:',
          options: [
            'Component Testing.',
            'System Testing / End-to-End (E2E) Testing.',
            'Unit Testing.',
            'Static Analysis.',
          ],
          correctIndex: 1,
          hint: 'Kiểm thử hệ thống hoàn chỉnh từ đầu đến cuối luồng.',
          explanation: 'System Testing kiểm thử hệ thống tích hợp đầy đủ để đánh giá sự tuân thủ với các yêu cầu nghiệp vụ quy định.',
        },
        {
          id: 'q3_3',
          question: 'Kiểm tra xem hệ thống có chịu được 5,000 lượt đặt hàng đồng thời trong dịp Black Friday không là loại kiểm thử nào?',
          options: [
            'Functional Testing (Kiểm thử chức năng).',
            'Non-Functional Testing (Kiểm thử phi chức năng - Cụ thể là Performance/Load Testing).',
            'Structural Testing (White-box).',
            'Usability Testing.',
          ],
          correctIndex: 1,
          hint: 'Kiểm tra "hệ thống hoạt động tốt như thế nào" (how well it works) thay vì "hệ thống làm được gì" (what it does).',
          explanation: 'Hiệu năng, độ tải, bảo mật, khả năng phục hồi thuộc nhóm Non-Functional Testing.',
        },
        {
          id: 'q3_4',
          question: 'Sau khi Developer sửa một bug ở màn hình Checkout, QA chạy lại toàn bộ giỏ hàng và danh mục sản phẩm để làm gì?',
          options: [
            'Regression Testing (Kiểm thử hồi quy) — đảm bảo việc sửa lỗi không gây ảnh hưởng tiêu cực đến các phần tính năng đang hoạt động tốt.',
            'Exploratory Testing.',
            'Unit Testing.',
            'Acceptance Testing.',
          ],
          correctIndex: 0,
          hint: 'Đảm bảo code mới không làm hỏng tính năng cũ.',
          explanation: 'Regression Testing kiểm tra xem thay đổi mã nguồn có làm phát sinh lỗi ngoài ý muốn ở các khu vực liên quan hay không.',
        },
        {
          id: 'q3_5',
          question: 'Ai là người chịu trách nhiệm chính trong việc thực hiện User Acceptance Testing (UAT)?',
          options: [
            'Developer viết mã nguồn.',
            'Khách hàng, Product Owner hoặc người dùng doanh nghiệp đại diện cho người dùng cuối.',
            'Database Administrator.',
            'DevOps Engineer triển khai hạ tầng.',
          ],
          correctIndex: 1,
          hint: 'Người quyết định sản phẩm có đủ điều kiện nghiệm thu bàn giao hay không.',
          explanation: 'UAT do khách hàng hoặc người đại diện người dùng thực hiện để quyết định nghiệm thu và đưa sản phẩm vào sử dụng.',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-04',
    slug: 'quiz-v3-04-defect-lifecycle-severity-priority',
    title: 'Quiz 04: Vòng Đời Lỗi (Defect Lifecycle) & Phân Loại Trong Bug Triage',
    sandboxType: 'quizlet',
    orderIndex: 4,
    durationMinutes: 15,
    isFreePreview: false,
    isProOnly: true,
    instructions: 'Hiểu rõ các trạng thái của Bug (New, Open, Fixed, Retest, Closed, Reopened) và phân biệt rạch ròi giữa Severity và Priority.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q4_1',
          question: 'Logo công ty ở trang chủ bị sai màu thương hiệu ngay trước đợt họp báo công bố đối tác chiến lược. Đánh giá mức độ của bug này như thế nào?',
          options: [
            'Severity: Critical, Priority: Low.',
            'Severity: Low (không ảnh hưởng chức năng), Priority: High (cần sửa gấp vì ảnh hưởng thương hiệu trước họp báo).',
            'Severity: High, Priority: Low.',
            'Severity: Blocker, Priority: Low.',
          ],
          correctIndex: 1,
          hint: 'Severity đánh giá tác động kỹ thuật; Priority đánh giá mức độ khẩn cấp xử lý nghiệp vụ.',
          explanation: 'Sai màu logo không gây crash hay mất dữ liệu (Severity Low), nhưng vì có họp báo khẩn cấp nên cần fix ngay (Priority High).',
        },
        {
          id: 'q4_2',
          question: 'Một bug gây sập hệ thống cơ sở dữ liệu nếu nhập 1 chuỗi 500 ký tự vào ô tìm kiếm ở 1 màn hình nội bộ chỉ dành cho 1 nhân viên dùng 1 năm 1 lần. Đánh giá hợp lý:',
          options: [
            'Severity: Critical (sập DB), Priority: Medium hoặc Low (xác suất xảy ra cực thấp, nội bộ).',
            'Severity: Low, Priority: Blocker.',
            'Severity: Trivial, Priority: Urgent.',
            'Không cần ghi nhận bug.',
          ],
          correctIndex: 0,
          hint: 'Hậu quả kỹ thuật rất lớn (sập DB) nhưng tác động kinh doanh ít khẩn cấp.',
          explanation: 'Severity đo lường mức độ phá hủy kỹ thuật (Critical), nhưng vì ít người dùng và tần suất thấp nên Priority được xếp sau các lỗi thanh toán.',
        },
        {
          id: 'q4_3',
          question: 'Developer đánh dấu bug là "Fixed". Bước tiếp theo chuẩn mực của QA là gì?',
          options: [
            'Đóng bug ngay lập tức và chuyển sang trạng thái "Closed".',
            'Kiểm thử lại trên môi trường build mới (Retest); nếu lỗi đã hết thì chuyển "Closed", nếu lỗi vẫn còn thì chuyển "Reopened".',
            'Xóa bug khỏi Jira.',
            'Chuyển bug sang cho Product Owner.',
          ],
          correctIndex: 1,
          hint: 'QA bắt buộc phải kiểm chứng thực tế trước khi chốt đóng lỗi.',
          explanation: 'Sau khi Developer báo "Fixed", QA phải Retest. Chỉ khi verify thành công trên môi trường kiểm thử mới được Close ticket.',
        },
        {
          id: 'q4_4',
          question: 'Sự khác biệt cốt lõi giữa Defect (Bug) và Failure là gì?',
          options: [
            'Defect là khuyết tật trong mã nguồn hoặc tài liệu; Failure là biểu hiện sai lệch của hệ thống khi chạy thực tế.',
            'Defect do QA tạo ra, Failure do Developer tạo ra.',
            'Defect là lỗi phần cứng, Failure là lỗi phần mềm.',
            'Không có sự khác biệt, hai từ này đồng nghĩa hoàn toàn.',
          ],
          correctIndex: 0,
          hint: 'Error (sai lầm của con người) ➔ Defect (trong code) ➔ Failure (hệ thống chạy sai).',
          explanation: 'Defect là lỗi tồn tại tĩnh trong code. Khi đoạn code đó được thực thi và cho kết quả sai, đó là Failure.',
        },
        {
          id: 'q4_5',
          question: 'Trong buổi Bug Triage, vai trò của QA là gì?',
          options: [
            'Trực tiếp sửa mã nguồn cho developer.',
            'Giải thích bối cảnh tái hiện lỗi, mức độ tác động và bảo vệ góc nhìn chất lượng của người dùng để cùng team chốt độ ưu tiên.',
            'Bắt buộc developer phải nhận mọi bug ở mức Blocker.',
            'Phê duyệt ngân sách dự án.',
          ],
          correctIndex: 1,
          hint: 'Bug Triage là cuộc họp xem xét, đánh giá và phân loại độ ưu tiên của các bug vừa phát hiện.',
          explanation: 'QA cung cấp dữ liệu kiểm thử, log, bước tái hiện để Product Owner và Tech Lead đưa ra quyết định fix trong release nào.',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-05',
    slug: 'quiz-v3-05-equivalence-partitioning-forms',
    title: 'Quiz 05: Kỹ Thuật Phân Vùng Tương Đương (Equivalence Partitioning)',
    sandboxType: 'quizlet',
    orderIndex: 5,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: 'Áp dụng kỹ thuật phân vùng tương đương để tối ưu số lượng test case cho form tuổi, số tiền và độ dài mật khẩu.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q5_1',
          question: 'Ô nhập độ tuổi chỉ chấp nhận người từ 18 đến 60 tuổi (số nguyên). Có bao nhiêu phân vùng tương đương (Valid & Invalid)?',
          options: [
            '1 phân vùng: [18..60].',
            '3 phân vùng: Tuổi < 18 (Invalid), 18 <= Tuổi <= 60 (Valid), Tuổi > 60 (Invalid).',
            '43 phân vùng cho từng giá trị tuổi từ 18 đến 60.',
            '2 phân vùng: Số chẵn và số lẻ.',
          ],
          correctIndex: 1,
          hint: 'Gồm 1 khoảng hợp lệ và 2 khoảng không hợp lệ ở hai phía.',
          explanation: 'Equivalence Partitioning chia thành 3 phân vùng: Dưới 18 (Không hợp lệ), Từ 18 đến 60 (Hợp lệ), và Trên 60 (Không hợp lệ).',
        },
        {
          id: 'q5_2',
          question: 'Để kiểm thử form tuổi ở trên bằng kỹ thuật Phân vùng tương đương, số lượng test case tối thiểu cần chạy là:',
          options: [
            '43 test case.',
            '3 test case (chọn 1 giá trị đại diện cho mỗi phân vùng, ví dụ: 10, 25, 70).',
            '1 test case.',
            '100 test case.',
          ],
          correctIndex: 1,
          hint: 'Mỗi phân vùng chỉ cần chọn 1 giá trị đại diện.',
          explanation: 'Nguyên lý của phân vùng tương đương là các giá trị trong cùng 1 phân vùng được hệ thống xử lý giống nhau, nên chỉ cần 1 đại diện/vùng.',
        },
        {
          id: 'q5_3',
          question: 'Form mật khẩu yêu cầu từ 8 đến 16 ký tự. Giá trị nào sau đây đại diện cho phân vùng KHÔNG HỢP LỆ vì quá ngắn?',
          options: [
            '"Pass123" (7 ký tự).',
            '"SecretPassword1" (16 ký tự).',
            '"Hello1234" (9 ký tự).',
            '"StrongPass!2026" (15 ký tự).',
          ],
          correctIndex: 0,
          hint: '7 ký tự nhỏ hơn độ dài tối thiểu 8.',
          explanation: '"Pass123" có 7 ký tự thuộc phân vùng Invalid (độ dài < 8).',
        },
        {
          id: 'q5_4',
          question: 'Hệ thống cho phép rút tiền từ 50,000 đến 5,000,000 VND và phải là bội số của 50,000. Phân vùng nào sau đây là KHÔNG HỢP LỆ?',
          options: [
            '100,000 VND.',
            '2,500,000 VND.',
            '75,000 VND (nằm trong khoảng nhưng không phải bội số của 50,000).',
            '5,000,000 VND.',
          ],
          correctIndex: 2,
          hint: 'Chú ý điều kiện kép: khoảng giá trị và điều kiện chia hết.',
          explanation: '75,000 VND là phân vùng không hợp lệ vì vi phạm quy tắc chia hết cho 50,000 VND.',
        },
        {
          id: 'q5_5',
          question: 'Lợi ích lớn nhất của kỹ thuật Phân vùng tương đương là:',
          options: [
            'Giúp Tester tăng số lượng test case lên gấp 10 lần.',
            'Giảm đáng kể số lượng test case cần thực thi nhưng vẫn duy trì độ bao phủ lỗi tốt.',
            'Loại bỏ hoàn toàn sự cần thiết của kiểm thử tự động.',
            'Đảm bảo 100% không còn lỗi ở biên.',
          ],
          correctIndex: 1,
          hint: 'Tối ưu hóa nguồn lực kiểm thử có hạn.',
          explanation: 'Kỹ thuật này giúp tránh kiểm thử trùng lặp các giá trị có cùng bản chất hành vi, tiết kiệm thời gian thực thi.',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-06',
    slug: 'quiz-v3-06-boundary-value-analysis-limits',
    title: 'Quiz 06: Phân Tích Giá Trị Biên (Boundary Value Analysis)',
    sandboxType: 'quizlet',
    orderIndex: 6,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: 'Kỹ thuật BVA 2 điểm và 3 điểm cho các giới hạn tải file, số lượng giỏ hàng và số lần thử OTP.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q6_1',
          question: 'Giỏ hàng cho phép đặt số lượng từ 1 đến 10 sản phẩm. Theo kỹ thuật 2-point BVA, các giá trị cần kiểm tra là:',
          options: [
            '0, 1, 10, 11.',
            '1, 2, 9, 10.',
            '5, 6.',
            '-1, 0, 1, 10, 11, 12.',
          ],
          correctIndex: 0,
          hint: '2-point BVA lấy giá trị biên và giá trị ngay bên ngoài biên.',
          explanation: 'Biên dưới là 1 (chọn 0 và 1), biên trên là 10 (chọn 10 và 11). Tập giá trị 2-point BVA là {0, 1, 10, 11}.',
        },
        {
          id: 'q6_2',
          question: 'Hệ thống cho phép tải lên file đính kèm tối đa 10 MB. Theo 3-point BVA tại biên trên (10 MB), ta cần kiểm tra:',
          options: [
            '1 MB, 10 MB, 100 MB.',
            '9.99 MB, 10.00 MB, 10.01 MB.',
            '5 MB, 10 MB, 15 MB.',
            'Chỉ cần kiểm tra 10 MB.',
          ],
          correctIndex: 1,
          hint: '3-point BVA lấy: ngay trước biên, tại biên, và ngay sau biên.',
          explanation: '3-point BVA kiểm tra giá trị cận dưới biên (9.99 MB), chính xác tại biên (10.00 MB), và cận trên vượt biên (10.01 MB).',
        },
        {
          id: 'q6_3',
          question: 'Số lần nhập sai mã OTP tối đa là 5 lần. Ở lần thứ 5 sai thì tài khoản bị khóa 15 phút. Test case quan trọng nhất cần kiểm tra là:',
          options: [
            'Nhập sai 1 lần.',
            'Nhập sai 4 lần (chưa khóa) và nhập sai lần thứ 5 (bắt đầu khóa).',
            'Nhập đúng ngay lần đầu.',
            'Nhập sai 100 lần.',
          ],
          correctIndex: 1,
          hint: 'Kiểm tra điểm chuyển giao trạng thái khóa tài khoản.',
          explanation: 'Lần 4 (hợp lệ chưa khóa) và lần 5 (chuyển sang trạng thái khóa) là hai điểm biên phản ánh chính xác yêu cầu nghiệp vụ.',
        },
        {
          id: 'q6_4',
          question: 'Tại sao các lập trình viên thường mắc lỗi tại các giá trị biên nhiều hơn giá trị ở giữa phân vùng?',
          options: [
            'Do nhầm lẫn giữa toán tử so sánh (ví dụ: dùng `<` thay vì `<=`, hoặc `>` thay vì `>=`).',
            'Vì biên không được ghi trong tài liệu đặc tả.',
            'Vì máy tính không tính toán được số nguyên ở biên.',
            'Do database không hỗ trợ số lẻ.',
          ],
          correctIndex: 0,
          hint: 'Lỗi thường gặp: Off-by-one error (lệch 1 đơn vị).',
          explanation: 'Off-by-one error là lỗi phổ biến nhất trong lập trình do sai sót giữa so sánh ngặt `<` và so sánh có dấu bằng `<=`.',
        },
        {
          id: 'q6_5',
          question: 'Trường số lượng vé máy bay yêu cầu từ 1 đến 9 vé. Giá trị nào là test case âm bản (Negative Test) tại biên trên?',
          options: [
            '9.',
            '1.',
            '10.',
            '8.',
          ],
          correctIndex: 2,
          hint: 'Negative test tại biên trên phải vượt quá giá trị cho phép 1 đơn vị.',
          explanation: '10 vé vượt quá giới hạn tối đa 9 vé, là test case âm bản tại biên trên.',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-07',
    slug: 'quiz-v3-07-decision-table-discounts-payments',
    title: 'Quiz 07: Bảng Quyết Định (Decision Table) Cho Khuyến Mãi & Thanh Toán',
    sandboxType: 'quizlet',
    orderIndex: 7,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: 'Xây dựng Decision Table để bao phủ trọn vẹn các quy tắc nghiệp vụ kết hợp phức tạp.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q7_1',
          question: 'Quy tắc giảm giá: Khách hàng VIP được giảm 10%; nếu có Mã Voucher hợp lệ được giảm thêm 5%. Nếu có 2 điều kiện nhị phân (Đúng/Sai), bảng quyết định có tối đa bao nhiêu quy tắc (Rules)?',
          options: [
            '2 quy tắc.',
            '4 quy tắc (2 mũ 2 = 4 tổ hợp).',
            '8 quy tắc.',
            '16 quy tắc.',
          ],
          correctIndex: 1,
          hint: 'Công thức: 2^n với n là số điều kiện nhị phân.',
          explanation: 'Với 2 điều kiện boolean (VIP: Y/N, Voucher: Y/N), số lượng cột rules tối đa là 2^2 = 4.',
        },
        {
          id: 'q7_2',
          question: 'Trong Decision Table, hàng chứa "Thành viên VIP" và "Voucher hợp lệ" được gọi là gì?',
          options: [
            'Conditions (Điều kiện).',
            'Actions (Hành động).',
            'Test logs.',
            'Boundary points.',
          ],
          correctIndex: 0,
          hint: 'Phần đầu vào quyết định kết quả hành động của bảng.',
          explanation: 'Decision Table gồm 2 phần chính: Conditions (các điều kiện đầu vào) và Actions (hành động tương ứng).',
        },
        {
          id: 'q7_3',
          question: 'Quy tắc thanh toán: "Nếu đơn hàng > 1 triệu VÀ thanh toán bằng thẻ tín dụng VÀ là lần đầu mua ➔ Tặng voucher 100k". Khi nào thì hành động "Tặng voucher 100k" KHÔNG xảy ra?',
          options: [
            'Đơn hàng 1.2 triệu, thanh toán thẻ tín dụng, mua lần đầu.',
            'Đơn hàng 1.5 triệu, thanh toán thẻ tín dụng, nhưng là khách hàng cũ (không phải lần đầu).',
            'Khi hệ thống bị lỗi database.',
            'Cả A và B.',
          ],
          correctIndex: 1,
          hint: 'Toán tử logic VÀ (AND) yêu cầu cả 3 điều kiện phải đồng thời đúng.',
          explanation: 'Vì dùng liên từ VÀ, chỉ cần 1 điều kiện sai (khách cũ) thì hành động tặng voucher sẽ không được kích hoạt.',
        },
        {
          id: 'q7_4',
          question: 'Kỹ thuật Decision Table Testing hiệu quả nhất khi áp dụng cho loại bài toán nào?',
          options: [
            'Kiểm thử giao diện responsive trên điện thoại.',
            'Logic nghiệp vụ phức tạp với nhiều tổ hợp điều kiện điều khiển nhiều hành động khác nhau.',
            'Đo tốc độ phản hồi của mạng Wi-Fi.',
            'Kiểm tra định dạng font chữ của văn bản.',
          ],
          correctIndex: 1,
          hint: 'Phù hợp với các hệ thống tính cước, tính bảo hiểm, xét duyệt tín dụng.',
          explanation: 'Decision Table là công cụ mạnh mẽ nhất để tránh bỏ sót các tổ hợp điều kiện nghiệp vụ phức tạp.',
        },
        {
          id: 'q7_5',
          question: 'Khi rút gọn Decision Table (Collapsing Rules), ta có thể gộp hai cột lại nếu:',
          options: [
            'Một điều kiện thay đổi từ Đúng sang Sai nhưng Hành động đầu ra (Action) hoàn toàn không thay đổi.',
            'Product Owner yêu cầu giảm test case để kịp tiến độ.',
            'Tester không hiểu điều kiện đó.',
            'Hai cột có cùng ngày tạo.',
          ],
          correctIndex: 0,
          hint: 'Điều kiện độc lập không ảnh hưởng đến kết quả đầu ra (Don\'t care condition).',
          explanation: 'Nếu một điều kiện dù True hay False vẫn cho cùng 1 kết quả Action thì có thể gộp thành ký hiệu "-" (Don\'t Care).',
        },
      ],
    },
  },

  {
    id: 'lab-quiz-v3-08',
    slug: 'quiz-v3-08-state-transition-rbac-http-codes',
    title: 'Quiz 08: State Transition, Authentication Lockout & HTTP Status Codes',
    sandboxType: 'quizlet',
    orderIndex: 8,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: 'Kiểm thử chuyển đổi trạng thái đơn hàng, chính sách khóa tài khoản OWASP và phân biệt chuẩn xác các mã trạng thái HTTP RESTful API.',
    config: {
      version: '1.0',
      passPercentage: 80,
      allowReviewBeforeSubmit: true,
      questions: [
        {
          id: 'q8_1',
          question: 'Trạng thái đơn hàng: [New] ➔ [Paid] ➔ [Shipped] ➔ [Delivered]. Chuyển đổi nào sau đây là BẤT HỢP LỆ (Invalid Transition)?',
          options: [
            '[New] ➔ [Paid].',
            '[Paid] ➔ [Shipped].',
            '[Delivered] ➔ [New].',
            '[New] ➔ [Cancelled].',
          ],
          correctIndex: 2,
          hint: 'Đơn hàng đã giao thành công không thể đột ngột quay về trạng thái Mới tạo.',
          explanation: 'Đơn đã giao thành công (Delivered) không thể đảo ngược trạng thái về New. Việc kiểm thử các bước chuyển bất hợp lệ (Negative State Transition) là bắt buộc.',
        },
        {
          id: 'q8_2',
          question: 'Một request gọi API nhưng KHÔNG đính kèm Authorization Header (chưa đăng nhập). Máy chủ backend RESTful chuẩn mực phải phản hồi mã HTTP nào?',
          options: [
            '200 OK.',
            '401 Unauthorized (Chưa xác thực danh tính).',
            '403 Forbidden (Đã biết danh tính nhưng không đủ quyền hạn).',
            '404 Not Found.',
          ],
          correctIndex: 1,
          hint: 'Phân biệt giữa Unauthenticated (401) và Unauthorized/Forbidden (403).',
          explanation: 'Theo chuẩn RFC 9110, 401 Unauthorized nghĩa là thiếu hoặc sai thông tin xác thực. 403 Forbidden dành cho trường hợp đã xác thực nhưng bị cấm truy cập.',
        },
        {
          id: 'q8_3',
          question: 'Học viên có tài khoản đã đăng nhập hợp lệ (role: "student") cố tình gọi API xóa bài viết của Giảng viên (`DELETE /api/v1/courses/101`). Server phải trả về mã:',
          options: [
            '401 Unauthorized.',
            '403 Forbidden.',
            '500 Internal Server Error.',
            '204 No Content.',
          ],
          correctIndex: 1,
          hint: 'Danh tính đã được xác minh qua JWT nhưng quyền hạn không đủ.',
          explanation: 'Hệ thống đã nhận diện được user qua token, nhưng Role "student" không có quyền xóa khóa học của người khác ➔ 403 Forbidden.',
        },
        {
          id: 'q8_4',
          question: 'Theo chuẩn bảo mật OWASP WSTG, sau khi người dùng nhập sai mật khẩu 5 lần liên tiếp, hệ thống nên phản hồi như thế nào?',
          options: [
            'Hiển thị thông báo chi tiết: "Email này có trong hệ thống nhưng sai mật khẩu".',
            'Tạm khóa tài khoản hoặc áp dụng CAPTCHA/Rate Limiting (HTTP 429), kèm thông báo chung chung không làm lộ sự tồn tại của email.',
            'Xóa vĩnh viễn tài khoản khỏi cơ sở dữ liệu.',
            'Tự động gửi mật khẩu dạng văn bản gốc về email.',
          ],
          correctIndex: 1,
          hint: 'Tránh lỗi User Enumeration (dò quét tài khoản người dùng).',
          explanation: 'OWASP khuyến cáo thông báo không được tiết lộ email có tồn tại hay không, và áp dụng cơ chế khóa tạm thời / Rate limiting để chống Brute-Force.',
        },
        {
          id: 'q8_5',
          question: 'Khi client gửi payload JSON thiếu trường bắt buộc hoặc sai định dạng dữ liệu (ví dụ: tuổi là chữ thay vì số), mã HTTP nào phù hợp nhất?',
          options: [
            '502 Bad Gateway.',
            '400 Bad Request hoặc 422 Unprocessable Entity.',
            '401 Unauthorized.',
            '500 Internal Server Error.',
          ],
          correctIndex: 1,
          hint: 'Lỗi phát sinh do client gửi dữ liệu không hợp lệ, không phải lỗi máy chủ crash.',
          explanation: '400 Bad Request hoặc 422 Unprocessable Entity là mã chuẩn cho các lỗi validation dữ liệu đầu vào phía client.',
        },
      ],
    },
  },
];


// ============================================================================
// 3. Series 3: Playwright Automation Low-Code Masterclass (8 Labs)
// ============================================================================

export const V3_AUTO_SERIES = {
  id: 'series-auto-v3-playwright',
  slug: 'playwright-low-code-automation',
  title: 'Playwright Automation: Từ Low-Code Đến Test Script Chuyên Nghiệp',
  category: 'testing',
  level: 'intermediate',
  coverEmoji: '🎭',
  orderIndex: 3,
  isProOnly: false,
  description:
    'Lộ trình 8 bài thực hành Automation Test với Playwright trên nền tảng Client Scenario Runner. Tiếp cận từ giao diện Block Builder kéo thả, nâng cấp lên Smart Cloze điền chỗ trống, và hoàn thiện kỹ năng viết Full Code với ma trận dữ liệu phân quyền và thanh toán.',
};

export const V3_AUTO_LABS = [
  {
    id: 'lab-auto-v3-01',
    slug: 'auto-v3-01-test-structure-goto',
    title: 'Bài 1: Cấu Trúc Test & Điều Hướng (page.goto)',
    sandboxType: 'js_worker',
    orderIndex: 1,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: `### Mục Tiêu Bài Học
Làm quen với cấu trúc kịch bản kiểm thử Playwright: Arrange – Act – Assert và câu lệnh điều hướng \`page.goto()\`.

### Nhiệm Vụ
1. Sử dụng khối **Navigate to Route** (\`nav_goto\`) để điều hướng đến route \`'/orders'\`.
2. Sử dụng khối **Expect To Be Visible** (\`assert_visible\`) để xác nhận bảng danh sách đơn hàng (\`table\`) xuất hiện trên màn hình.
3. Nhấn **Run Scenario** để kiểm chứng trên Client Scenario Runner và quan sát mã Playwright tự động sinh ra.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('Order Management Inquiry', () => {\n  test('navigate to orders inquiry and verify header visibility', async ({ page }) => {\n    await page.goto('/orders');\n    await expect(page.getByRole('table')).toBeVisible();\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'block_builder',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'Order Management Inquiry',
      fixture: {
        fixtureId: 'order-investigation-app',
        fixtureVersion: '1.0.0',
        initialRoute: '/orders',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route (page.goto)',
          description: 'Navigates to route within fixture app',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true, defaultValue: '/orders' }],
        },
        {
          blockType: 'assert_visible',
          category: 'assertion',
          name: 'Expect To Be Visible (toBeVisible)',
          description: 'Web-first assertion checking visibility',
          codePattern: 'await expect({locator}).toBeVisible();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true, defaultValue: "page.getByRole('table')" }],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
        { id: 's2', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('table')" } },
      ],
      publicChecks: [
        { id: 'chk_goto', name: 'Navigate to Orders Route', ruleType: 'block_exists', targetBlockType: 'nav_goto' },
        { id: 'chk_assert', name: 'Table Visibility Assertion', ruleType: 'assertion_match', targetBlockType: 'assert_visible' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-02',
    slug: 'auto-v3-02-resilient-locators',
    title: 'Bài 2: Chọn Locator Bền Vững: getByRole & getByLabel',
    sandboxType: 'js_worker',
    orderIndex: 2,
    durationMinutes: 15,
    isFreePreview: true,
    isProOnly: false,
    instructions: `### Mục Tiêu Bài Học
Học cách sử dụng các bộ định vị bền vững (Resilient Locators) của Playwright theo chuẩn ARIA trợ năng thay vì các CSS/XPath selector dễ vỡ.

### Nhiệm Vụ
1. Điều hướng đến \`'/orders'\`.
2. Dùng khối **Click** để nhấn vào nút lọc đơn hàng thất bại với locator \`page.getByRole('button', { name: 'Filter Failed' })\`.
3. Dùng khối **Expect To Be Visible** để kiểm tra bảng chi tiết đơn hàng \`page.getByRole('region', { name: 'Order Details' })\` hiển thị.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('Resilient Locators Strategy', () => {\n  test('filter failed orders using accessible role locator', async ({ page }) => {\n    await page.goto('/orders');\n    await page.getByRole('button', { name: 'Filter Failed' }).click();\n    await expect(page.getByRole('region', { name: 'Order Details' })).toBeVisible();\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'block_builder',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'Resilient Locators Strategy',
      fixture: {
        fixtureId: 'order-investigation-app',
        fixtureVersion: '1.0.0',
        initialRoute: '/orders',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route (page.goto)',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true, defaultValue: '/orders' }],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click (click)',
          description: 'Clicks the target locator',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true, defaultValue: "page.getByRole('button', { name: 'Filter Failed' })" }],
        },
        {
          blockType: 'assert_visible',
          category: 'assertion',
          name: 'Expect To Be Visible (toBeVisible)',
          description: 'Verifies element is visible',
          codePattern: 'await expect({locator}).toBeVisible();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true, defaultValue: "page.getByRole('region', { name: 'Order Details' })" }],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
        { id: 's2', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Filter Failed' })" } },
        { id: 's3', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('region', { name: 'Order Details' })" } },
      ],
      publicChecks: [
        { id: 'chk_click', name: 'Filter Failed Click', ruleType: 'block_exists', targetBlockType: 'act_click' },
        { id: 'chk_visible', name: 'Order Details Visible', ruleType: 'assertion_match', targetBlockType: 'assert_visible' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-03',
    slug: 'auto-v3-03-form-interactions',
    title: 'Bài 3: Tương Tác Form: fill, click, check & selectOption',
    sandboxType: 'js_worker',
    orderIndex: 3,
    durationMinutes: 20,
    isFreePreview: true,
    isProOnly: false,
    instructions: `### Mục Tiêu Bài Học
Thực hành các thao tác tương tác form: điền chuỗi (\`fill\`), click chuột (\`click\`), đánh dấu checkbox (\`check\`), và chọn dropdown (\`selectOption\`).

### Nhiệm Vụ
1. Điều hướng đến trang đăng nhập \`'/login'\`.
2. Điền email \`qa.learner@studyweb.dev\` vào ô có nhãn \`Email Address\`.
3. Điền mật khẩu \`SecurePass123!\` vào ô có nhãn \`Password\`.
4. Đánh dấu checkbox \`Remember me\`.
5. Nhấn nút \`Sign In\` và xác nhận trang chuyển hướng đến \`'/dashboard/user'\`.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('Form Interactions', () => {\n  test('fill credentials, check remember me and submit login', async ({ page }) => {\n    await page.goto('/login');\n    await page.getByLabel('Email Address').fill('qa.learner@studyweb.dev');\n    await page.getByLabel('Password').fill('SecurePass123!');\n    await page.getByLabel('Remember me').check();\n    await page.getByRole('button', { name: 'Sign In' }).click();\n    await expect(page).toHaveURL('/dashboard/user');\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'block_builder',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'Form Interactions',
      fixture: {
        fixtureId: 'auth-login-portal',
        fixtureVersion: '1.0.0',
        initialRoute: '/login',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route (page.goto)',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true, defaultValue: '/login' }],
        },
        {
          blockType: 'act_fill',
          category: 'action',
          name: 'Fill Input (fill)',
          description: 'Fills input field',
          codePattern: "await {locator}.fill('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Input Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Text Value', type: 'string', required: true },
          ],
        },
        {
          blockType: 'act_check',
          category: 'action',
          name: 'Check Checkbox (check)',
          description: 'Checks checkbox element',
          codePattern: 'await {locator}.check();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Checkbox Locator', type: 'string', required: true }],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click (click)',
          description: 'Clicks element',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Button Locator', type: 'string', required: true }],
        },
        {
          blockType: 'assert_url',
          category: 'assertion',
          name: 'Expect To Have URL (toHaveURL)',
          description: 'Verifies current page URL',
          codePattern: "await expect(page).toHaveURL('{url}');",
          parameters: [{ id: 'url', name: 'url', label: 'Expected URL', type: 'string', required: true }],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
        { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'qa.learner@studyweb.dev' } },
        { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'SecurePass123!' } },
        { id: 's4', blockType: 'act_check', category: 'action', params: { locator: "page.getByLabel('Remember me')" } },
        { id: 's5', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
        { id: 's6', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/user' } },
      ],
      publicChecks: [
        { id: 'chk_fill', name: 'Credentials Filled', ruleType: 'block_exists', targetBlockType: 'act_fill' },
        { id: 'chk_check', name: 'Remember Me Checked', ruleType: 'block_exists', targetBlockType: 'act_check' },
        { id: 'chk_url', name: 'User Dashboard URL', ruleType: 'assertion_match', targetBlockType: 'assert_url' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-04',
    slug: 'auto-v3-04-web-first-assertions',
    title: 'Bài 4: Web-First Assertions Tự Động Chờ (toBeVisible & toHaveText)',
    sandboxType: 'js_worker',
    orderIndex: 4,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### Mục Tiêu Bài Học
Tìm hiểu cơ chế tự động chờ (Auto-retrying) của Playwright Web-First Assertions: \`toBeVisible()\` và \`toHaveText()\`.

### Nhiệm Vụ
Kích hoạt hành động thử lại thanh toán ("Retry Payment") và xác minh trạng thái đơn hàng cập nhật thành \`'Processing'\`.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('Web-First Assertions', () => {\n  test('verify payment retry status changes dynamically', async ({ page }) => {\n    await page.goto('/orders');\n    await page.getByRole('button', { name: 'Filter Failed' }).click();\n    await page.getByRole('button', { name: 'Retry Payment' }).click();\n    await expect(page.getByRole('status')).toHaveText('Processing');\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'smart_cloze',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'Web-First Assertions',
      fixture: {
        fixtureId: 'order-investigation-app',
        fixtureVersion: '1.0.0',
        initialRoute: '/orders',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true }],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click',
          description: 'Clicks element',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
        {
          blockType: 'assert_text',
          category: 'assertion',
          name: 'Expect To Have Text (toHaveText)',
          description: 'Verifies text content with auto-retry',
          codePattern: "await expect({locator}).toHaveText('{expected}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'expected', name: 'expected', label: 'Expected Text', type: 'string', required: true },
          ],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' }, isLocked: true },
        { id: 's2', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Filter Failed' })" }, isLocked: true },
        { id: 's3', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Retry Payment' })" } },
        { id: 's4', blockType: 'assert_text', category: 'assertion', params: { locator: "page.getByRole('status')", expected: 'Processing' } },
      ],
      publicChecks: [
        { id: 'chk_retry_click', name: 'Retry Payment Triggered', ruleType: 'block_exists', targetBlockType: 'act_click' },
        { id: 'chk_status_text', name: 'Processing Status Match', ruleType: 'assertion_match', targetBlockType: 'assert_text' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-05',
    slug: 'auto-v3-05-login-positive-negative',
    title: 'Bài 5: Luồng Đăng Nhập Positive & Negative',
    sandboxType: 'js_worker',
    orderIndex: 5,
    durationMinutes: 20,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### Mục Tiêu Bài Học
Xây dựng kịch bản kiểm thử luồng đăng nhập hợp lệ (Positive) và kiểm tra chuyển hướng chính xác vào User Dashboard.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('Authentication Flows', () => {\n  test('successful login redirects to learner dashboard', async ({ page }) => {\n    await page.goto('/login');\n    await page.getByLabel('Email Address').fill('student@studyweb.dev');\n    await page.getByLabel('Password').fill('ValidPassword123!');\n    await page.getByRole('button', { name: 'Sign In' }).click();\n    await expect(page).toHaveURL('/dashboard/user');\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'smart_cloze',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'Authentication Flows',
      fixture: {
        fixtureId: 'auth-login-portal',
        fixtureVersion: '1.0.0',
        initialRoute: '/login',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true }],
        },
        {
          blockType: 'act_fill',
          category: 'action',
          name: 'Fill Input',
          description: 'Fills input field',
          codePattern: "await {locator}.fill('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Value', type: 'string', required: true },
          ],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click',
          description: 'Clicks element',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
        {
          blockType: 'assert_url',
          category: 'assertion',
          name: 'Expect To Have URL',
          description: 'Verifies page URL',
          codePattern: "await expect(page).toHaveURL('{url}');",
          parameters: [{ id: 'url', name: 'url', label: 'URL', type: 'string', required: true }],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' }, isLocked: true },
        { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'student@studyweb.dev' } },
        { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'ValidPassword123!' } },
        { id: 's4', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
        { id: 's5', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/user' } },
      ],
      publicChecks: [
        { id: 'chk_sub', name: 'Submit Login', ruleType: 'block_exists', targetBlockType: 'act_click' },
        { id: 'chk_dest', name: 'Dashboard URL Matched', ruleType: 'assertion_match', targetBlockType: 'assert_url' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-06',
    slug: 'auto-v3-06-parameterized-boundary-matrix',
    title: 'Bài 6: Parameterized Testing với Ma Trận Dữ Liệu',
    sandboxType: 'js_worker',
    orderIndex: 6,
    durationMinutes: 25,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### Mục Tiêu Bài Học
Viết kịch bản kiểm thử dựa trên dữ liệu (Data-Driven Testing) với vòng lặp tham số hóa (Parameterized Tests), kiểm tra từng vai trò người dùng được chuyển hướng đến đúng đường dẫn dashboard tương ứng.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\nconst testMatrix = [\n  { role: 'standard', expectedRoute: '/dashboard/user' },\n  { role: 'admin', expectedRoute: '/dashboard/admin' },\n];\n\ntestMatrix.forEach(({ role, expectedRoute }) => {\n  test(\`verify role [\${role}] routes to [\${expectedRoute}]\`, async ({ page }) => {\n    await page.goto('/login');\n    await page.getByLabel('Email Address').fill(\`\${role}@studyweb.dev\`);\n    await page.getByLabel('Password').fill('Password123!');\n    await page.getByLabel('Select Role').selectOption(role);\n    await page.getByRole('button', { name: 'Sign In' }).click();\n    await expect(page).toHaveURL(expectedRoute);\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'smart_cloze',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'Parameterized Boundary Testing',
      fixture: {
        fixtureId: 'auth-login-portal',
        fixtureVersion: '1.0.0',
        initialRoute: '/login',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true }],
        },
        {
          blockType: 'act_fill',
          category: 'action',
          name: 'Fill Input',
          description: 'Fills input',
          codePattern: "await {locator}.fill('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Value', type: 'string', required: true },
          ],
        },
        {
          blockType: 'act_select_option',
          category: 'action',
          name: 'Select Option',
          description: 'Selects option from dropdown',
          codePattern: "await {locator}.selectOption('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Option', type: 'string', required: true },
          ],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click',
          description: 'Clicks element',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
        {
          blockType: 'assert_url',
          category: 'assertion',
          name: 'Expect To Have URL',
          description: 'Verifies page URL',
          codePattern: "await expect(page).toHaveURL('{url}');",
          parameters: [{ id: 'url', name: 'url', label: 'URL', type: 'string', required: true }],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' }, isLocked: true },
        { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'admin@studyweb.dev' } },
        { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'Password123!' } },
        { id: 's4', blockType: 'act_select_option', category: 'action', params: { locator: "page.getByLabel('Select Role')", value: 'admin' } },
        { id: 's5', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
        { id: 's6', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/admin' } },
      ],
      publicChecks: [
        { id: 'chk_select', name: 'Select Role Option', ruleType: 'block_exists', targetBlockType: 'act_select_option' },
        { id: 'chk_admin_url', name: 'Admin Dashboard Redirect', ruleType: 'assertion_match', targetBlockType: 'assert_url' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-07',
    slug: 'auto-v3-07-rbac-navigation-matrix',
    title: 'Bài 7: Phân Quyền RBAC: Standard, Subscriber & Admin',
    sandboxType: 'js_worker',
    orderIndex: 7,
    durationMinutes: 25,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### Mục Tiêu Bài Học
Kiểm thử ma trận phân quyền người dùng (Role-Based Access Control). Đăng nhập với quyền Quản trị viên và xác minh khu vực điều khiển hệ thống hiển thị đầy đủ.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('RBAC Access Control Matrix', () => {\n  test('administrator logs in and verifies system status in admin center', async ({ page }) => {\n    await page.goto('/login');\n    await page.getByLabel('Email Address').fill('admin@studyweb.dev');\n    await page.getByLabel('Password').fill('AdminPass123!');\n    await page.getByLabel('Select Role').selectOption('admin');\n    await page.getByRole('button', { name: 'Sign In' }).click();\n    await expect(page).toHaveURL('/dashboard/admin');\n    await expect(page.getByRole('region', { name: 'Admin Tools' })).toBeVisible();\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'guided_code',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'RBAC Access Control Matrix',
      fixture: {
        fixtureId: 'auth-login-portal',
        fixtureVersion: '1.0.0',
        initialRoute: '/login',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true }],
        },
        {
          blockType: 'act_fill',
          category: 'action',
          name: 'Fill Input',
          description: 'Fills input',
          codePattern: "await {locator}.fill('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Value', type: 'string', required: true },
          ],
        },
        {
          blockType: 'act_select_option',
          category: 'action',
          name: 'Select Option',
          description: 'Selects option',
          codePattern: "await {locator}.selectOption('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Value', type: 'string', required: true },
          ],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click',
          description: 'Clicks element',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
        {
          blockType: 'assert_url',
          category: 'assertion',
          name: 'Expect To Have URL',
          description: 'Verifies page URL',
          codePattern: "await expect(page).toHaveURL('{url}');",
          parameters: [{ id: 'url', name: 'url', label: 'URL', type: 'string', required: true }],
        },
        {
          blockType: 'assert_visible',
          category: 'assertion',
          name: 'Expect To Be Visible',
          description: 'Verifies element is visible',
          codePattern: 'await expect({locator}).toBeVisible();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
        { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'admin@studyweb.dev' } },
        { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'AdminPass123!' } },
        { id: 's4', blockType: 'act_select_option', category: 'action', params: { locator: "page.getByLabel('Select Role')", value: 'admin' } },
        { id: 's5', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
        { id: 's6', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/admin' } },
        { id: 's7', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('region', { name: 'Admin Tools' })" } },
      ],
      publicChecks: [
        { id: 'chk_admin_role', name: 'Admin Role Option Selected', ruleType: 'block_exists', targetBlockType: 'act_select_option' },
        { id: 'chk_admin_view', name: 'Admin Tools Visible', ruleType: 'assertion_match', targetBlockType: 'assert_visible' },
      ],
    },
  },

  {
    id: 'lab-auto-v3-08',
    slug: 'auto-v3-08-capstone-checkout-flow',
    title: 'Bài 8: Capstone Luồng Đặt Hàng Thương Mại Điện Tử (E-Commerce E2E)',
    sandboxType: 'js_worker',
    orderIndex: 8,
    durationMinutes: 30,
    isFreePreview: false,
    isProOnly: true,
    instructions: `### Mục Tiêu Bài Học
Capstone tốt nghiệp phần Automation: Viết kịch bản kiểm thử luồng mua sắm hoàn chỉnh (End-to-End):
1. Thêm bàn phím cơ vào giỏ hàng từ trang danh mục \`'/shop'\`.
2. Kiểm tra số lượng giỏ hàng hiển thị đúng \`'1 items'\`.
3. Điều hướng đến trang thanh toán \`'/checkout'\`.
4. Điền họ tên người nhận và địa chỉ giao hàng.
5. Nhấn nút "Place Order Now" và xác minh thông báo đơn hàng thành công hiển thị.`,
    initialSnippet: '',
    solution: `import { test, expect } from '@playwright/test';\n\ntest.describe('E-Commerce End-to-End Checkout Flow', () => {\n  test('add product to cart, fill shipping info, and confirm order', async ({ page }) => {\n    await page.goto('/shop');\n    await page.getByRole('button', { name: 'Add Mechanical Keyboard to Cart' }).click();\n    await expect(page.getByRole('status', { name: 'Cart items count' })).toHaveText('1 items');\n    await page.goto('/checkout');\n    await expect(page.getByText('$90.00')).toBeVisible();\n    await page.getByLabel('Recipient Name').fill('Nguyen Khanh Duy');\n    await page.getByLabel('Shipping Address').fill('123 Vo Van Ngan, Thu Duc, TP.HCM');\n    await page.getByRole('button', { name: 'Place Order Now' }).click();\n    await expect(page.getByRole('status')).toBeVisible();\n    await expect(page.getByRole('status')).toHaveText(/Order Placed Successfully/i);\n  });\n});`,
    config: {
      version: '3.0',
      framework: 'playwright',
      interactionMode: 'full_code',
      contentRevision: 'rev-2026-10-v3',
      exportTemplate: 'typescript',
      title: 'E-Commerce End-to-End Checkout Flow',
      fixture: {
        fixtureId: 'ecommerce-checkout-app',
        fixtureVersion: '1.0.0',
        initialRoute: '/shop',
      },
      allowedBlocks: [
        {
          blockType: 'nav_goto',
          category: 'navigation',
          name: 'Navigate to Route',
          description: 'Navigates to route',
          codePattern: "await page.goto('{route}');",
          parameters: [{ id: 'route', name: 'route', label: 'Route', type: 'string', required: true }],
        },
        {
          blockType: 'act_click',
          category: 'action',
          name: 'Click',
          description: 'Clicks element',
          codePattern: 'await {locator}.click();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
        {
          blockType: 'act_fill',
          category: 'action',
          name: 'Fill Input',
          description: 'Fills input',
          codePattern: "await {locator}.fill('{value}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'value', name: 'value', label: 'Value', type: 'string', required: true },
          ],
        },
        {
          blockType: 'assert_visible',
          category: 'assertion',
          name: 'Expect To Be Visible',
          description: 'Verifies element is visible',
          codePattern: 'await expect({locator}).toBeVisible();',
          parameters: [{ id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true }],
        },
        {
          blockType: 'assert_text',
          category: 'assertion',
          name: 'Expect To Have Text',
          description: 'Verifies element text',
          codePattern: "await expect({locator}).toHaveText('{expected}');",
          parameters: [
            { id: 'locator', name: 'locator', label: 'Locator', type: 'string', required: true },
            { id: 'expected', name: 'expected', label: 'Expected Text', type: 'string', required: true },
          ],
        },
      ],
      starterPlan: [
        { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/shop' } },
        { id: 's2', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Add Mechanical Keyboard to Cart' })" } },
        { id: 's3', blockType: 'assert_text', category: 'assertion', params: { locator: "page.getByRole('status', { name: 'Cart items count' })", expected: '1 items' } },
        { id: 's4', blockType: 'nav_goto', category: 'navigation', params: { route: '/checkout' } },
        { id: 's5', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Recipient Name')", value: 'Nguyen Khanh Duy' } },
        { id: 's6', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Shipping Address')", value: '123 Vo Van Ngan, Thu Duc, TP.HCM' } },
        { id: 's7', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Place Order Now' })" } },
        { id: 's8', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('status')" } },
      ],
      publicChecks: [
        { id: 'chk_add_cart', name: 'Item Added to Cart', ruleType: 'block_exists', targetBlockType: 'act_click' },
        { id: 'chk_checkout_fill', name: 'Shipping Form Filled', ruleType: 'block_exists', targetBlockType: 'act_fill' },
        { id: 'chk_order_confirm', name: 'Order Success Confirmed', ruleType: 'assertion_match', targetBlockType: 'assert_visible' },
      ],
    },
  },
];
