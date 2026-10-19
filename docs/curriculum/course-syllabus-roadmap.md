# Khung Giáo Trình Chuẩn (Course Syllabus Roadmap)
*(Dành cho 3 Series cốt lõi: SQL Mastery, Testing Theory Quizel, Automation Test Syntax)*

> **Tài liệu**: `DOC-CURRICULUM-01`  
> **Phiên bản**: 1.0  
> **Trạng thái**: Chuẩn hóa (Approved)  
> **Nền tảng triển khai**: `study-web`  

---

## 1. Series 1: SQL In-Browser Mastery (PostgreSQL & Database Fundamentals)
* **Category**: `database`
* **Engine**: `sql_worker` (PGlite in-memory WebAssembly)
* **Đối tượng**: Người mới bắt đầu, QA/QC Tester muốn truy vấn dữ liệu kiểm thử, và Backend Developer.

| Level | Mã Lab / Slug | Tiêu đề Bài học | Mục tiêu sư phạm (Learning Objectives) | Thời lượng | Preview / Pro |
|---|---|---|---|:---:|:---:|
| **Beginner** | `sql-01-select-all` | SELECT Cơ Bản & Khám Phá Bảng | Đọc toàn bộ dữ liệu bảng `Customers` bằng `SELECT *` | 15 min | Free |
| **Beginner** | `sql-02-select-columns-alias` | Chỉ Định Cột & Đặt Tên Bí Danh (AS) | Tối ưu băng thông bằng cách chỉ lấy cột cần thiết và đổi tên cột bằng `AS` | 15 min | Free |
| **Beginner** | `sql-03-distinct-unique` | Loại Bỏ Trùng Lặp với DISTINCT | Lọc danh sách quốc gia/danh mục duy nhất không bị lặp | 15 min | Free |
| **Beginner** | `sql-04-where-conditions` | Lọc Dữ Liệu với Mệnh Đề WHERE | Áp dụng toán tử so sánh `=`, `<>`, `>`, `<`, `>=`, `<=` để lọc bản ghi | 15 min | Free |
| **Beginner** | `sql-05-and-or-not` | Kết Hợp Điều Kiện AND, OR, NOT | Xây dựng logic lọc đa tầng với độ ưu tiên dấu ngoặc đơn | 20 min | Pro |
| **Beginner** | `sql-06-in-between` | Khoảng Giá Trị BETWEEN & Tập Hợp IN | Thay thế chuỗi mệnh đề `OR` phức tạp bằng cú pháp `IN` và `BETWEEN` sạch sẽ | 20 min | Pro |
| **Beginner** | `sql-07-like-ilike` | Tìm Kiếm Mẫu Chuỗi với LIKE & ILIKE | Sử dụng Wildcard `%` và `_`, phân biệt phân biệt chữ hoa/thường trong Postgres | 20 min | Pro |
| **Beginner** | `sql-08-null-handling` | Xử Lý Giá Trị Rỗng IS NULL & IS NOT NULL | Nhận thức giá trị ba trạng thái (Three-Valued Logic) và hàm `COALESCE` | 20 min | Pro |
| **Intermediate** | `sql-09-order-by-limit` | Sắp Xếp ORDER BY & Phân Trang LIMIT/OFFSET | Sắp xếp nhiều cột `ASC`/`DESC` và tính toán phân trang giao diện | 20 min | Free |
| **Intermediate** | `sql-10-aggregate-functions` | Các Hàm Tổng Hợp: COUNT, SUM, AVG, MIN, MAX | Thống kê số lượng, doanh thu và giá trị trung bình trên tập dữ liệu | 20 min | Free |
| **Intermediate** | `sql-11-group-by-having` | Nhóm Dữ Liệu GROUP BY & Lọc Nhóm HAVING | Phân biệt sự khác nhau giữa lọc dòng (`WHERE`) và lọc nhóm tổng hợp (`HAVING`) | 25 min | Pro |
| **Intermediate** | `sql-12-inner-join` | Ghép Nối Bảng với INNER JOIN | Nối bảng Đơn hàng và Khách hàng dựa trên Primary Key - Foreign Key | 25 min | Free |
| **Intermediate** | `sql-13-left-right-outer-join` | Giữ Dữ Liệu Khuyết với LEFT & RIGHT JOIN | Tìm các khách hàng chưa từng phát sinh đơn hàng (Left Join kết hợp `WHERE IS NULL`) | 25 min | Pro |
| **Advanced** | `sql-14-subqueries` | Truy Vấn Con (Subquery) trong WHERE & FROM | Sử dụng kết quả truy vấn con làm điều kiện lọc hoặc bảng tạm thời | 30 min | Pro |
| **Advanced** | `sql-15-cte-common-table-expressions` | Tái Cấu Trúc Truy Vấn với CTE (WITH) | Viết câu lệnh SQL phức tạp dễ đọc, bảo trì nhờ Common Table Expressions | 30 min | Pro |
| **Advanced** | `sql-16-window-functions-ranking` | Window Functions: ROW_NUMBER & RANK | Xếp hạng doanh số theo từng danh mục mà không làm gom gọn (collapse) các dòng | 30 min | Pro |

---

## 2. Series 2: Testing Theory & Quizel Certification (ISTQB & Real-world QA)
* **Category**: `testing`
* **Engine**: `quizlet` (Question palette, interactive assessment, explanation feedback)
* **Đối tượng**: Tester chuẩn bị thi chứng chỉ ISTQB Foundation CTFL v4.0, QA phỏng vấn xin việc, Developer muốn hiểu văn hóa chất lượng phần mềm.

| Level | Mã Lab / Slug | Tiêu đề Bộ câu hỏi | Trọng tâm Kiến thức (Knowledge Areas) | Số câu hỏi | Preview / Pro |
|---|---|---|---|:---:|:---:|
| **Fundamental** | `quiz-testing-7-principles` | 7 Nguyên Lý Kiểm Thử Phần Mềm (7 Testing Principles) | • Testing shows presence of defects, not absence<br>• Exhaustive testing is impossible<br>• Early testing / Defect clustering / Pesticide paradox | 5 câu | Free |
| **Fundamental** | `quiz-sdlc-test-levels` | Phân Cấp Kiểm Thử & Mô Hình SDLC | • Unit vs Integration vs System vs Acceptance (UAT)<br>• V-Model, Agile Testing & Shift-left testing<br>• Functional vs Non-Functional testing | 5 câu | Free |
| **Fundamental** | `quiz-defect-lifecycle` | Vòng Đời Lỗi (Defect Lifecycle) & Phân Loại Lỗi | • Error (Mistake) ➔ Defect (Bug) ➔ Failure<br>• Severity (Mức độ nghiêm trọng) vs Priority (Độ ưu tiên xử lý)<br>• Các trạng thái New, Open, Fixed, Retest, Closed, Reopened | 5 câu | Free |
| **Technique** | `quiz-black-box-bva-ep` | Kỹ Thuật Phân Vùng Tương Đương & Phân Tích Giá Trị Biên | • Equivalence Partitioning (Valid vs Invalid partitions)<br>• 2-point vs 3-point Boundary Value Analysis (BVA)<br>• Bài tập tính toán số lượng test case tối thiểu | 5 câu | Pro |
| **Technique** | `quiz-decision-table-state-transition` | Bảng Quyết Định & Chuyển Đổi Trạng Thái | • Decision Table Testing cho logic nghiệp vụ phức tạp<br>• State Transition Testing cho luồng đăng nhập, thanh toán<br>• Coverage criteria (0-switch, 1-switch) | 5 câu | Pro |
| **Scenario** | `quiz-api-security-http-status` | Tình Huống Kiểm Thử API & Trạng Thái HTTP | • Phân biệt HTTP 401 Unauthorized vs 403 Forbidden<br>• Idempotent HTTP Methods (GET, PUT, DELETE)<br>• Payload validation, Token expired, Rate limiting (429) | 5 câu | Free |
| **Scenario** | `quiz-agile-testing-automation-pyramid` | Kiểm Thử trong Agile & Kim Tự Tháp Kiểm Thử | • Test Automation Pyramid (Unit > Integration > E2E)<br>• Definition of Done (DoD), Acceptance Criteria (AC)<br>• TDD (Test-Driven Development) vs BDD (Behavior-Driven) | 5 câu | Pro |

---

## 3. Series 3: Automation Testing Syntax & Matchers Masterclass
* **Category**: `testing`
* **Engine**: `js_worker` (Automated worker test runner, Monaco editor, Matchers Core)
* **Đối tượng**: Manual Tester chuyển hướng Automation, Frontend/Backend Developer học viết Unit & Integration Tests.

| Level | Mã Lab / Slug | Tiêu đề Bài học | Cú pháp Trọng tâm (Syntax & API Covered) | Thời lượng | Preview / Pro |
|---|---|---|---|:---:|:---:|
| **Syntax 101** | `auto-01-test-anatomy-structure` | Cấu Trúc Bộ Test: describe, test, it | • Cú pháp khai báo `describe('suite', () => {})`<br>• Khai báo `test('case', () => {})` và alias `it()`<br>• Quy ước đặt tên test case chuẩn BDD | 15 min | Free |
| **Syntax 101** | `auto-02-primitive-matchers-tobevstoeuqual` | Phân Biệt Matcher: toBe vs toEqual | • `expect(val).toBe()`: So sánh tham chiếu (`===`) cho primitive (number, string, boolean)<br>• `expect(obj).toEqual()`: Deep equality cho Objects và Arrays | 20 min | Free |
| **Syntax 101** | `auto-03-truthiness-defined-matchers` | Matchers Chân Trị: toBeDefined, toBeNull, toBeTruthy | • `toBeDefined()` vs `toBeUndefined()`<br>• `toBeNull()` vs `toBeFalsy()` vs `toBeTruthy()`<br>• Assertions cho optional properties | 15 min | Free |
| **Syntax 102** | `auto-04-number-string-regex-matchers` | Matchers Số Học & Chuỗi: toContain, toMatch | • `toBeGreaterThan()`, `toBeLessThanOrEqual()`<br>• `toContain()` cho chuỗi con và phần tử mảng<br>• `toMatch(/regex/)` cho định dạng email, phone | 20 min | Pro |
| **Syntax 102** | `auto-05-negation-not-modifier` | Toán Tử Phủ Định: .not Modifier | • Cú pháp phủ định: `expect(x).not.toBe(y)`<br>• `expect(response).not.toContain('password')`<br>• Tránh cạm bẫy false positive khi dùng `.not` | 15 min | Free |
| **Integration** | `auto-06-api-response-assertions` | Viết Assertion Kiểm Thử API Response | • Assert `res.status === 200`<br>• Kiểm tra Header `content-type`<br>• Assert JWT token tồn tại và hợp lệ trong response payload | 20 min | Free |
| **Integration** | `auto-07-array-collection-assertions` | Kiểm Thử Mảng & Collection Dữ Liệu | • `toHaveLength(n)`<br>• `expect.arrayContaining([...])`<br>• Assert mảng objects lọc theo thuộc tính | 25 min | Pro |
| **Integration** | `auto-08-error-exception-testing` | Bắt Lỗi Ngoại Lệ với toThrow | • Bọc hàm trong callback: `expect(() => fn()).toThrow()`<br>• Kiểm tra Error Type & Error Message cụ thể | 20 min | Pro |
| **Best Practice**| `auto-09-test-hooks-lifecycle` | Vòng Đời Test: beforeEach & afterEach | • Khởi tạo dữ liệu sạch trước mỗi test bằng `beforeEach`<br>• Reset mock state và dọn dẹp biến môi trường | 25 min | Pro |
