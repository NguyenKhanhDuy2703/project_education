# Chương Trình 8 Bài SQL Thực Tế Tình Huống Doanh Nghiệp (PostgreSQL V3)
*(Practical SQL for Manual & Automation QA Engineers — Real-world Business Cases)*

> **Mã chương trình**: `CURRICULUM-SQL-V3`
> **Động cơ thực thi**: In-Browser PGlite (WebAssembly PostgreSQL 16)
> **Nguyên tắc**: 8–20 dòng dữ liệu hạt giống (seed rows) cho mỗi bài; schema chuẩn; problem statement rõ ràng; giải thích bẫy thường gặp; gợi ý đa tầng (tier-1 hint, tier-2 hint); challenge mở rộng.

---

### Bài 1: Điều tra đơn hàng thất bại (`sql-v3-01-failed-orders`)
- **Khái niệm**: `SELECT`, chọn cột, `WHERE`, `ORDER BY`
- **Tình huống nghiệp vụ**: Khách hàng khiếu nại giao dịch trừ tiền nhưng hệ thống báo lỗi. QA cần tra cứu các đơn hàng thất bại (`status = 'failed'`) gần đây nhất để lấy mã lỗi và thời gian.
- **Preview / Pro**: Free Preview
- **Schema & Seed**:
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

INSERT INTO orders (id, order_code, customer_name, amount, status, created_at) VALUES
  (1, 'ORD-9001', 'Nguyen Van An', 150.00, 'completed', '2026-10-01 10:00:00+07'),
  (2, 'ORD-9002', 'Tran Thi Binh', 220.50, 'failed', '2026-10-01 10:15:00+07'),
  (3, 'ORD-9003', 'Le Hoang Cuong', 85.00, 'pending', '2026-10-01 10:30:00+07'),
  (4, 'ORD-9004', 'Pham Minh Duc', 310.00, 'failed', '2026-10-01 11:00:00+07'),
  (5, 'ORD-9005', 'Vo Thi Em', 45.00, 'completed', '2026-10-01 11:20:00+07'),
  (6, 'ORD-9006', 'Dang Van Giang', 500.00, 'failed', '2026-10-01 12:00:00+07'),
  (7, 'ORD-9007', 'Hoang My Hanh', 120.00, 'completed', '2026-10-01 12:30:00+07'),
  (8, 'ORD-9008', 'Ngo Quoc Khanh', 95.00, 'failed', '2026-10-01 13:00:00+07');
```
- **Nhiệm vụ**: Lấy 3 cột `order_code`, `customer_name`, `amount` của các đơn hàng có `status = 'failed'`, sắp xếp giảm dần theo `created_at`.
- **Query Chuẩn (Gold Solution)**:
```sql
SELECT order_code, customer_name, amount
FROM orders
WHERE status = 'failed'
ORDER BY created_at DESC;
```
- **Expected Result**: 4 dòng (ORD-9008, ORD-9006, ORD-9004, ORD-9002).
- **Lỗi phổ biến**: Dùng `SELECT *` thay vì chọn đúng 3 cột; quên `DESC` trong `ORDER BY`.

---

### Bài 2: Phân khúc khách hàng cho chiến dịch (`sql-v3-02-customer-segments`)
- **Khái niệm**: `AND`, `OR`, `IN`, `BETWEEN`, `ILIKE`
- **Tình huống nghiệp vụ**: Đội Marketing chạy chiến dịch ưu đãi VIP cho khách hàng tại các thành phố lớn ('Hanoi', 'Danang') có tổng chi tiêu từ 500 đến 2000 USD hoặc sử dụng email doanh nghiệp tên miền `.edu` hoặc `.org`.
- **Preview / Pro**: Free Preview
- **Schema & Seed**:
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  total_spent NUMERIC(10,2) NOT NULL
);

INSERT INTO customers (id, name, email, city, total_spent) VALUES
  (1, 'Alice Nguyen', 'alice@fpt.edu.vn', 'Hanoi', 650.00),
  (2, 'Bob Tran', 'bob@gmail.com', 'Hanoi', 400.00),
  (3, 'Charlie Le', 'charlie@techcorp.org', 'Saigon', 350.00),
  (4, 'David Pham', 'david@danang.edu.vn', 'Danang', 1200.00),
  (5, 'Emma Vo', 'emma@yahoo.com', 'Danang', 750.00),
  (6, 'Frank Dang', 'frank@gmail.com', 'Hue', 900.00),
  (7, 'Grace Hoang', 'grace@ngo.org', 'Saigon', 1500.00),
  (8, 'Henry Ngo', 'henry@hust.edu.vn', 'Haiphong', 200.00);
```
- **Nhiệm vụ**: Lấy `name`, `email`, `city`, `total_spent` của khách hàng thỏa mãn: (thành phố thuộc `'Hanoi'` hoặc `'Danang'` VÀ `total_spent` trong khoảng 500 đến 2000) HOẶC `email` có đuôi `.org`. Sắp xếp tăng dần theo `name`.
- **Query Chuẩn (Gold Solution)**:
```sql
SELECT name, email, city, total_spent
FROM customers
WHERE (city IN ('Hanoi', 'Danang') AND total_spent BETWEEN 500 AND 2000)
   OR email ILIKE '%.org'
ORDER BY name ASC;
```
- **Expected Result**: 4 dòng (Alice Nguyen, Charlie Le, David Pham, Emma Vo, Grace Hoang).

---

### Bài 3: Phát hiện tài khoản trùng lặp (`sql-v3-03-duplicate-accounts`)
- **Khái niệm**: `COUNT`, `GROUP BY`, `HAVING`
- **Tình huống nghiệp vụ**: Hệ thống Anti-Fraud phát hiện nghi vấn người dùng cố tình tạo nhiều tài khoản bằng cùng một số điện thoại để trục lợi mã giảm giá.
- **Preview / Pro**: Free Preview
- **Schema & Seed**:
```sql
CREATE TABLE user_accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at DATE NOT NULL
);

INSERT INTO user_accounts (id, username, phone, created_at) VALUES
  (1, 'user_an', '0901234567', '2026-10-01'),
  (2, 'user_binh', '0909999888', '2026-10-01'),
  (3, 'user_an_2', '0901234567', '2026-10-02'),
  (4, 'user_cuong', '0905555444', '2026-10-02'),
  (5, 'user_an_clone', '0901234567', '2026-10-03'),
  (6, 'user_duc', '0907777111', '2026-10-03'),
  (7, 'user_binh_vip', '0909999888', '2026-10-04'),
  (8, 'user_hoa', '0903333222', '2026-10-04');
```
- **Nhiệm vụ**: Tìm danh sách các số điện thoại `phone` và số lượng tài khoản `account_count` đăng ký trên cùng số điện thoại đó có từ 2 tài khoản trở lên (`account_count >= 2`), sắp xếp giảm dần theo `account_count`.
- **Query Chuẩn (Gold Solution)**:
```sql
SELECT phone, COUNT(*) AS account_count
FROM user_accounts
GROUP BY phone
HAVING COUNT(*) >= 2
ORDER BY account_count DESC;
```
- **Expected Result**: 2 dòng (`0901234567`: 3, `0909999888`: 2).

---

### Bài 4: Đối soát doanh thu thương mại điện tử (`sql-v3-04-ecommerce-revenue-reconciliation`)
- **Khái niệm**: `INNER JOIN`, `SUM`, alias, `GROUP BY`
- **Tình huống nghiệp vụ**: Kế toán cần đối soát tổng số tiền đã thanh toán thành công theo từng khách hàng.
- **Preview / Pro**: Pro
- **Schema & Seed**:
```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL
);

CREATE TABLE client_orders (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id),
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL
);

INSERT INTO clients (id, client_name) VALUES
  (1, 'Minh Beta Corp'), (2, 'Hoa Phat Tech'), (3, 'Viet Retail'), (4, 'Global Logistics');

INSERT INTO client_orders (id, client_id, total_amount, status) VALUES
  (101, 1, 1200.00, 'completed'),
  (102, 1, 800.00, 'completed'),
  (103, 1, 300.00, 'cancelled'),
  (104, 2, 2500.00, 'completed'),
  (105, 3, 400.00, 'failed'),
  (106, 2, 1500.00, 'completed');
```
- **Nhiệm vụ**: Tính tổng doanh thu `total_revenue` từ các đơn hàng có `status = 'completed'` cho từng khách hàng `client_name`.
- **Query Chuẩn (Gold Solution)**:
```sql
SELECT c.client_name, SUM(o.total_amount) AS total_revenue
FROM clients c
INNER JOIN client_orders o ON c.id = o.client_id
WHERE o.status = 'completed'
GROUP BY c.client_name
ORDER BY total_revenue DESC;
```
- **Expected Result**: 2 dòng (Hoa Phat Tech: 4000.00, Minh Beta Corp: 2000.00).

---

### Bài 5: Tìm khách hàng và sản phẩm bị bỏ quên (`sql-v3-05-unclaimed-customers-products`)
- **Khái niệm**: `LEFT JOIN`, `IS NULL`, `COALESCE`
- **Tình huống nghiệp vụ**: Tìm các khách hàng đã đăng ký tài khoản nhưng chưa từng phát sinh đơn hàng nào để gửi email nhắc nhở kích hoạt.
- **Preview / Pro**: Pro
- **Schema & Seed**:
```sql
CREATE TABLE registered_users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES registered_users(id),
  order_date DATE NOT NULL
);

INSERT INTO registered_users (id, full_name, email) VALUES
  (1, 'Le Van Tam', 'tam@gmail.com'),
  (2, 'Do Thi Mai', 'mai@gmail.com'),
  (3, 'Phan Minh Tuan', 'tuan@gmail.com'),
  (4, 'Vu Thi Ngoc', 'ngoc@gmail.com');

INSERT INTO purchase_orders (id, user_id, order_date) VALUES
  (1, 1, '2026-10-01'),
  (2, 3, '2026-10-02');
```
- **Nhiệm vụ**: Lấy `full_name` và `email` của người dùng chưa từng có đơn hàng nào trong bảng `purchase_orders`. Sắp xếp tăng dần theo `full_name`.
- **Query Chuẩn (Gold Solution)**:
```sql
SELECT u.full_name, u.email
FROM registered_users u
LEFT JOIN purchase_orders p ON u.id = p.user_id
WHERE p.id IS NULL
ORDER BY u.full_name ASC;
```
- **Expected Result**: 2 dòng (Do Thi Mai, Vu Thi Ngoc).

---

### Bài 6: Cảnh báo tồn kho và hàng bán vượt mức (`sql-v3-06-inventory-stock-alerts`)
- **Khái niệm**: `CASE WHEN`, `SUM`, Aggregate nhiều bảng
- **Tình huống nghiệp vụ**: Phân loại tình trạng kho hàng thành `'out_of_stock'` (số lượng = 0), `'low_stock'` (1 đến 10), và `'healthy'` (> 10).
- **Preview / Pro**: Pro
- **Schema & Seed**:
```sql
CREATE TABLE warehouse_items (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  stock_quantity INT NOT NULL
);

INSERT INTO warehouse_items (id, product_name, stock_quantity) VALUES
  (1, 'USB Cable Type-C', 0),
  (2, 'Wireless Keyboard', 5),
  (3, '27-inch 4K Monitor', 45),
  (4, 'Gaming Mouse Pad', 8),
  (5, 'Bluetooth Earbuds', 0),
  (6, 'Laptop Stand', 25);
```
- **Nhiệm vụ**: Lấy `product_name`, `stock_quantity` và cột phân loại `stock_status` theo quy tắc: nếu `stock_quantity = 0` thì `'out_of_stock'`, nếu `<= 10` thì `'low_stock'`, còn lại là `'healthy'`. Sắp xếp theo `stock_quantity` tăng dần.
- **Query Chuẩn (Gold Solution)**:
```sql
SELECT product_name, stock_quantity,
  CASE
    WHEN stock_quantity = 0 THEN 'out_of_stock'
    WHEN stock_quantity <= 10 THEN 'low_stock'
    ELSE 'healthy'
  END AS stock_status
FROM warehouse_items
ORDER BY stock_quantity ASC, product_name ASC;
```

---

### Bài 7: Theo dõi SLA ticket hỗ trợ (`sql-v3-07-support-ticket-sla`)
- **Khái niệm**: Date/Time, Interval, Common Table Expression (CTE `WITH`)
- **Tình huống nghiệp vụ**: Đội CSKH cam kết phản hồi ticket cấp độ `'URGENT'` trong vòng 2 giờ, `'HIGH'` trong 4 giờ. Tìm các ticket vi phạm cam kết SLA (thời gian từ lúc tạo đến lúc phản hồi vượt quá định mức).
- **Preview / Pro**: Pro
- **Schema & Seed**:
```sql
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL,
  priority VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  first_responded_at TIMESTAMPTZ NOT NULL
);

INSERT INTO support_tickets (id, ticket_code, priority, created_at, first_responded_at) VALUES
  (1, 'TCK-101', 'URGENT', '2026-10-01 08:00:00+07', '2026-10-01 11:30:00+07'),
  (2, 'TCK-102', 'URGENT', '2026-10-01 09:00:00+07', '2026-10-01 09:45:00+07'),
  (3, 'TCK-103', 'HIGH',   '2026-10-01 08:30:00+07', '2026-10-01 13:00:00+07'),
  (4, 'TCK-104', 'HIGH',   '2026-10-01 10:00:00+07', '2026-10-01 12:00:00+07'),
  (5, 'TCK-105', 'URGENT', '2026-10-01 14:00:00+07', '2026-10-01 17:00:00+07');
```
- **Nhiệm vụ**: Dùng CTE xác định các ticket quá hạn SLA: `URGENT` mất hơn 2 giờ (`> INTERVAL '2 hours'`) hoặc `HIGH` mất hơn 4 giờ (`> INTERVAL '4 hours'`). Lấy `ticket_code`, `priority`.
- **Query Chuẩn (Gold Solution)**:
```sql
WITH sla_metrics AS (
  SELECT ticket_code, priority,
         (first_responded_at - created_at) AS response_duration
  FROM support_tickets
)
SELECT ticket_code, priority
FROM sla_metrics
WHERE (priority = 'URGENT' AND response_duration > INTERVAL '2 hours')
   OR (priority = 'HIGH' AND response_duration > INTERVAL '4 hours')
ORDER BY ticket_code ASC;
```
- **Expected Result**: 3 dòng (TCK-101, TCK-103, TCK-105).

---

### Bài 8: Xếp hạng sản phẩm theo danh mục (`sql-v3-08-category-product-ranking`)
- **Khái niệm**: `ROW_NUMBER()`, `RANK()`, `PARTITION BY`
- **Tình huống nghiệp vụ**: Báo cáo top sản phẩm bán chạy nhất trong từng danh mục hàng hóa (Lấy top 1 sản phẩm bán chạy nhất mỗi category).
- **Preview / Pro**: Pro
- **Schema & Seed**:
```sql
CREATE TABLE catalog_products (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  units_sold INT NOT NULL
);

INSERT INTO catalog_products (id, category, product_name, units_sold) VALUES
  (1, 'Audio', 'AirPods Pro', 450),
  (2, 'Audio', 'Sony WH-1000XM5', 380),
  (3, 'Audio', 'JBL Flip 6', 290),
  (4, 'Display', 'Dell UltraSharp 27', 520),
  (5, 'Display', 'LG C3 OLED', 310),
  (6, 'Display', 'Samsung Odyssey G7', 410),
  (7, 'Keyboard', 'Keychron Q1 Pro', 620),
  (8, 'Keyboard', 'Logitech MX Keys', 580);
```
- **Nhiệm vụ**: Lấy `category`, `product_name`, `units_sold` của sản phẩm có doanh số cao nhất (top 1) trong mỗi `category` bằng Window Function `ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC)`.
- **Query Chuẩn (Gold Solution)**:
```sql
WITH ranked_products AS (
  SELECT category, product_name, units_sold,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rank_pos
  FROM catalog_products
)
SELECT category, product_name, units_sold
FROM ranked_products
WHERE rank_pos = 1
ORDER BY category ASC;
```
- **Expected Result**: 3 dòng (Audio: AirPods Pro 450, Display: Dell UltraSharp 27 520, Keyboard: Keychron Q1 Pro 620).
