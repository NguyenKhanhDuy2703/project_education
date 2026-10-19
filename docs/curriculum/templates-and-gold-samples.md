# Bộ Bài Lab Mẫu Chuẩn Vàng (Gold Standard Samples V1)
*(Tuân thủ 100% ngữ pháp khối chỉ thị Markdown SPEC-LAB-MD-V1 của study-web)*

> **Tài liệu**: `DOC-CURRICULUM-04`  
> **Phiên bản**: 1.0  
> **Trạng thái**: Chuẩn hóa (Approved)  
> **Tác giả**: Educational Content Architecture Team  

---

## 1. Mẫu Chuẩn Vàng 1: Bài Thực Hành SQL (PostgreSQL In-Browser)

```markdown
# Phân Tích Đơn Hàng Thương Mại Điện Tử với INNER JOIN

### 1. Đặt Vấn Đề
Trong các hệ thống thương mại điện tử, dữ liệu khách hàng và dữ liệu đơn hàng được lưu tách biệt ở hai bảng khác nhau để tránh dư thừa dữ liệu (Chuẩn hóa cơ sở dữ liệu). Khi nhân viên chăm sóc khách hàng cần xem chi tiết: ai đã đặt đơn hàng nào, chúng ta bắt buộc phải sử dụng câu lệnh `INNER JOIN`.

### 2. Cú Pháp INNER JOIN Chuẩn
```sql
SELECT c.name, o.id AS order_id, o.total_amount
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;
```

### 3. Không Gian Thực Hành

:::schema
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL
);
:::

:::seed
INSERT INTO customers (id, name, city) VALUES
  (1, 'Nguyễn Văn An', 'Hà Nội'),
  (2, 'Trần Thị Bình', 'Đà Nẵng'),
  (3, 'Lê Hoàng Cường', 'TP. Hồ Chí Minh');

INSERT INTO orders (id, customer_id, total_amount, status) VALUES
  (101, 1, 1250000, 'completed'),
  (102, 1, 450000, 'completed'),
  (103, 2, 2100000, 'completed');
:::

:::expected
[
  { "name": "Nguyễn Văn An", "order_id": 101, "total_amount": 1250000 },
  { "name": "Nguyễn Văn An", "order_id": 102, "total_amount": 450000 },
  { "name": "Trần Thị Bình", "order_id": 103, "total_amount": 2100000 }
]
:::

### Nhiệm Vụ Của Bạn:
Hãy viết câu lệnh SQL để truy vấn danh sách gồm 3 cột:
- `name` (Tên khách hàng từ bảng customers)
- `order_id` (Cột id của bảng orders, đổi tên bí danh thành `order_id`)
- `total_amount` (Tổng tiền đơn hàng từ bảng orders)
Chỉ lấy các đơn hàng có trạng thái `status = 'completed'`, nối theo khóa ngoại `orders.customer_id = customers.id`.

### 4. Cạm Bẫy Thường Gặp
> [!WARNING]
> Nếu bạn quên mệnh đề `ON c.id = o.customer_id`, câu truy vấn sẽ biến thành phép nhân Cartesian (`CROSS JOIN`), sinh ra dữ liệu rác và làm nghẽn máy chủ dữ liệu!
```

---

## 2. Mẫu Chuẩn Vàng 2: Bộ Câu Hỏi Trắc Nghiệm Lý Thuyết (Quizel Assignment)

```markdown
# Kiểm Tra Kiến Thức Cốt Lõi: 7 Nguyên Lý Kiểm Thử & Phân Loại Lỗi

### 1. Giới Thiệu
Bộ trắc nghiệm này mô phỏng bài thi ISTQB Certified Tester Foundation Level (CTFL). Hãy đọc kỹ từng tình huống trước khi đưa ra quyết định.

:::quiz
[
  {
    "id": "q-istqb-01",
    "question": "Nguyên lý kiểm thử 'Testing shows the presence of defects, not their absence' (Kiểm thử chỉ ra sự hiện diện của lỗi chứ không chứng minh hệ thống hết lỗi) có ý nghĩa thực tế như thế nào?",
    "options": [
      "Kiểm thử có thể chứng minh 100% phần mềm không còn lỗi nếu chạy đủ tất cả các test case.",
      "Việc kiểm thử thành công và không tìm thấy lỗi chỉ làm giảm xác suất còn lỗi tiềm ẩn, không thể bảo đảm chắc chắn rằng phần mềm hoàn toàn không có khuyết tật.",
      "Tester chỉ cần tìm được 1 lỗi là có thể kết luận toàn bộ phần mềm bị hỏng.",
      "Lỗi phần mềm chỉ xuất hiện khi khách hàng sử dụng thực tế, người kiểm thử không thể phát hiện trước."
    ],
    "correctIndex": 1,
    "explanation": "Chính xác! Theo chuẩn ISTQB, việc kiểm thử làm giảm khả năng xảy ra lỗi chưa được phát hiện nhưng ngay cả khi không có lỗi nào được tìm thấy trong quá trình test, đó cũng không phải là bằng chứng cho thấy phần mềm không có lỗi.",
    "hint": "Hãy nhớ rằng việc không tìm thấy lỗi có đồng nghĩa với việc phần mềm đã hoàn hảo 100%?"
  },
  {
    "id": "q-istqb-02",
    "question": "Thuật ngữ 'Pesticide Paradox' (Nghịch lý thuốc trừ sâu) trong kiểm thử phần mềm cảnh báo điều gì?",
    "options": [
      "Nếu lặp đi lặp lại cùng một bộ test case mà không cập nhật, chúng sẽ dần mất khả năng tìm thấy những lỗi mới phát sinh.",
      "Các công cụ kiểm thử tự động sẽ dần bị lỗi thời sau 6 tháng sử dụng.",
      "Việc dùng quá nhiều công cụ kiểm thử sẽ làm giảm hiệu năng của đội ngũ phát triển.",
      "Chỉ nên kiểm thử khi hệ thống đã hoàn thiện 100% để tránh lãng phí chi phí."
    ],
    "correctIndex": 0,
    "explanation": "Chính xác! Giống như sâu bọ phát triển khả năng kháng thuốc trừ sâu, phần mềm sau khi sửa lỗi cũ sẽ làm cho các test case cũ không còn tìm ra lỗi mới nữa. Test case cần được xem xét và cập nhật liên tục.",
    "hint": "Điều gì sẽ xảy ra nếu bạn chỉ dùng duy nhất một kịch bản test cũ ngày này qua tháng khác?"
  },
  {
    "id": "q-istqb-03",
    "question": "Sự khác biệt cốt lõi giữa 'Severity' (Mức độ nghiêm trọng) và 'Priority' (Độ ưu tiên giải quyết) của một Bug là gì?",
    "options": [
      "Severity do Product Owner quyết định, Priority do QA quyết định.",
      "Severity đánh giá mức độ ảnh hưởng kỹ thuật của lỗi tới hệ thống; còn Priority xác định thứ tự cấp bách cần sửa chữa dựa trên góc độ kinh doanh.",
      "Severity và Priority là hai từ đồng nghĩa hoàn toàn trong kiểm thử phần mềm.",
      "Mọi lỗi có Severity là Critical thì bắt buộc Priority phải là Low."
    ],
    "correctIndex": 1,
    "explanation": "Chính xác! Severity thể hiện mức độ nguy hiểm kỹ thuật của bug (ví dụ crash hệ thống = Critical). Priority thể hiện mức độ khẩn cấp cần fix (do PM/PO và Dev Lead thống nhất để đưa vào sprint).",
    "hint": "Một lỗi sai chính tả logo công ty ở trang chủ thì mức độ hỏng hóc kỹ thuật thế nào, nhưng độ khẩn cấp sửa ra sao?"
  }
]
:::
```

---

## 3. Mẫu Chuẩn Vàng 3: Bài Thực Hành Automation Test Syntax (Web Worker Runner)

```markdown
# Cú Pháp Automation Test: Phân Biệt Matcher toBe vs toEqual

### 1. Đặt Vấn Đề
Một trong những lỗi phổ biến nhất khiến bài test tự động bị fail oan (False Negative) là sử dụng nhầm giữa `toBe` và `toEqual`. 
Trong JavaScript:
- `toBe` so sánh theo tham chiếu vùng nhớ (`===`). Hai Object có nội dung giống hệt nhau nhưng nằm ở hai ô nhớ khác nhau thì `toBe` sẽ trả về `false`.
- `toEqual` duyệt đệ quy (Deep Equality) từng thuộc tính bên trong để so sánh giá trị thực sự.

### 2. Không Gian Thực Hành Tương Tác

:::starter javascript
// Dữ liệu giả lập hồ sơ người dùng trả về từ cơ sở dữ liệu
function getUserProfile(id) {
  return {
    id: id,
    username: 'tester_pro',
    roles: ['qa', 'automation'],
    settings: { darkMode: true }
  };
}

// TODO: Hãy điền đúng Matcher vào các câu khẳng định dưới đây
describe('Xác thực Hồ sơ Người dùng (User Profile)', () => {
  const profile = getUserProfile(101);

  test('Kiểm tra giá trị primitive ID', () => {
    // 1. So sánh số nguyên primitive dùng matcher nào?
    expect(profile.id).toBe(101);
  });

  test('Kiểm tra Object settings cấu trúc sâu', () => {
    // 2. So sánh Object cấu trúc dùng matcher nào?
    expect(profile.settings).toEqual({ darkMode: true });
  });

  test('Kiểm tra danh sách quyền chứa role "qa"', () => {
    // 3. Kiểm tra mảng chứa phần tử cụ thể dùng matcher nào?
    expect(profile.roles).toContain('qa');
  });
});
:::

:::tests javascript
// Kịch bản chấm bài tự động trong Web Worker
test('User script compiles and passes assertions', () => {
  const profile = getUserProfile(101);
  expect(profile.id).toBe(101);
  expect(profile.settings).toEqual({ darkMode: true });
  expect(profile.roles).toContain('qa');
});
:::

:::solution javascript
describe('Xác thực Hồ sơ Người dùng (User Profile)', () => {
  const profile = getUserProfile(101);

  test('Kiểm tra giá trị primitive ID', () => {
    expect(profile.id).toBe(101);
  });

  test('Kiểm tra Object settings cấu trúc sâu', () => {
    expect(profile.settings).toEqual({ darkMode: true });
  });

  test('Kiểm tra danh sách quyền chứa role "qa"', () => {
    expect(profile.roles).toContain('qa');
  });
});
:::
```
