# Lab Markdown Block Grammar Specification V1

> **Document ID**: SPEC-LAB-MD-V1  
> **Status**: FROZEN / APPROVED  
> **Date**: 2026-10-17  
> **Version**: 1.0  
> **Author**: Architecture & Contributor Studio Workstream  

---

## 1. Tổng quan & Triết lý Thiết kế

Trước đây, tác giả lab (contributor) phải nhập rời rạc nhiều form trường (title, instructions, snippet, testScript, schema, expectedResult, quiz questions...). Điều này gây khó khăn khi format code, viết hướng dẫn phong phú hoặc copy-paste từ kho bài giảng sẵn có.

**Ngữ pháp Markdown-first V1** cho phép tác giả viết toàn bộ nội dung trong một tài liệu Markdown duy nhất, sử dụng các khối directive có rào chắn (`:::directive ... :::`) để tách biệt các phần kỹ thuật mà vẫn giữ nguyên hướng dẫn lý thuyết tự nhiên (prose markdown).

---

## 2. Cú pháp các khối Directive (Block Directives)

Tất cả các khối directive bắt đầu bằng `:::<type> [args]` trên một dòng riêng và kết thúc bằng `:::` trên một dòng riêng.

### 2.1. Khối Khởi đầu Mã nguồn (`:::starter [lang]`)
Chứa mã khởi đầu được nạp vào code editor của học viên khi bắt đầu làm bài.
```markdown
:::starter javascript
function calculateDiscount(price, coupon) {
  // TODO: implement logic
  return price;
}
:::
```

### 2.2. Khối Kiểm thử Tự động (`:::tests [lang]`)
Chứa kịch bản kiểm thử (`testScript`) chạy trong Web Worker để chấm bài automation test.
```markdown
:::tests javascript
test('calculateDiscount handles PERCENT20', () => {
  expect(calculateDiscount(100, 'PERCENT20')).toBe(80);
});
:::
```

### 2.3. Khối Lời giải Chuẩn (`:::solution [lang]`)
Chứa bài giải mẫu của tác giả (được khoá theo quyền PRO / Admin).
```markdown
:::solution javascript
function calculateDiscount(price, coupon) {
  if (coupon === 'PERCENT20') return price * 0.8;
  return price;
}
:::
```

### 2.4. Khối SQL Schema (`:::schema`)
Chứa câu lệnh DDL `CREATE TABLE...` để khởi tạo cấu trúc cơ sở dữ liệu in-memory PostgreSQL (PGlite).
```markdown
:::schema
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);
:::
```

### 2.5. Khối SQL Seed (`:::seed`)
Chứa câu lệnh DML `INSERT INTO...` nạp dữ liệu mẫu ban đầu.
```markdown
:::seed
INSERT INTO products (name, price) VALUES
  ('Laptop', 1200.00),
  ('Headphones', 150.00);
:::
```

### 2.6. Khối Kết quả SQL Mong đợi (`:::expected`)
Chứa JSON mảng các hàng kết quả truy vấn mục tiêu cần đối chiếu.
```markdown
:::expected
[
  { "name": "Laptop", "price": 1200 }
]
:::
```

### 2.7. Khối Bộ câu hỏi Trắc nghiệm (`:::quiz`)
Chứa danh sách câu hỏi trắc nghiệm dưới dạng mảng JSON `QuizQuestionV1[]`.
```markdown
:::quiz
[
  {
    "id": "q1",
    "question": "PostgreSQL là hệ quản trị cơ sở dữ liệu loại nào?",
    "options": ["RDBMS", "Document DB", "Graph DB"],
    "correctIndex": 0,
    "explanation": "PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở."
  }
]
:::
```

---

## 3. Quy tắc Parser & Diagnostics (Error Handling)

1. **Phần chữ thông thường (Prose Instructions)**:
   Mọi văn bản nằm ngoài các khối `:::<type>` được gộp lại thành trường `instructions` (Markdown).
2. **Khối không đóng (Unclosed Block)**:
   Nếu gặp `:::starter` nhưng không có dòng `:::` kết thúc, parser sẽ ghi nhận một diagnostic lỗi dòng cụ thể: `Unclosed directive block "starter" starting at line X`.
3. **Khối không nhận diện (Unknown Directive)**:
   Các khối không thuộc danh mục chuẩn sẽ được bảo lưu an toàn dưới dạng markdown text thông thường để tránh mất dữ liệu của tác giả.
4. **Quy tắc Tròn trịa (Round-trip Fidelity)**:
   `parse(serialize(envelope)) == envelope`. Quá trình chuyển đổi qua lại giữa DTO và Markdown không làm mất dữ liệu.

---

## 4. Ví dụ Toàn vẹn cho Từng Loại Lab

### 4.1. Automation Test Lab
```markdown
# Bài tập: Viết hàm tính tổng giỏ hàng

Hãy hoàn thành hàm `calculateTotal(items)` để tính tổng tiền của mảng sản phẩm.

:::starter javascript
function calculateTotal(items) {
  // Viết mã tại đây
}
:::

:::tests javascript
test('calculateTotal with 2 items', () => {
  const items = [{ price: 10 }, { price: 20 }];
  expect(calculateTotal(items)).toBe(30);
});
:::

:::solution javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
:::
```

### 4.2. SQL Practice Lab
```markdown
# Bài thực hành: Tìm sản phẩm đắt nhất

Viết câu lệnh SQL lấy thông tin sản phẩm có giá cao nhất trong bảng `products`.

:::schema
CREATE TABLE products (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC
);
:::

:::seed
INSERT INTO products VALUES (1, 'Bàn phím', 50), (2, 'Màn hình', 300);
:::

:::starter sql
SELECT * FROM products;
:::

:::expected
[
  { "id": 2, "name": "Màn hình", "price": 300 }
]
:::

:::solution sql
SELECT * FROM products ORDER BY price DESC LIMIT 1;
:::
```
