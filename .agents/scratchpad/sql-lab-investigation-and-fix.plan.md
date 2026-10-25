# SQL Lab Bug Investigation & Resolution Plan

> **Status**: SUPERSEDED — replaced by the implemented PGlite sandbox plan, V3 curriculum, and current safe legacy-fixture audit.

> **Yêu cầu người dùng**:
> "kiểm tra lại lab SQL hiện tại code hiển thị sẵn trong ổ nhập và ko chạy query được"
>
> **Tuân thủ giao thức**:
> - Plan-and-Execute Pattern (`.agents/skills/plan-and-execute/SKILL.md`)
> - Human Confirmation Gate (`AGENTS.md`): Phân tích nguyên nhân gốc rễ, lập kế hoạch chi tiết, dừng lại chờ lệnh xác nhận từ người dùng trước khi tiến hành thực thi code.

---

## 1. Kết Quả Kiểm Tra & Nguyên Nhân Gốc Rễ (Root Cause Analysis)

Qua kiểm tra trực tiếp mã nguồn Frontend, Backend và dữ liệu thực tế trong Cơ sở dữ liệu PostgreSQL (`lab` table), chúng tôi đã xác định chính xác 2 nguyên nhân cốt lõi gây ra vấn đề:

### Vấn đề 1: Code hiển thị sẵn toàn bộ đáp án trong ô nhập (`initialSnippet`)
- **Triệu chứng**: Khi vào các bài SQL Lab (ví dụ `w3schools-sql-01-select`), trình soạn thảo Monaco hiển thị sẵn câu lệnh hoàn chỉnh `SELECT * FROM Customers;` thay vì đoạn mã khung/gợi ý (`/* TODO */`).
- **Nguyên nhân**:
  1. Trong Database thực tế và `MODULE_BE/prisma/seed.ts`, trường `initialSnippet` của bài lab 1 được gán cứng bằng chính câu lệnh đáp án: `SELECT * FROM Customers;`.
  2. Tương tự, các bài lab e-commerce analytics (`sql-ecom-revenue-by-customer`, `sql-ecom-having-vip-revenue`) cũng bị gán `initialSnippet` là toàn bộ query hoàn chỉnh thay vì mã khung.
  3. `LabWorkspacePage.tsx` khi tải bài lab sẽ sync `code = normalizedLab.envelope.initialSnippet`, dẫn đến học viên thấy ngay đáp án hoàn chỉnh.

### Vấn đề 2: Không thể chạy query được (`ko chạy query được`)
- **Triệu chứng**: Nhấn nút "Run Query" bị vô hiệu hóa hoặc báo lỗi PGlite / Postgres Error (`relation "customers" does not exist`).
- **Nguyên nhân cốt lõi**:
  1. **Thiếu `schemaSql` và `seedSql` trong Database**:
     - Kiểm tra trực tiếp bảng `lab` trong PostgreSQL cho thấy toàn bộ 12 bài SQL lab có `objective` lưu dạng cũ (2026-10-16): chỉ chứa `summary`, `sampleData`, `expectedQueryResult` mà **hoàn toàn không có `schemaSql` và `seedSql`** (`schemaSql length: 0`).
     - Khi `normalizeLabDetail` giải mã, `schemaSql` và `seedSql` bị rỗng (`""`).
     - Trình chạy Web Worker (`PgEngineCore`) khởi tạo database PGlite trắng tinh (0 bảng, 0 dòng).
     - Khi học viên bấm chạy `SELECT * FROM Customers;`, PostgreSQL văng lỗi:
       `PostgreSQL Error: relation "customers" does not exist`!
  2. **Timeout Khởi Tạo PGlite Quá Ngắn (`5000ms`)**:
     - Trong [SqlWorkerAdapter.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/sql-engine/SqlWorkerAdapter.ts#L181), hàm `initialize()` gọi `this.sendRequest({ type: 'init', ... })` dùng timeout mặc định là `5000ms` (5 giây).
     - Thư viện `@electric-sql/pglite` chạy trong Web Worker cần tải file WASM (`pglite.wasm` 10.5 MB) và file dữ liệu (`pglite.data` 6.2 MB) và biên dịch WebAssembly.
     - Thời gian đo đạc thực tế khi khởi tạo PGlite mất từ 6s - 9s trên máy tính trung bình hoặc lần đầu tải. Khi vượt quá 5s, adapter ném lỗi `Operation init timed out after 5000ms`, kích hoạt cờ `initError` khiến nút **"Run Query" bị disable vĩnh viễn** (`disabled={isRunning || isLoadingSchema || Boolean(initError)}`).
  3. **Thiếu Cơ Chế Tự Phục Hồi (Self-Healing Fallback)**:
     - `normalizeLabDetail` trong [labContentCodec.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/domain/labContentCodec.ts) chưa có cơ chế fallback: nếu bài lab cũ chỉ có `sampleData` mà chưa có `schemaSql`, hệ thống chưa tự động suy luận sinh ra DDL `CREATE TABLE` và `INSERT INTO`.

---

## 2. Kế Hoạch Khắc Phục Chi Tiết (Granular Plan)

### Task 1: Nâng Cấp Runtime & Cơ Chế Phòng Thủ Frontend (`MODULE_FE`)
- [ ] **Subtask 1.1**: Tăng timeout khởi tạo Web Worker trong [SqlWorkerAdapter.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/sql-engine/SqlWorkerAdapter.ts):
  - Tăng timeout của `init` từ `5000ms` lên `30000ms` (30 giây) để đảm bảo trình duyệt tải và biên dịch WASM (10.5MB) an toàn ngay cả trên mạng chậm hoặc cache lạnh.
  - Tăng timeout của `restartWorker` từ `10000ms` lên `30000ms`.
  - *File*: `MODULE_FE/src/features/lab/sql-engine/SqlWorkerAdapter.ts`
  - *Verify*: Chạy vitest `MODULE_FE/src/test/sql-worker-adapter.test.ts`.
- [ ] **Subtask 1.2**: Bổ sung cơ chế Self-Healing Fallback trong [labContentCodec.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/domain/labContentCodec.ts):
  - Nếu `schemaSql` rỗng nhưng tồn tại `sampleData` (mảng đối tượng), tự động sinh câu lệnh `CREATE TABLE <TableName>` (dựa theo keys của object) và `INSERT INTO <TableName>` để PGlite luôn có bảng và dữ liệu chạy thử, ngăn chặn triệt để lỗi `relation does not exist`.
  - *File*: `MODULE_FE/src/features/lab/domain/labContentCodec.ts`
  - *Verify*: Viết unit test trong `MODULE_FE/src/test/lab-codec.test.ts` kiểm chứng việc tự động sinh schema từ sampleData.
- [ ] **Subtask 1.3**: Tinh chỉnh giao diện [SqlPracticeWorkspace.tsx](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/strategies/SqlPracticeWorkspace.tsx):
  - Hiển thị rõ trạng thái schema khi rỗng hoặc đang khởi tạo; bổ sung thông báo trực quan nếu bảng chưa sẵn sàng thay vì để lỗi PostgreSQL mơ hồ.
  - *File*: `MODULE_FE/src/features/lab/strategies/SqlPracticeWorkspace.tsx`
  - *Verify*: Chạy vitest `MODULE_FE/src/test/sql-practice-workspace.test.tsx`.

### Task 2: Chuẩn Hóa Seed Data & Khung Code Khởi Đầu (`MODULE_BE`)
- [ ] **Subtask 2.1**: Cập nhật `initialSnippet` trong [seed.ts](file:///d:/Projects/study-web/MODULE_BE/prisma/seed.ts):
  - `w3schools-sql-01-select`: Sửa từ `SELECT * FROM Customers;` thành:
    ```sql
    -- Viết câu lệnh SQL để truy vấn toàn bộ dữ liệu từ bảng Customers
    SELECT 
    ```
  - `sql-ecom-revenue-by-customer`: Sửa từ câu lệnh giải sẵn thành starter code có comment `/* TODO */`.
  - `sql-ecom-having-vip-revenue`: Sửa từ câu lệnh giải sẵn thành starter code có comment `/* TODO: HAVING */`.
  - Rà soát toàn bộ các bài SQL labs khác để đảm bảo không còn bài nào điền sẵn đáp án.
  - *File*: `MODULE_BE/prisma/seed.ts`
  - *Verify*: `npm --prefix MODULE_BE run build` hoặc dry-run typecheck seed.

### Task 3: Script Đồng Bộ An Toàn Dữ Liệu Thực Tế Trong Database
- [ ] **Subtask 3.1**: Tạo script di chuyển an toàn [scripts/sync-sql-labs.ts](file:///d:/Projects/study-web/MODULE_BE/scripts/sync-sql-labs.ts):
  - Script này **không xóa** database hay submissions, mà chỉ `UPDATE` có chủ đích vào 10 bài SQL lab của series `w3schools-sql-fundamentals`:
    - Cập nhật `objective` chuẩn V2: bổ sung đầy đủ `schemaSql`, `seedSql`, `version: '2.0'`, `statementPolicy: 'read_only'`.
    - Cập nhật `initialSnippet` chuẩn dạng bài tập (không để lộ đáp án).
  - *File*: `MODULE_BE/scripts/sync-sql-labs.ts`
  - *Verify*: Thực thi script bằng `npx tsx`, kiểm tra lại Database xác nhận `schemaSql length > 0` và `initialSnippet` không bị lộ giải pháp.

### Task 4: Kiểm Thử Toàn Diện & Nghiệm Thu Hệ Thống
- [ ] **Subtask 4.1**: Chạy toàn bộ test suite frontend: `npm --prefix MODULE_FE test` (đạt 182+ tests passed).
- [ ] **Subtask 4.2**: Chạy build frontend: `npm --prefix MODULE_FE run build`.
- [ ] **Subtask 4.3**: Chạy build backend: `npm --prefix MODULE_BE run build`.

---

## 3. Cổng Xác Nhận Người Dùng (Human Confirmation Gate)
🛑 **DỪNG LẠI CHỜ LỆNH THỰC THI TỪ BẠN**:
Kế hoạch chi tiết cùng nguyên nhân gốc rễ đã được lập và ghi nhận vào Scratchpad. Vui lòng phản hồi xác nhận (ví dụ: *"tiến hành"*, *"làm luôn"*, *"thực thi"*) để tôi bắt đầu áp dụng các thay đổi!
