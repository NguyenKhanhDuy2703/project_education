# Tuyển Tập Nguồn Dữ Liệu & Hạt Giống Mẫu (Content Sources & Mini Datasets)
*(Kho dữ liệu tham khảo và mẫu SQL Sandbox / Quiz Bank / Automation Syntax cho study-web)*

> **Tài liệu**: `DOC-CURRICULUM-02`  
> **Phiên bản**: 1.0  
> **Trạng thái**: Chuẩn hóa (Approved)  
> **Tương thích**: `SPEC-LAB-MD-V1`, PGlite in-memory, Web Worker matchers

---

## 1. Nguồn Dữ Liệu Tham Khảo Uy Tín (Authoritative Source Catalog)

### A. SQL & Relational Databases
1. **PostgreSQL Official Documentation** (`https://www.postgresql.org/docs/current/`)
   - *Chuẩn tham chiếu*: Các kiểu dữ liệu Postgres (`SERIAL`, `NUMERIC`, `TEXT`, `TIMESTAMPTZ`, `JSONB`), toán tử so sánh chuỗi `ILIKE`, và các hàm Window Functions.
2. **Mode Analytics SQL School** (`https://mode.com/sql-tutorial/`)
   - *Chuẩn sư phạm*: Phương pháp chia nhỏ bài học truy vấn theo tình huống kinh doanh thực tế (Business Analytics).
3. **SQLZoo** (`https://sqlzoo.net/`)
   - *Chuẩn bài tập tương tác*: Cấu trúc bài tập điền câu lệnh với bảng mẫu rút gọn.
4. **LeetCode Database Practice** (`https://leetcode.com/problemset/database/`)
   - *Chuẩn phỏng vấn tuyển dụng*: Bài toán lọc khách hàng, xếp hạng lương nhân viên, tìm bản ghi trùng lặp.

### B. Testing Theory & Certification (Quizel)
1. **ISTQB Certified Tester Foundation Level (CTFL v4.0)** (`https://www.istqb.org/`)
   - *Syllabus 2023/2024*:
     - Chapter 1: Fundamentals of Testing (Why testing is necessary, 7 principles, Test process).
     - Chapter 2: Testing Throughout the SDLC (Test levels, Test types, Maintenance testing).
     - Chapter 3: Static Testing (Review process, Static analysis).
     - Chapter 4: Test Analysis and Design (Black-box: Equivalence Partitioning, BVA, Decision Table, State Transition).
     - Chapter 5: Managing the Test Activities (Test planning, Defect management, Risk management).
2. **Ministry of Testing & Software Testing Help**
   - Bộ tình huống thực tế về HTTP Status Codes (400, 401, 403, 404, 422, 500), API Contract testing và RBAC matrix.

### C. Automation Testing Syntax & Matchers
1. **Vitest & Jest Documentation** (`https://vitest.dev/api/expect.html`)
   - Cú pháp Test Suite: `describe(name, fn)`, `test(name, fn)`, `it(name, fn)`.
   - Cú pháp Matchers: `toBe(val)`, `toEqual(val)`, `toBeDefined()`, `toBeUndefined()`, `toBeNull()`, `toBeTruthy()`, `toBeFalsy()`, `toContain(item)`, `toHaveLength(n)`, `toThrow(err)`.
2. **Playwright & Cypress Documentation**
   - Cú pháp Locators: `page.getByRole()`, `page.getByText()`, `page.locator()`.
   - Cú pháp Web Assertions: `expect(locator).toBeVisible()`, `expect(locator).toHaveText()`.

---

## 2. Các Bộ Dữ Liệu Hạt Giống Mẫu cho In-Browser SQL (Mini Seed Datasets)

Mỗi dataset được thiết kế tinh gọn (< 20 dòng per table) để đảm bảo nạp trong Web Worker PGlite dưới 50ms mà vẫn đủ đa dạng để thực hành JOIN, GROUP BY, và Aggregate.

### Dataset 1: E-Commerce Store (`ecommerce_mini`)
```sql
-- :::schema
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  city VARCHAR(50) NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date DATE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL -- 'completed', 'pending', 'cancelled'
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

-- :::seed
INSERT INTO customers (id, name, email, city, created_at) VALUES
  (1, 'Nguyễn Văn An', 'an.nguyen@gmail.com', 'Hà Nội', '2026-01-15'),
  (2, 'Trần Thị Bình', 'binh.tran@yahoo.com', 'Đà Nẵng', '2026-02-20'),
  (3, 'Lê Hoàng Cường', 'cuong.le@gmail.com', 'TP. Hồ Chí Minh', '2026-03-10'),
  (4, 'Phạm Minh Đức', 'duc.pham@outlook.com', 'Hà Nội', '2026-04-05'),
  (5, 'Vũ Hải Yến', 'yen.vu@gmail.com', 'TP. Hồ Chí Minh', '2026-05-12');

INSERT INTO orders (id, customer_id, order_date, total_amount, status) VALUES
  (101, 1, '2026-06-01', 1250000, 'completed'),
  (102, 1, '2026-06-15', 450000, 'completed'),
  (103, 2, '2026-06-20', 2100000, 'completed'),
  (104, 3, '2026-07-02', 890000, 'pending'),
  (105, 4, '2026-07-10', 320000, 'cancelled');

INSERT INTO order_items (id, order_id, product_name, quantity, unit_price) VALUES
  (1, 101, 'Bàn phím cơ DareU', 1, 850000),
  (2, 101, 'Chuột không dây Logitech', 1, 400000),
  (3, 102, 'Lót chuột cỡ lớn', 3, 150000),
  (4, 103, 'Tai nghe HyperX', 1, 2100000),
  (5, 104, 'Giá đỡ laptop nhôm', 1, 890000);
```

### Dataset 2: Human Resources & Salaries (`hr_mini`)
```sql
-- :::schema
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  location VARCHAR(50) NOT NULL
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  salary NUMERIC(10, 2) NOT NULL,
  hire_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- :::seed
INSERT INTO departments (id, name, location) VALUES
  (1, 'Engineering', 'Tầng 4'),
  (2, 'Quality Assurance (QA)', 'Tầng 4'),
  (3, 'Human Resources', 'Tầng 2'),
  (4, 'Marketing', 'Tầng 3');

INSERT INTO employees (id, name, department_id, salary, hire_date, is_active) VALUES
  (1, 'Đặng Quốc Bảo', 1, 28000000, '2024-01-10', true),
  (2, 'Nguyễn Thị Mai', 2, 22000000, '2024-03-15', true),
  (3, 'Trần Tuấn Kiệt', 1, 35000000, '2023-08-01', true),
  (4, 'Phan Bích Nga', 2, 19500000, '2025-02-01', true),
  (5, 'Lâm Thanh Phong', 3, 18000000, '2023-11-20', true),
  (6, 'Hoàng Gia Bảo', NULL, 15000000, '2026-01-05', false);
```

---

## 3. Ma Trận Cú Pháp Matchers (Automation Test Syntax Reference)

Bảng đối chiếu Matcher dùng trong Web Worker Test Runner của `study-web`:

| Matcher Cú pháp | Ví dụ Sử dụng | Ý nghĩa Kiểm thử & Khi nào dùng |
|---|---|---|
| `.toBe(value)` | `expect(res.status).toBe(200)` | So sánh bằng nghiêm ngặt (`===`). Dùng cho primitives: `number`, `string`, `boolean`. |
| `.toEqual(value)` | `expect(res.data).toEqual({ id: 1 })` | So sánh sâu (Deep equality) từng trường của Object hoặc phần tử của Array. |
| `.toBeDefined()` | `expect(res.data.token).toBeDefined()` | Kiểm tra một thuộc tính bắt buộc phải tồn tại trong kết quả trả về. |
| `.toBeUndefined()`| `expect(res.data.password).toBeUndefined()` | Đảm bảo trường bảo mật hoặc trường không hợp lệ không xuất hiện. |
| `.toBeNull()` | `expect(res.data.deletedAt).toBeNull()` | Kiểm tra giá trị là `null` tường minh. |
| `.toBeTruthy()` | `expect(isValidToken(tok)).toBeTruthy()` | Kiểm tra giá trị chuyển đổi sang Boolean là `true`. |
| `.toContain(item)` | `expect(roles).toContain('admin')` | Kiểm tra chuỗi chứa chuỗi con, hoặc mảng chứa một phần tử cụ thể. |
| `.not.<matcher>` | `expect(err).not.toBeNull()` | Toán tử phủ định kết quả kiểm thử của bất kỳ matcher nào. |
