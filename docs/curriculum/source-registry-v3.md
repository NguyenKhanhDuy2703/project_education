# Danh Mục Nguồn Tài Liệu Chuẩn & Cơ Sở Tham Chiếu (Source Registry V3)
*(Authoritative Source Registry for 24 MVP Practical QA Labs)*

> **Tài liệu**: `DOC-SOURCE-REGISTRY-V3`
> **Phiên bản**: 3.0
> **Ngày truy cập**: 2026-10-22
> **Mục tiêu**: Chuẩn hóa nguồn tài liệu mở, bản quyền, mục tiêu đào tạo và ghi chú chuyển thể sư phạm cho 24 bài học thực tế (8 SQL, 8 Quiz, 8 Automation Playwright).

---

## 1. Nguồn Tham Chiếu Kỹ Thuật (Authoritative Technical Sources)

| ID | Nhóm Nội Dung | Nguồn / URL Chính Thức | Phiên bản | Bản quyền / Giấy phép | Mục tiêu Sư phạm (Learning Objectives) | Ghi chú Chuyển thể Sư phạm (Adaptation Notes) |
|---|---|---|:---:|:---:|---|---|
| **SRC-SQL-01** | SQL & Database | [PostgreSQL Official Tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html) | PostgreSQL 16/17 | PostgreSQL License (Open Source) | Nắm vững cú pháp chuẩn `SELECT`, `WHERE`, `ORDER BY`, `GROUP BY`, `HAVING`, `JOIN` (`INNER`, `LEFT`), `COALESCE`, aggregate functions. | Tạo mới 8 dataset tình huống kinh doanh thực tế (E-commerce, Support Ticket, Inventory, Customer Segment) có từ 8–20 dòng; không sao chép database mẫu `dvdrental` hay `northwind`. |
| **SRC-SQL-02** | SQL Window Functions | [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/functions-window.html) | PostgreSQL 16/17 | PostgreSQL License | Sử dụng `ROW_NUMBER()`, `RANK()`, `PARTITION BY`, CTE (`WITH`) cho bài toán xếp hạng và truy vấn dữ liệu phân tích. | Thiết kế tình huống xếp hạng sản phẩm bán chạy nhất trong từng danh mục mà không làm gộp (collapse) các dòng chi tiết. |
| **SRC-QUIZ-01** | Testing Theory | [ISTQB Certified Tester Foundation Level (CTFL)](https://www.istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/) | v4.0.1 (2023/2024) | ISTQB Copyright (Educational Reference) | Hiểu sâu 7 nguyên lý kiểm thử, Static Testing, Test Levels (Unit/Integration/System/UAT), Defect Lifecycle, Severity vs Priority, Equivalence Partitioning, BVA, Decision Table, State Transition. | **Quy tắc bản quyền nghiêm ngặt**: 100% câu hỏi tình huống được viết mới hoàn toàn, đặt trong ngữ cảnh dự án phần mềm hiện đại; tuyệt đối không sao chép nguyên văn sample exam của ISTQB. |
| **SRC-QUIZ-02** | Security & API Testing | [OWASP Web Security Testing Guide (WSTG)](https://wstg.owasp.org/latest/2-Introduction/) | v4.2 / Current | CC-BY-SA 4.0 | Kiểm thử xác thực (Authentication), phân quyền (Authorization/RBAC), lockout policy, và mã trạng thái HTTP (401 vs 403, 422, 429). | Xây dựng các câu hỏi scenario về brute-force lockout, token hết hạn, và vai trò người dùng truy cập endpoint nhạy cảm. |
| **SRC-AUTO-01** | Playwright Locators | [Playwright Locators Documentation](https://playwright.dev/docs/locators) | Playwright 1.48+ | Apache 2.0 | Thành thạo web-first locators bền vững: `getByRole`, `getByLabel`, `getByText`, `getByTestId`; tránh CSS selector dễ vỡ. | Xây dựng bài tập block builder và smart cloze giúp học viên nhận biết selector dễ vỡ và tự chọn locator đạt chuẩn trợ năng (ARIA). |
| **SRC-AUTO-02** | Web-First Assertions | [Playwright Test Assertions](https://playwright.dev/docs/test-assertions) | Playwright 1.48+ | Apache 2.0 | Sử dụng async web-first assertions tự động chờ (auto-retrying): `toBeVisible()`, `toHaveText()`, `toHaveValue()`, `toHaveCount()`, `toHaveURL()`. | Mô phỏng DOM mini-app với độ trễ phản hồi để học viên hiểu lý do tại sao web-first assertions vượt trội hơn so với assertion đồng bộ. |
| **SRC-AUTO-03** | Playwright Parameterization | [Playwright Parameterized Tests](https://playwright.dev/docs/test-parameterize) | Playwright 1.48+ | Apache 2.0 | Viết test chạy lặp trên ma trận dữ liệu (data-driven testing) với email, mật khẩu, role và boundary data; đảm bảo title test là duy nhất. | Sinh code Playwright tiêu chuẩn định dạng `[CaseID] Title` đảm bảo tính duy nhất và khả năng export sang file `.spec.ts` thật. |
| **SRC-AUTO-04** | Best Practices | [Playwright Best Practices](https://playwright.dev/docs/best-practices) | Playwright 1.48+ | Apache 2.0 | Tuân thủ cấu trúc Arrange-Act-Assert, độc lập giữa các test case, sử dụng test isolation và clean state per run. | Đảm bảo sandbox runner dọn sạch state sau mỗi lần chạy và mã sinh ra tuân thủ clean code tiêu chuẩn. |

---

## 2. Tiêu Chí Nghiệm Thu Sư Phạm (Pedagogical Verification Standards)

1. **Ngôn ngữ kép nhất quán**:
   - Giải thích lý thuyết, gợi ý (hints), và phản hồi lỗi (feedback) hoàn toàn bằng **tiếng Việt chuẩn mực, mạch lạc, dễ hiểu cho người mới**.
   - Mã code, tên cột/bảng SQL, câu lệnh SQL, mã HTTP, selector HTML, tên assertion và tên hàm đều bằng **tiếng Anh tiêu chuẩn ngành**.
2. **Cơ chế đánh giá & Vượt qua bài học**:
   - SQL: Kết quả truy vấn so khớp hoàn toàn với expected result (tên cột, giá trị dòng, thứ tự nếu order-sensitive, xử lý NULL). Cho phép hint đa tầng.
   - Quiz: Đạt tối thiểu **80%** (ít nhất 4/5 câu đúng) để hoàn thành bài. Mỗi câu có 4 phương án gây nhiễu hợp lý; giải thích cặn kẽ tại sao đúng và tại sao sai.
   - Automation Low-code: Vượt qua toàn bộ public checks; mã TypeScript sinh ra tuân thủ cú pháp Playwright Test Runner chính thức.
