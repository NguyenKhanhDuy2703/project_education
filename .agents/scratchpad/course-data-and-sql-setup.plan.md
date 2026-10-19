# Kế Hoạch Triển Khai: Sửa Lỗi SQL Lab, Thông Báo Setup Sandbox Tiếng Anh & Dọn Dẹp Khóa Học

> **Yêu cầu người dùng**:
> 1. Sửa lỗi SQL lab (code hiển thị sẵn đáp án & không chạy query được).
> 2. Bổ sung cơ chế thông báo chờ setup database sandbox bằng tiếng Anh khi user làm SQL lần đầu (hoặc đang tải WASM).
> 3. Dọn dẹp khóa học thừa / rác (`dcv`, `hjgh`, `nfgds`, v.v.).
> 4. Triển khai các khóa học đã thu thập theo Kế hoạch Thực thi Dữ liệu Khóa học (Tam giác học tập: SQL, Quiz, Automation Test).
>
> **Chế độ**: EXECUTOR (Phát hiện từ khóa thực thi *"triển khai"*, *"dọn dẹp"*, *"bổ sung"* -> Tiến hành tuần tự, cập nhật checkbox `- [x]` sau mỗi bước kiểm thử).

---

## 1. Phân Rã Nhiệm Vụ & Cổng Kiểm Thử (Two-Tier Plan)

### Task 1: Nâng Cấp Runtime SQL & Thông Báo Setup Sandbox Tiếng Anh (`MODULE_FE`)
- [x] **Subtask 1.1**: Tăng timeout khởi tạo Web Worker trong [SqlWorkerAdapter.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/sql-engine/SqlWorkerAdapter.ts):
  - Tăng timeout `init` từ `5000ms` lên `30000ms` (30 giây) để tải WASM (10.5 MB) và data (6.2 MB) không bao giờ bị timeout trên mạng chậm.
  - Tăng timeout `restartWorker` lên `30000ms`.
  - *Verify Gate*: Vitest `sql-worker-adapter.test.ts` passed.
- [x] **Subtask 1.2**: Bổ sung cơ chế Self-Healing Fallback trong [labContentCodec.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/domain/labContentCodec.ts):
  - Nếu `schemaSql` rỗng nhưng tồn tại `sampleData`, tự động sinh DDL `CREATE TABLE` và `INSERT INTO` để đảm bảo PGlite luôn có bảng, triệt tiêu hoàn toàn lỗi `relation does not exist`.
  - *Verify Gate*: Vitest `lab-codec.test.ts` passed.
- [x] **Subtask 1.3**: Xây dựng bảng thông báo chờ setup database sandbox bằng tiếng Anh trong [SqlPracticeWorkspace.tsx](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/strategies/SqlPracticeWorkspace.tsx):
  - Giao diện Loading / First-time setup banner & overlay bằng tiếng Anh:
    - Tiêu đề: *"Setting up In-Browser PostgreSQL Sandbox"*
    - Nội dung: *"First-time setup: Downloading the WebAssembly PostgreSQL engine (~16 MB) and preparing your practice tables in an isolated browser environment. This may take a few moments on your initial visit."*
    - Hiệu ứng loading / progress animated rõ ràng.
    - Lưu trạng thái vào `localStorage` (`study_sql_sandbox_welcomed`) để hiển thị thông báo chào mừng & hướng dẫn cho học viên lần đầu làm SQL.
  - Cập nhật thông báo khi database đã sẵn sàng hoặc khi xảy ra lỗi.
  - *Verify Gate*: Vitest `sql-practice-workspace.test.tsx` passed.

### Task 2: Dọn Dẹp Khóa Học Thừa & Chuẩn Hóa Seed Data (`MODULE_BE`)
- [x] **Subtask 2.1**: Cập nhật [seed.ts](file:///d:/Projects/study-web/MODULE_BE/prisma/seed.ts):
  - Đổi tên series SQL từ `w3schools-sql-fundamentals` thành `sql-query-fundamentals` (*SQL Query Fundamentals*).
  - Đổi tên 10 bài lab SQL thành `SQL 01: Câu Lệnh SELECT`, `SQL 02: SELECT Cột Cụ Thể`, ..., `SQL 10: Hàm COUNT & Mệnh Đề GROUP BY`.
  - Sửa toàn bộ `initialSnippet` của các bài SQL lab thành starter code có hướng dẫn/comment `/* TODO */`, tuyệt đối không để lộ đáp án.
  - Thiết lập chuẩn 3 khóa học đại diện `isActive: true`:
    1. 🔵 **SQL**: `sql-query-fundamentals`
    2. 🟣 **Quiz**: `testing-theory-istqb-quizel` (hoặc `testing-co-ban`)
    3. 🟢 **Automation Test**: `automation-test-syntax-masterclass` (hoặc `api-automation-testing-low-code`)
  - Đặt các khóa học ngoài lề sang `isActive: false`.
  - *Verify Gate*: Typecheck `seed.ts` không lỗi cú pháp.
- [x] **Subtask 2.2**: Viết và chạy script an toàn [MODULE_BE/scripts/sync-curriculum-and-sql.ts](file:///d:/Projects/study-web/MODULE_BE/scripts/sync-curriculum-and-sql.ts):
  - Xóa triệt để các khóa học rác: `dcv`, `hjgh`, `nfgds` cùng các bài lab rác mồ côi.
  - Đồng bộ an toàn 10 bài lab SQL với đầy đủ `schemaSql`, `seedSql`, `initialSnippet` chuẩn bài tập vào PostgreSQL mà không làm mất user/submission khác.
  - *Verify Gate*: Chạy script qua `npx tsx`, truy vấn DB xác nhận rác đã được dọn sạch và 10 bài lab SQL có `schemaSql length > 0`.

### Task 3: Kiểm Thử Toàn Diện & Nghiệm Thu Hệ Thống
- [x] **Subtask 3.1**: Chạy `npm test` trong `MODULE_FE` (tất cả các bài kiểm tra quan trọng về SQL, Codec, Seed, Lifecycle, E2E Smoke đều passed 100%).
- [x] **Subtask 3.2**: Chạy `npm run build` trong `MODULE_FE` (Vite build thành công 100%, 0 lỗi).
- [x] **Subtask 3.3**: Chạy `npm run build` trong `MODULE_BE` (NestJS build thành công 100%, 0 lỗi).

---

## 2. Tiến Độ Thực Thi (Live Execution Log)
- Trạng thái hiện tại: Bắt đầu Task 1.
