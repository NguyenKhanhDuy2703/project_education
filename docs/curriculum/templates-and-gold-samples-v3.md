# Quy Chuẩn Soạn Thảo & Mẫu Vàng (Standard Templates & Gold Samples V3)

> **Mã tài liệu**: `DOC-CURRICULUM-06`
> **Phiên bản**: 3.0
> **Ngày cập nhật**: 2026-10-22
> **Áp dụng cho**: 24 bài thực hành MVP (SQL Sandbox, Scenario-Based Quiz, Automation Playwright Low-Code V3).
> **Ngôn ngữ**: Đề bài, giải thích, gợi ý bằng **tiếng Việt**; code, API, schema, selector bằng **tiếng Anh**.

---

## 1. Mẫu Chuẩn Cho Bài Học SQL Tình Huống (PostgreSQL Template)

Mỗi bài học SQL bắt buộc có đầy đủ 7 thành phần cấu trúc sau:

```markdown
# [Tên Bài Học]: [Tình huống nghiệp vụ ngắn gọn]

### 1. Bối Cảnh Nghiệp Vụ (Problem Statement)
Mô tả rõ bài toán thực tế mà một Manual QA / Data Analyst gặp phải trong ca làm việc.
Ví dụ: "Hệ thống thanh toán ghi nhận 15 giao dịch lỗi trong đợt sale 11/11. QA cần xuất báo cáo..."

### 2. Sơ Đồ Quan Hệ & Cấu Trúc Bảng (Schema Diagram)
\`\`\`
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│ orders                          │       │ customers                       │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK, INT)                    │  N:1  │ id (PK, INT)                    │
│ customer_id (FK, INT) >─────────┼───────┤ name (VARCHAR)                  │
│ total_amount (NUMERIC)          │       │ city (VARCHAR)                  │
│ status (VARCHAR)                │       │ email (VARCHAR)                 │
│ created_at (TIMESTAMPTZ)        │       │ lifetime_spend (NUMERIC)        │
└─────────────────────────────────┘       └─────────────────────────────────┘
\`\`\`

### 3. Dữ Liệu Khởi Tạo Khép Kín (8–20 Seed Rows)
:::schema
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  lifetime_spend NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
:::

:::seed
INSERT INTO customers (id, name, city, email, lifetime_spend) VALUES
  (1, 'Nguyễn Văn An', 'Hà Nội', 'an.nguyen@example.com', 4500000),
  (2, 'Trần Thị Bình', 'TP. Hồ Chí Minh', 'binh.tran@example.com', 1200000),
  (3, 'Lê Hoàng Cường', 'Đà Nẵng', 'cuong.le@example.com', 890000),
  (4, 'Phạm Minh Đức', 'Hà Nội', 'duc.pham@example.com', 6500000),
  (5, 'Vũ Hải Yến', 'Cần Thơ', 'yen.vu@example.com', 210000);

INSERT INTO orders (id, customer_id, total_amount, status, created_at) VALUES
  (101, 1, 1500000, 'failed', '2026-10-20 08:30:00+07'),
  (102, 1, 3000000, 'completed', '2026-10-20 09:15:00+07'),
  (103, 2, 1200000, 'failed', '2026-10-21 14:00:00+07'),
  (104, 3, 890000, 'completed', '2026-10-21 16:45:00+07'),
  (105, 4, 2500000, 'failed', '2026-10-22 10:10:00+07');
:::

### 4. Nhiệm Vụ Truy Vấn & Kết Quả Chấm Điểm (Evaluated Query & Expected)
Viết một câu truy vấn duy nhất lấy các cột: `id`, `customer_id`, `total_amount`, `created_at`
từ bảng `orders`, chỉ lấy các đơn có `status = 'failed'`, sắp xếp giảm dần theo `created_at`.

:::expected
[
  { "id": 105, "customer_id": 4, "total_amount": 2500000, "created_at": "2026-10-22T03:10:00.000Z" },
  { "id": 103, "customer_id": 2, "total_amount": 1200000, "created_at": "2026-10-21T07:00:00.000Z" },
  { "id": 101, "customer_id": 1, "total_amount": 1500000, "created_at": "2026-10-20T01:30:00.000Z" }
]
:::

:::solution sql
SELECT id, customer_id, total_amount, created_at
FROM orders
WHERE status = 'failed'
ORDER BY created_at DESC;
:::

### 5. Cạm Bẫy Phổ Biến (Common Pitfalls)
- Quên dấu nháy đơn `'failed'` hoặc dùng nháy kép `"failed"` (PostgreSQL sẽ coi nháy kép là định danh tên cột).
- Quên mệnh đề `DESC` khiến kết quả sắp xếp tăng dần từ cũ nhất đến mới nhất.
- Chọn `SELECT *` thay vì chọn đúng 4 cột được yêu cầu, dẫn tới sai lệch schema kết quả.

### 6. Gợi Ý Phân Tầng (Tiered Hints)
- **Tầng 1 (Khái niệm)**: Bạn cần lọc các dòng theo điều kiện giá trị cột bằng mệnh đề `WHERE` và đổi thứ tự bằng `ORDER BY`.
- **Tầng 2 (Cú pháp)**: Mệnh đề sắp xếp có dạng: `ORDER BY <tên_cột> DESC;`.
- **Tầng 3 (Khung mẫu)**: `SELECT id, customer_id, total_amount, created_at FROM orders WHERE status = '...' ORDER BY ... DESC;`.

### 7. Thử Thách Mở Rộng (Stretch Challenge)
Mở rộng truy vấn để lấy thêm cột `name` của khách hàng từ bảng `customers` bằng phép `INNER JOIN`!
```

---

## 2. Mẫu Chuẩn Cho Bài Trắc Nghiệm Tình Huống (Quiz Template)

Mỗi quiz gồm 5 câu hỏi tình huống thực tế. Đạt tối thiểu 4/5 câu (80%) mới tính là Passed.

```json
{
  "id": "quiz-tst-01-q1",
  "scenario": "Trong một đợt phát hành tính năng thanh toán định kỳ vào dịp cuối tuần, Quản lý Dự án yêu cầu bỏ qua toàn bộ vòng kiểm thử hồi quy (regression testing) vì 'toàn bộ các ca kiểm thử tính năng mới đều đã pass 100%'. Là một QA, bạn sẽ vận dụng nguyên lý kiểm thử nào của ISTQB để đưa ra ý kiến phản hồi chuyên môn?",
  "options": [
    "A. Nguyên lý 1: Kiểm thử chứng minh sự hiện diện của lỗi, không chứng minh phần mềm hết lỗi hoàn toàn.",
    "B. Nguyên lý 2: Kiểm thử kiệt quệ là bất khả thi, do đó việc bỏ qua kiểm thử hồi quy là hoàn toàn hợp lý.",
    "C. Nguyên lý 5: Nghịch lý thuốc trừ sâu (Pesticide Paradox) - Nếu các bài kiểm tra lặp đi lặp lại không tìm ra lỗi, có nghĩa là hệ thống không còn lỗi nào.",
    "D. Nguyên lý 7: Ảo tưởng về việc không có lỗi (Absence-of-errors fallacy) - Nếu phần mềm không có lỗi thì khách hàng chắc chắn hài lòng."
  ],
  "correctIndex": 0,
  "hint": "Hãy nhớ lại mục đích chính của việc kiểm thử: chúng ta chạy test để tìm lỗi tiềm ẩn và giảm thiểu rủi ro, chứ một bộ test pass không thể đảm bảo 100% hệ thống không bị ảnh hưởng phụ (side effects).",
  "explanation": {
    "correctReason": "Chính xác! Theo Nguyên lý 1 của ISTQB (Testing shows the presence of defects, not their absence), việc các test case tính năng mới đều pass chỉ chứng minh các chức năng đó thỏa mãn kịch bản đã viết, không chứng minh việc thay đổi mã nguồn không gây ra lỗi ở các module cũ. Cần tối thiểu một bộ smoke/sanity regression test.",
    "incorrectReasons": [
      "Phương án B sai vì mặc dù exhaustive testing là bất khả thi, kiểm thử hồi quy dựa trên phân tích rủi ro (risk-based testing) vẫn bắt buộc phải thực hiện khi sửa đổi code.",
      "Phương án C sai vì Pesticide Paradox cảnh báo việc cần cập nhật kịch bản kiểm thử mới để tìm lỗi mới, không phải lý do để ngừng test.",
      "Phương án D sai vì Absence-of-errors fallacy nói về việc phần mềm chạy đúng spec nhưng không đáp ứng đúng nhu cầu người dùng, không trực tiếp giải quyết rủi ro hồi quy."
    ]
  }
}
```

---

## 3. Mẫu Chuẩn Cho Bài Automation Low-Code V3 (Playwright V3 Contract)

Hợp đồng V3 mở rộng cho 4 tương tác: `block_builder`, `smart_cloze`, `guided_code`, `full_code`.

```json
{
  "version": "3.0",
  "framework": "playwright",
  "interactionMode": "block_builder",
  "contentRevision": "v3.0.1",
  "fixture": {
    "fixtureId": "fixture-login-screen-v1",
    "fixtureVersion": "1.0.0",
    "initialRoute": "/auth/login",
    "initialState": {
      "attempts": 0,
      "isLocked": false
    }
  },
  "allowedBlocks": [
    {
      "id": "nav-goto",
      "category": "navigation",
      "name": "goto",
      "label": "page.goto(route)",
      "description": "Điều hướng đến đường dẫn URL trong fixture",
      "params": [
        { "name": "url", "type": "string", "default": "/auth/login" }
      ]
    },
    {
      "id": "loc-role",
      "category": "locator",
      "name": "getByRole",
      "label": "page.getByRole(role, { name })",
      "description": "Tìm phần tử chuẩn semantic accessibility",
      "params": [
        { "name": "role", "type": "enum", "options": ["button", "textbox", "heading", "checkbox"] },
        { "name": "name", "type": "string" }
      ]
    },
    {
      "id": "act-fill",
      "category": "action",
      "name": "fill",
      "label": "locator.fill(value)",
      "description": "Nhập dữ liệu vào trường văn bản",
      "params": [
        { "name": "value", "type": "string" }
      ]
    },
    {
      "id": "act-click",
      "category": "action",
      "name": "click",
      "label": "locator.click()",
      "description": "Bấm chuột vào phần tử"
    },
    {
      "id": "assert-visible",
      "category": "assertion",
      "name": "toBeVisible",
      "label": "expect(locator).toBeVisible()",
      "description": "Khẳng định phần tử xuất hiện trên màn hình"
    }
  ],
  "starterPlan": [
    {
      "stepId": "s1",
      "type": "navigation",
      "action": "goto",
      "targetUrl": "/auth/login",
      "description": "Mở trang đăng nhập"
    }
  ],
  "publicChecks": [
    {
      "id": "chk-nav",
      "name": "Navigate to login route",
      "description": "Truy cập đúng /auth/login khi bắt đầu",
      "conceptTag": "navigation"
    },
    {
      "id": "chk-fill-credentials",
      "name": "Fill valid username and password",
      "description": "Nhập thông tin đăng nhập hợp lệ bằng getByRole hoặc getByLabel",
      "conceptTag": "actions"
    },
    {
      "id": "chk-submit",
      "name": "Submit login form",
      "description": "Click nút Submit/Login",
      "conceptTag": "actions"
    },
    {
      "id": "chk-assert-success",
      "name": "Verify successful login dashboard header",
      "description": "Assert header xuất hiện với text Welcome",
      "conceptTag": "assertions"
    }
  ],
  "exportTemplate": "typescript",
  "gradingKey": {
    "exerciseRevision": "v3.0.1",
    "requiredSteps": [
      { "type": "navigation", "action": "goto", "targetUrl": "/auth/login" },
      { "type": "action", "action": "fill", "target": "Email" },
      { "type": "action", "action": "fill", "target": "Password" },
      { "type": "action", "action": "click", "target": "Sign in" },
      { "type": "assertion", "matcher": "toBeVisible" }
    ],
    "minScore": 100
  }
}
```

Mã Playwright TypeScript sinh ra tương ứng (Gold Standard Sample):

```typescript
import { test, expect } from '@playwright/test';

test('[AUT-01] Verify user can submit credentials and access dashboard', async ({ page }) => {
  // Step 1: Navigate to login route
  await page.goto('/auth/login');

  // Step 2: Fill credentials
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('SecurePassword123!');

  // Step 3: Click submit button
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Step 4: Web-first assertion
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
```
