# Kế Hoạch Đổi Tên Series SQL & Tinh Gọn Tập Trung Vào Testing & SQL

> **Yêu cầu người dùng**:
> 1. Đổi tên Series và các bài lab SQL: Loại bỏ hoàn toàn thương hiệu/tiền tố "W3Schools", đổi thành `SQL Query Fundamentals` (Truy vấn CSDL căn bản), các bài lab đặt tên dạng `SQL 01: Câu Lệnh SELECT`, `SQL 02: SELECT Cột Cụ Thể`,...
> 2. Tinh gọn phạm vi hiển thị: Tạm thời chỉ tập trung vào 2 mảng chính là **Testing** và **SQL**; tạm ẩn các series Backend NestJS và Docker DevOps (`isActive: false`).
>
> **Tuân thủ giao thức**:
> - Plan-and-Execute Pattern (`.agents/skills/plan-and-execute/SKILL.md`)
> - Human Confirmation Gate (`AGENTS.md`): Dừng lại chờ lệnh xác nhận trực tiếp trước khi chạy code.

---

## 1. Phân Rã Nhiệm Vụ & Cổng Kiểm Thử (Verification Gates)

### Task 1: Tinh Chỉnh Seed Data & Làm Sạch Database (`MODULE_BE`)
- [ ] **Subtask 1.1**: Cập nhật `MODULE_BE/prisma/seed.ts`:
  - Đổi series slug từ `w3schools-sql-fundamentals` $\to$ `sql-query-fundamentals`.
  - Đổi series title thành `SQL Query Fundamentals`, mô tả "Làm chủ 10 câu lệnh truy vấn SQL kinh điển: SELECT, DISTINCT, WHERE, ORDER BY, AND/OR, LIKE, IN, BETWEEN, COUNT, GROUP BY."
  - Đổi toàn bộ 10 bài lab con:
    - Slug: `sql-01-select`, `sql-02-select-columns`, ..., `sql-10-count-group-by`.
    - Title: `SQL 01: Câu Lệnh SELECT`, `SQL 02: SELECT Cột Cụ Thể`, ..., `SQL 10: Hàm COUNT & Mệnh Đề GROUP BY`.
    - Instructions: Thay thế `# W3Schools SQL XX` thành `# SQL XX`.
  - Tạm ẩn (`isActive: false`) cho 2 series ngoài phạm vi:
    - `nestjs-backend-architecture` (Backend API với NestJS)
    - `docker-container-devops` (DevOps & Docker)
  - Thêm logic dọn dẹp các bản ghi cũ (`w3schools-sql-*`) trước khi upsert để tránh trùng lặp dữ liệu trong PostgreSQL.
  - *Verify Gate*: Chạy `npx tsx prisma/seed.ts` thành công 100%, kiểm tra DB chỉ còn các Series Testing & SQL ở trạng thái `isActive: true`.

### Task 2: Đồng Bộ Giao Diện & Điều Hướng (`MODULE_FE` & `MODULE_ADMIN`)
- [ ] **Subtask 2.1**: Kiểm tra trang danh mục [SeriesHubPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/lab/SeriesHubPage.tsx) và [HomePage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/HomePage.tsx):
  - Đảm bảo danh mục chỉ hiển thị các series đang active (Testing & SQL).
  - Kiểm tra bộ lọc định dạng (SQL Query, Quizlet, Automation Test) hiển thị chuẩn xác các bài tập của series mới.
- [ ] **Subtask 2.2**: Kiểm tra trang chi tiết [SeriesDetailPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/lab/SeriesDetailPage.tsx) và [LabWorkspacePage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/lab/LabWorkspacePage.tsx) với slug mới `sql-query-fundamentals`.
  - *Verify Gate*: Điều hướng mượt mà, không gặp lỗi 404 khi truy cập `/series/sql-query-fundamentals` và `/labs/sql-01-select`.

### Task 3: Kiểm Thử Toàn Diện & Nghiệm Thu Hệ Thống (Build Gate)
- [ ] **Subtask 3.1**: Build `MODULE_BE`: `npm --prefix MODULE_BE run build` đạt 0 lỗi.
- [ ] **Subtask 3.2**: Build `MODULE_FE`: `npm --prefix MODULE_FE run build` đạt 0 lỗi.
- [ ] **Subtask 3.3**: Build `MODULE_ADMIN`: `npm --prefix MODULE_ADMIN run build` đạt 0 lỗi.

---

## 2. Cổng Xác Nhận Người Dùng (Human Confirmation Gate)
🛑 **DỪNG LẠI CHỜ LỆNH THỰC THI TỪ BẠN**:
Kế hoạch đã được ghi nhận chi tiết vào External Working Memory. Vui lòng gửi lệnh (ví dụ: *"tiến hành"*, *"làm đi"*, *"chạy đi"*) để bắt đầu thực hiện!
