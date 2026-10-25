# Danh Mục Nguồn Tài Liệu & Ma Trận Phóng Tác (Source Registry & Adaptation Matrix)

> **Mã tài liệu**: `DOC-CURRICULUM-05`
> **Phiên bản**: 1.0
> **Ngày chuẩn hóa**: 2026-10-22
> **Mục đích**: Lưu trữ thông tin bản quyền, phiên bản, mục tiêu sư phạm và quy tắc phóng tác cho 24 bài học cốt lõi (SQL, Testing Quiz, Playwright Automation).
> **Nguyên tắc bản quyền**: Toàn bộ câu hỏi trắc nghiệm, kịch bản kiểm thử, dữ liệu hạt giống (seed datasets) và HTML fixtures đều được **viết mới hoàn toàn (100% newly authored)** dựa trên chuẩn kỹ thuật công khai; nghiêm cấm sao chép nguyên văn (verbatim copying) từ đề thi mẫu hoặc tài liệu có bản quyền.

---

## 1. Bảng Đăng Ký Nguồn Tài Liệu (Authoritative Source Registry)

| ID Nguồn | Tên Nguồn / Tài Liệu | URL Chính Thức | Phiên Bản | Ngày Truy Cập | Giấy Phép | Mục Tiêu Học Tập (Learning Objectives) | Quy Tắc Phóng Tác (Adaptation Notes) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SRC-SQL-01** | PostgreSQL Official SQL Tutorial | `https://www.postgresql.org/docs/current/tutorial-sql.html` | PostgreSQL 16.x / 17.0 | 2026-10-22 | PostgreSQL License (Open Source) | Nắm vững cú pháp chuẩn `SELECT`, `WHERE`, `ORDER BY`, `GROUP BY`, `HAVING`, `JOIN` (INNER/LEFT), `CASE WHEN`, toán tử logic `ILIKE`, `BETWEEN`. | Xây dựng dataset giả lập kinh doanh (E-commerce, HR, Support Desk) với 8–20 dòng/bảng. Truy vấn một câu lệnh chấm điểm tự động trong PGlite. |
| **SRC-SQL-02** | PostgreSQL Window Functions & CTE | `https://www.postgresql.org/docs/current/functions-window.html` | PostgreSQL 16.x / 17.0 | 2026-10-22 | PostgreSQL License (Open Source) | Hiểu và ứng dụng `ROW_NUMBER()`, `RANK()`, `PARTITION BY`, `DATE`/`INTERVAL` và Common Table Expressions (`WITH`). | Tạo bài toán xếp hạng sản phẩm bán chạy theo danh mục và tính toán vi phạm SLA ticket hỗ trợ khách hàng theo từng mức priority. |
| **SRC-TST-01** | ISTQB Certified Tester Foundation Level (CTFL) | `https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/` | Syllabus v4.0.1 (2023/2024) | 2026-10-22 | ISTQB Free Training Material Rights | Hiểu 7 nguyên lý kiểm thử, SDLC static vs dynamic testing, test levels & types, defect lifecycle, Equivalence Partitioning, Boundary Value Analysis, Decision Table, State Transition. | **Tuyệt đối không sao chép đề thi mẫu ISTQB**. Viết mới 100% tình huống thực tế xảy ra trong release dự án Web/Mobile tại Việt Nam; 4 phương án nhiễu hợp lý; giải thích rõ vì sao đúng và sai. |
| **SRC-TST-02** | OWASP Web Security Testing Guide (WSTG) | `https://wstg.owasp.org/latest/2-Introduction/` | WSTG v4.2 / Latest | 2026-10-22 | Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0) | Hiểu cơ chế xác thực (Authentication), khóa tài khoản (Lockout), phân quyền RBAC và mã trạng thái HTTP an toàn. | Lồng ghép tình huống xác thực, phân quyền và kiểm tra biên dữ liệu đầu vào vào các bài quizlet và test scenario. |
| **SRC-AUT-01** | Playwright Locators Guide | `https://playwright.dev/docs/locators` | Playwright v1.48+ | 2026-10-22 | Apache License 2.0 | Thành thạo locator bền vững theo vai trò người dùng: `getByRole`, `getByLabel`, `getByText`, `getByTestId`; tránh CSS selector dễ vỡ. | Thiết kế Mini-App Sandbox với cây DOM chuẩn semantic (accessible roles, aria labels). Học viên chọn locator thân thiện thay vì XPath. |
| **SRC-AUT-02** | Playwright Web-First Assertions | `https://playwright.dev/docs/test-assertions` | Playwright v1.48+ | 2026-10-22 | Apache License 2.0 | Nắm vững assertions chờ tự động (Auto-retrying assertions): `toBeVisible`, `toHaveText`, `toHaveValue`, `toHaveCount`, `toHaveURL`. | Phân biệt rõ sự khác nhau giữa assert biến số tĩnh (Jest `toBe`) và assert DOM thời gian thực trong trình duyệt. |
| **SRC-AUT-03** | Playwright Best Practices | `https://playwright.dev/docs/best-practices` | Playwright v1.48+ | 2026-10-22 | Apache License 2.0 | Nắm cấu trúc Arrange–Act–Assert, cách xử lý state độc lập, cô lập giữa các ca kiểm thử và không dùng hard wait (`waitForTimeout`). | Triển khai trong sandbox runner: mỗi lần Run tạo môi trường mới, tự reset DOM, đo lường thời gian thực thi. |
| **SRC-AUT-04** | Playwright Parameterized Tests | `https://playwright.dev/docs/test-parameterize` | Playwright v1.48+ | 2026-10-22 | Apache License 2.0 | Cấu trúc kiểm thử tham số hóa theo mảng dữ liệu nghiệp vụ, bắt buộc sinh tiêu đề test case duy nhất (Deterministic Unique Test Titles). | Dùng cho các bài học cấp độ 2 và 3, sinh mã TypeScript chuẩn `@playwright/test` với vòng lặp `scenarios.forEach(({ caseId, title }) => test(...))`. |

---

## 2. Ma Trận Chuyển Đổi Sang 24 Bài Học Thực Hành

### A. Chuỗi 8 Bài SQL Nghiệp Vụ (PostgreSQL)

| Bài | Tiêu Đề Bài Học | Nguồn Cơ Sở | Kỹ Thuật SQL Cốt Lõi | Ngữ Cảnh Tình Huống Nghiệp Vụ | Dữ Liệu Hạt Giống (Seed Table) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SQL-01** | Điều tra đơn hàng thất bại | SRC-SQL-01 | `SELECT`, cột cụ thể, `WHERE`, `ORDER BY`, `LIMIT` | Sàn TMĐT gặp sự cố thanh toán; QA cần trích xuất các đơn có trạng thái `failed` gần nhất kèm lý do lỗi. | `orders` (12 dòng, status: completed/failed/pending) |
| **SQL-02** | Phân khúc khách hàng cho chiến dịch | SRC-SQL-01 | `AND`, `OR`, `IN`, `BETWEEN`, `ILIKE` | Marketing cần gửi voucher cho khách hàng tại Hà Nội hoặc TP.HCM có tổng chi tiêu từ 1.000.000 đến 5.000.000 VNĐ. | `customers` (15 dòng, city, lifetime_spend, email) |
| **SQL-03** | Phát hiện tài khoản trùng lặp | SRC-SQL-01 | `COUNT`, `GROUP BY`, `HAVING` | Bộ phận Chống gian lận phát hiện người dùng tạo nhiều tài khoản cùng số điện thoại hoặc email. | `users` (16 dòng, phone, email, registered_at) |
| **SQL-04** | Đối soát doanh thu thương mại điện tử | SRC-SQL-01 | `INNER JOIN`, `SUM`, `ROUND`, alias cột | Đối soát kế toán cuối tháng: tính tổng tiền thanh toán thành công của từng khách hàng. | `customers`, `orders` (mỗi bảng 10 dòng) |
| **SQL-05** | Tìm khách hàng và sản phẩm bị bỏ quên | SRC-SQL-01 | `LEFT JOIN`, `IS NULL`, `COALESCE` | Phân tích churn: tìm khách hàng chưa từng phát sinh đơn hàng và sản phẩm trong kho chưa từng được bán. | `customers`, `orders`, `products` (12 dòng) |
| **SQL-06** | Cảnh báo tồn kho và hàng bán vượt mức | SRC-SQL-01 | Aggregate đa bảng, `CASE WHEN ... THEN` | Phân loại trạng thái hàng tồn kho thành 3 mức: `out_of_stock`, `low_stock`, `healthy`. | `products`, `inventory_logs` (14 dòng) |
| **SQL-07** | Theo dõi SLA ticket hỗ trợ | SRC-SQL-02 | `TIMESTAMPTZ`, `INTERVAL`, CTE `WITH` | Bàn hỗ trợ kỹ thuật: phát hiện ticket quá hạn giải quyết (SLA) dựa trên mức độ ưu tiên (`Urgent` = 2h, `Normal` = 24h). | `support_tickets` (12 dòng, priority, created_at, resolved_at) |
| **SQL-08** | Xếp hạng sản phẩm theo danh mục | SRC-SQL-02 | `ROW_NUMBER()`, `RANK()`, `PARTITION BY` | Dashboard hiển thị Top 2 sản phẩm có doanh số cao nhất trong từng phân loại sản phẩm. | `products`, `categories`, `order_items` (18 dòng) |

---

### B. Chuỗi 8 Bài Testing Theory Quiz (Scenario-Based, Ngưỡng 80%)

| Quiz | Tên Chủ Đề Quiz | Nguồn Cơ Sở | Khái Niệm / Mục Tiêu Đánh Giá | Tình Huống Giả Định |
| :--- | :--- | :--- | :--- | :--- |
| **QUIZ-01** | Bảy nguyên lý kiểm thử trong release deadline | SRC-TST-01 | 7 Testing Principles (Absence-of-errors fallacy, Defect clustering, Pesticide paradox...) | Đội ngũ dự án sắp đến ngày Go-Live, Giám đốc sản phẩm yêu cầu bỏ qua test hồi quy vì "sprint này không thấy báo bug nào". |
| **QUIZ-02** | Review requirement & Static Testing | SRC-TST-01 | Static testing, User Story ambiguity, Checklist-based review | QA nhận tài liệu đặc tả chức năng "Người dùng có thể nạp tiền nhanh chóng bằng thẻ tín dụng" trước khi dev code. |
| **QUIZ-03** | Test Level & Test Type luồng Web-API-DB | SRC-TST-01 | Component, Integration, System, Acceptance; Functional vs Non-Functional | Phân loại đúng loại kiểm thử và cấp độ kiểm thử khi phát hiện lỗi dữ liệu âm xuất hiện trên giao diện. |
| **QUIZ-04** | Defect Lifecycle, Severity & Priority | SRC-TST-01 | Bug triage, Phân biệt Độ nghiêm trọng (Severity) và Mức ưu tiên xử lý (Priority) | Lỗi tràn giao diện logo công ty trên trang chủ vào dịp Tết vs lỗi hệ thống không ghi log khi thanh toán thất bại. |
| **QUIZ-05** | Equivalence Partitioning (Phân vùng tương đương) | SRC-TST-01 | Valid partitions, Invalid partitions, Giảm thiểu số lượng test case | Form nhập độ tuổi đăng ký lái xe (18 đến 65 tuổi), số tiền rút ATM và độ dài mật khẩu an toàn. |
| **QUIZ-06** | Boundary Value Analysis (Phân tích giá trị biên) | SRC-TST-01 | 2-value BVA, 3-value BVA, Off-by-one errors | Giới hạn dung lượng upload tệp tối đa 10MB, số lượng sản phẩm mua tối đa 99, và số lần thử OTP tối đa 5 lần. |
| **QUIZ-07** | Decision Table (Bảng quyết định) | SRC-TST-01 | Phối hợp nhiều điều kiện logic (Business Rules Combinations) | Áp dụng mã giảm giá khi: Là thành viên VIP VÀ Đơn hàng trên 500k VÀ Thanh toán qua Ví điện tử. |
| **QUIZ-08** | State Transition, Lockout & RBAC Status Codes | SRC-TST-01, SRC-TST-02 | Chuyển đổi trạng thái đơn hàng, Auth lockout, HTTP 401 vs 403 vs 422 | Đăng nhập sai 3 lần chuyển sang trạng thái Lock; User thông thường cố truy cập endpoint Admin nhận mã 403. |

---

### C. Chuỗi 8 Bài Automation Playwright (Từ Low-Code đến Tự Viết)

| Bài | Tiêu Đề Bài Học | Cấp Độ (Mode) | Nguồn Cơ Sở | Selector & Assertions Chính | Fixture Ứng Dụng Mini-App |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUT-01** | Cấu trúc test AAA & Điều hướng | Block Builder | SRC-AUT-01, SRC-AUT-03 | `page.goto('/welcome')`, Arrange-Act-Assert blocks | Màn hình chào mừng và giới thiệu tính năng |
| **AUT-02** | Chọn Locator Bền Vững | Block Builder | SRC-AUT-01 | `getByRole('button', { name })`, `getByLabel('Email')`, `getByText()` | Trang đăng ký thành viên với các nút và input semantic |
| **AUT-03** | Tương tác Form hoàn chỉnh | Block Builder | SRC-AUT-01, SRC-AUT-03 | `fill`, `click`, `check('terms')`, `selectOption('city')` | Form khảo sát hồ sơ ứng viên với dropdown và checkbox |
| **AUT-04** | Khẳng định Web-First Assertions | Smart Cloze | SRC-AUT-02 | `toBeVisible()`, `toHaveText()`, `toHaveValue()`, `toHaveURL()` | Trang hiển thị thông báo flash và chuyển hướng sau đăng ký |
| **AUT-05** | Đăng nhập Positive & Negative | Smart Cloze | SRC-AUT-01, SRC-AUT-02 | Form authentication với thông báo lỗi `Invalid credentials` | Màn hình Login xác thực tài khoản có banner cảnh báo |
| **AUT-06** | Parameterized Boundary Testing | Smart Cloze | SRC-AUT-04 | `scenarios.forEach`, unique test titles, boundary input assertions | Form đổi mật khẩu với các ca biên độ dài và ký tự đặc biệt |
| **AUT-07** | Ma Trận Quyền Hạn RBAC | Guided Code | SRC-AUT-01, SRC-AUT-04 | User, Subscriber, Admin; kiểm tra visibility của menu và nút Admin | Cổng thông tin doanh nghiệp phân chia 3 cấp quyền hạn |
| **AUT-08** | Capstone E2E Flow Đặt Hàng | Full Code | SRC-AUT-01, 02, 03, 04 | Tìm kiếm sản phẩm, thêm vào giỏ, nhập địa chỉ, assert tổng tiền và mã đơn | Mini-app E-Commerce Checkout đầy đủ 3 bước |

---

## 3. Cam Kết Đạo Đức Dữ Liệu & Bản Quyền Sư Phạm

1. **Không sao chép nguyên văn**: Mọi đề bài, câu hỏi, dữ liệu và đáp án được viết bằng ngôn ngữ và bối cảnh riêng, phù hợp với kỹ sư QA tại Việt Nam.
2. **Không phụ thuộc mạng bên ngoài**: Mọi fixture và runner đều tự đóng gói (self-contained) trên client, không tải tài nguyên từ CDN bên ngoài tại runtime.
3. **Mã nguồn minh bạch**: Cú pháp Playwright sinh ra tuân thủ 100% chuẩn TypeScript chính thức từ Microsoft Playwright.
