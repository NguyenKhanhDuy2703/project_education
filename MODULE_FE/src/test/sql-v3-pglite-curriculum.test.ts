import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PgEngineCore } from '../features/lab/sql-engine/PgEngineCore';

describe('SQL V3 Curriculum Real Execution Verification with PGlite (Subtask 4.1)', { timeout: 60000 }, () => {
  let engine: PgEngineCore;

  beforeEach(() => {
    engine = new PgEngineCore();
  });

  afterEach(async () => {
    if (engine) await engine.dispose();
  });

  it('Lab 1: Điều tra đơn hàng thất bại (WHERE status = "failed" ORDER BY created_at DESC)', async () => {
    const schema = `
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_code VARCHAR(20) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
    `;
    const seed = `
      INSERT INTO orders (id, order_code, customer_name, amount, status, created_at) VALUES
        (1, 'ORD-9001', 'Nguyen Van An', 150.00, 'completed', '2026-10-01 10:00:00+07'),
        (2, 'ORD-9002', 'Tran Thi Binh', 220.50, 'failed', '2026-10-01 10:15:00+07'),
        (3, 'ORD-9003', 'Le Hoang Cuong', 85.00, 'pending', '2026-10-01 10:30:00+07'),
        (4, 'ORD-9004', 'Pham Minh Duc', 310.00, 'failed', '2026-10-01 11:00:00+07'),
        (5, 'ORD-9005', 'Vo Thi Em', 45.00, 'completed', '2026-10-01 11:20:00+07'),
        (6, 'ORD-9006', 'Dang Van Giang', 500.00, 'failed', '2026-10-01 12:00:00+07'),
        (7, 'ORD-9007', 'Hoang My Hanh', 120.00, 'completed', '2026-10-01 12:30:00+07'),
        (8, 'ORD-9008', 'Ngo Quoc Khanh', 95.00, 'failed', '2026-10-01 13:00:00+07');
    `;
    await engine.initialize(schema, seed);

    const query = `
      SELECT order_code, customer_name, amount
      FROM orders
      WHERE status = 'failed'
      ORDER BY created_at DESC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.columns).toEqual(['order_code', 'customer_name', 'amount']);
    expect(result.rowCount).toBe(4);
    expect(result.rows[0].order_code).toBe('ORD-9008');
    expect(result.rows[1].order_code).toBe('ORD-9006');
    expect(result.rows[2].order_code).toBe('ORD-9004');
    expect(result.rows[3].order_code).toBe('ORD-9002');
  }, 30000);

  it('Lab 2: Phân khúc khách hàng cho chiến dịch (IN, BETWEEN, ILIKE)', async () => {
    const schema = `
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        city VARCHAR(50) NOT NULL,
        total_spent NUMERIC(10,2) NOT NULL
      );
    `;
    const seed = `
      INSERT INTO customers (id, name, email, city, total_spent) VALUES
        (1, 'Alice Nguyen', 'alice@fpt.edu.vn', 'Hanoi', 650.00),
        (2, 'Bob Tran', 'bob@gmail.com', 'Hanoi', 400.00),
        (3, 'Charlie Le', 'charlie@techcorp.org', 'Saigon', 350.00),
        (4, 'David Pham', 'david@danang.edu.vn', 'Danang', 1200.00),
        (5, 'Emma Vo', 'emma@yahoo.com', 'Danang', 750.00),
        (6, 'Frank Dang', 'frank@gmail.com', 'Hue', 900.00),
        (7, 'Grace Hoang', 'grace@ngo.org', 'Saigon', 1500.00),
        (8, 'Henry Ngo', 'henry@hust.edu.vn', 'Haiphong', 200.00);
    `;
    await engine.initialize(schema, seed);

    const query = `
      SELECT name, email, city, total_spent
      FROM customers
      WHERE (city IN ('Hanoi', 'Danang') AND total_spent BETWEEN 500 AND 2000)
         OR email ILIKE '%.org'
      ORDER BY name ASC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(5);
    const names = result.rows.map((r) => r.name);
    expect(names).toEqual(['Alice Nguyen', 'Charlie Le', 'David Pham', 'Emma Vo', 'Grace Hoang']);
  }, 30000);

  it('Lab 3: Phát hiện tài khoản trùng lặp (COUNT, GROUP BY, HAVING >= 2)', async () => {
    const schema = `
      CREATE TABLE user_accounts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at DATE NOT NULL
      );
    `;
    const seed = `
      INSERT INTO user_accounts (id, username, phone, created_at) VALUES
        (1, 'user_an', '0901234567', '2026-10-01'),
        (2, 'user_binh', '0909999888', '2026-10-01'),
        (3, 'user_an_2', '0901234567', '2026-10-02'),
        (4, 'user_cuong', '0905555444', '2026-10-02'),
        (5, 'user_an_clone', '0901234567', '2026-10-03'),
        (6, 'user_duc', '0907777111', '2026-10-03'),
        (7, 'user_binh_vip', '0909999888', '2026-10-04'),
        (8, 'user_hoa', '0903333222', '2026-10-04');
    `;
    await engine.initialize(schema, seed);

    const query = `
      SELECT phone, COUNT(*) AS account_count
      FROM user_accounts
      GROUP BY phone
      HAVING COUNT(*) >= 2
      ORDER BY account_count DESC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(2);
    expect(result.rows[0].phone).toBe('0901234567');
    expect(Number(result.rows[0].account_count)).toBe(3);
    expect(result.rows[1].phone).toBe('0909999888');
    expect(Number(result.rows[1].account_count)).toBe(2);
  }, 30000);

  it('Lab 4: Đối soát doanh thu thương mại điện tử (INNER JOIN, SUM)', async () => {
    const schema = `
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
    `;
    const seed = `
      INSERT INTO clients (id, client_name) VALUES
        (1, 'Minh Beta Corp'), (2, 'Hoa Phat Tech'), (3, 'Viet Retail'), (4, 'Global Logistics');
      INSERT INTO client_orders (id, client_id, total_amount, status) VALUES
        (101, 1, 1200.00, 'completed'),
        (102, 1, 800.00, 'completed'),
        (103, 1, 300.00, 'cancelled'),
        (104, 2, 2500.00, 'completed'),
        (105, 3, 400.00, 'failed'),
        (106, 2, 1500.00, 'completed');
    `;
    await engine.initialize(schema, seed);

    const query = `
      SELECT c.client_name, SUM(o.total_amount) AS total_revenue
      FROM clients c
      INNER JOIN client_orders o ON c.id = o.client_id
      WHERE o.status = 'completed'
      GROUP BY c.client_name
      ORDER BY total_revenue DESC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(2);
    expect(result.rows[0].client_name).toBe('Hoa Phat Tech');
    expect(Number(result.rows[0].total_revenue)).toBe(4000);
    expect(result.rows[1].client_name).toBe('Minh Beta Corp');
    expect(Number(result.rows[1].total_revenue)).toBe(2000);
  }, 30000);

  it('Lab 5: Tìm khách hàng và sản phẩm bị bỏ quên (LEFT JOIN, IS NULL)', async () => {
    const schema = `
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
    `;
    const seed = `
      INSERT INTO registered_users (id, full_name, email) VALUES
        (1, 'Le Van Tam', 'tam@gmail.com'),
        (2, 'Do Thi Mai', 'mai@gmail.com'),
        (3, 'Phan Minh Tuan', 'tuan@gmail.com'),
        (4, 'Vu Thi Ngoc', 'ngoc@gmail.com');
      INSERT INTO purchase_orders (id, user_id, order_date) VALUES
        (1, 1, '2026-10-01'),
        (2, 3, '2026-10-02');
    `;
    await engine.initialize(schema, seed);

    const query = `
      SELECT u.full_name, u.email
      FROM registered_users u
      LEFT JOIN purchase_orders p ON u.id = p.user_id
      WHERE p.id IS NULL
      ORDER BY u.full_name ASC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(2);
    expect(result.rows[0].full_name).toBe('Do Thi Mai');
    expect(result.rows[1].full_name).toBe('Vu Thi Ngoc');
  }, 30000);

  it('Lab 6: Cảnh báo tồn kho (CASE WHEN stock_quantity)', async () => {
    const schema = `
      CREATE TABLE warehouse_items (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        stock_quantity INT NOT NULL
      );
    `;
    const seed = `
      INSERT INTO warehouse_items (id, product_name, stock_quantity) VALUES
        (1, 'USB Cable Type-C', 0),
        (2, 'Wireless Keyboard', 5),
        (3, '27-inch 4K Monitor', 45),
        (4, 'Gaming Mouse Pad', 8),
        (5, 'Bluetooth Earbuds', 0),
        (6, 'Laptop Stand', 25);
    `;
    await engine.initialize(schema, seed);

    const query = `
      SELECT product_name, stock_quantity,
        CASE
          WHEN stock_quantity = 0 THEN 'out_of_stock'
          WHEN stock_quantity <= 10 THEN 'low_stock'
          ELSE 'healthy'
        END AS stock_status
      FROM warehouse_items
      ORDER BY stock_quantity ASC, product_name ASC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(6);
    expect(result.rows[0].stock_status).toBe('out_of_stock');
    expect(result.rows[1].stock_status).toBe('out_of_stock');
    expect(result.rows[2].stock_status).toBe('low_stock');
    expect(result.rows[3].stock_status).toBe('low_stock');
    expect(result.rows[4].stock_status).toBe('healthy');
    expect(result.rows[5].stock_status).toBe('healthy');
  }, 30000);

  it('Lab 7: Theo dõi SLA ticket hỗ trợ (CTE WITH, date intervals)', async () => {
    const schema = `
      CREATE TABLE support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_code VARCHAR(20) NOT NULL,
        priority VARCHAR(10) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        first_responded_at TIMESTAMPTZ NOT NULL
      );
    `;
    const seed = `
      INSERT INTO support_tickets (id, ticket_code, priority, created_at, first_responded_at) VALUES
        (1, 'TCK-101', 'URGENT', '2026-10-01 08:00:00+07', '2026-10-01 11:30:00+07'),
        (2, 'TCK-102', 'URGENT', '2026-10-01 09:00:00+07', '2026-10-01 09:45:00+07'),
        (3, 'TCK-103', 'HIGH',   '2026-10-01 08:30:00+07', '2026-10-01 13:00:00+07'),
        (4, 'TCK-104', 'HIGH',   '2026-10-01 10:00:00+07', '2026-10-01 12:00:00+07'),
        (5, 'TCK-105', 'URGENT', '2026-10-01 14:00:00+07', '2026-10-01 17:00:00+07');
    `;
    await engine.initialize(schema, seed);

    const query = `
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
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(3);
    const codes = result.rows.map((r) => r.ticket_code);
    expect(codes).toEqual(['TCK-101', 'TCK-103', 'TCK-105']);
  }, 30000);

  it('Lab 8: Xếp hạng sản phẩm theo danh mục (Window Function ROW_NUMBER() OVER PARTITION BY)', async () => {
    const schema = `
      CREATE TABLE catalog_products (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        units_sold INT NOT NULL
      );
    `;
    const seed = `
      INSERT INTO catalog_products (id, category, product_name, units_sold) VALUES
        (1, 'Audio', 'AirPods Pro', 450),
        (2, 'Audio', 'Sony WH-1000XM5', 380),
        (3, 'Audio', 'JBL Flip 6', 290),
        (4, 'Display', 'Dell UltraSharp 27', 520),
        (5, 'Display', 'LG C3 OLED', 310),
        (6, 'Display', 'Samsung Odyssey G7', 410),
        (7, 'Keyboard', 'Keychron Q1 Pro', 620),
        (8, 'Keyboard', 'Logitech MX Keys', 580);
    `;
    await engine.initialize(schema, seed);

    const query = `
      WITH ranked_products AS (
        SELECT category, product_name, units_sold,
               ROW_NUMBER() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rank_pos
        FROM catalog_products
      )
      SELECT category, product_name, units_sold
      FROM ranked_products
      WHERE rank_pos = 1
      ORDER BY category ASC;
    `;
    const result = await engine.execute(query);

    expect(result.error).toBeUndefined();
    expect(result.rowCount).toBe(3);
    expect(result.rows[0].category).toBe('Audio');
    expect(result.rows[0].product_name).toBe('AirPods Pro');
    expect(result.rows[1].category).toBe('Display');
    expect(result.rows[1].product_name).toBe('Dell UltraSharp 27');
    expect(result.rows[2].category).toBe('Keyboard');
    expect(result.rows[2].product_name).toBe('Keychron Q1 Pro');
  }, 30000);
});
