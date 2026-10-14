# Contributor Flow Untangling & Practice Lab Studio Redesign

> **Kế hoạch Thực thi & Bộ nhớ làm việc (Execution Plan & Working Memory)**
> Áp dụng giao thức: **Plan-and-Execute Pattern** (`.agents/skills/plan-and-execute/SKILL.md`)
> Trạng thái: **CHỜ DUYỆT (PENDING APPROVAL)**

---

## 1. Phân tích Hiện trạng & Yêu cầu (Context & Requirements)

Người dùng đặt ra 4 câu hỏi/vấn đề về luồng Contributor và gửi kèm bộ đặc tả UX/UI chi tiết cho quy trình tạo Practice Lab:

### Vấn đề 1: Tạo Series xong phải reload trang mới hiển thị
- **Nguyên nhân**: `ContributorCreatePage.tsx` gọi `seriesApi.create()` rồi chuyển trang về `/contributor/series`. Tuy nhiên, `ContributorContentPage.tsx` dùng `useQuery` với `staleTime: 5 phút`, không hề nhận được tín hiệu invalidate hay cập nhật cache/Redux. Do đó TanStack Query trả về cache cũ; chỉ khi F5 reload lại trang thì dữ liệu mới được fetch lại từ server.
- **Giải pháp**: Xây dựng Redux slice `contributor.slice.ts` để lưu trữ trạng thái tác giả và quản lý optimistic update (cập nhật UI ngay lập tức khi submit form), đồng thời gọi `queryClient.setQueryData` và `queryClient.invalidateQueries`.

### Vấn đề 2: Phân biệt Topic vs Series vs Lab (hiện tại nhìn như cùng 1 trang)
- **Kiến trúc dữ liệu phân cấp chuẩn**:
  - **Topic (Chủ đề / Domain Taxonomy)**: Cấp cao nhất (ví dụ: *Tester & QA*, *Database & SQL*, *Backend API*, *DevOps & Docker*). Đóng vai trò phân loại cây thư mục.
  - **Series (Chuyên đề / Lộ trình học)**: Lộ trình gồm nhiều bài lab tuần tự, có độ khó (*Beginner/Intermediate/Advanced*), mô tả và tác giả.
  - **Lab (Bài thực hành tương tác)**: Đơn vị bài tập cụ thể thuộc về 1 Series. Chứa Lý thuyết (Markdown), Starter Code/Query, Test Cases và Solution.
- **Giải pháp UI**: Tách bạch giao diện quản lý trên `ContributorContentPage`:
  - Tab **Topics**: Hiển thị thẻ danh mục taxonomy + thống kê số Series/Labs.
  - Tab **Series**: Danh sách các Series của tác giả kèm số bài Lab bên trong, cấp độ, trạng thái (Draft, Review, Published).
  - Tab **My Labs**: Danh sách các bài lab cụ thể của tác giả, hiển thị thuộc Series nào, loại sandbox và thời lượng.

### Vấn đề 3: Tạo Content nên là Popup Modal thay vì 1 page riêng
- `ContributorCreatePage.tsx` hiện là trang riêng `/contributor/create` gây đứt gãy trải nghiệm.
- **Giải pháp**: Thay thế bằng `CreateContentModal` (Dialog popup) tích hợp ngay tại `ContributorDashboardPage` và `ContributorContentPage`. Cho phép tạo nhanh Series hoặc Topic chỉ với 1 popup gọn gàng.

### Vấn đề 4: Luồng Contributor đang bị lẫn lộn với Admin
- `ContributorCreatePage.tsx` hiện đang có nút "New Lab" trỏ sang `/admin/labs/new` — một route của Admin mà contributor không được phép truy cập.
- **Giải pháp**:
  - Phân định ranh giới rõ ràng:
    - **Contributor**: Tác giả nội dung (Authoring) -> tạo Series, soạn Lab trong **Lab Studio** tại `/contributor/labs/new` hoặc `/contributor/labs/:labId/edit`.
    - **Admin**: Quản trị hệ thống (Governance) -> Duyệt bài tại Review Queue (`/admin/review`), quản lý User, Plans, Audit Logs.
  - Đưa Lab Studio thành module dùng chung, hỗ trợ cả Contributor soạn bài và Admin chỉnh sửa.

### Vấn đề 5: Thiết kế lại toàn diện Quy trình tạo Practice Lab (Lab Studio)
Triển khai đúng 100% bản đặc tả UX/UI gồm:
1. **Step 1: Theory & Guidelines**:
   - Cột trái (~280px): Thông tin chung (Series cha, Loại sandbox, Tiêu đề, Thời lượng, PRO, Checklist hoàn thành).
   - Cột phải chia đôi 50/50: **Markdown Editor** (có toolbar B, I, Code, Table, Link) song song với **Live Preview** (cuộn đồng bộ), template mặc định thông minh theo từng loại bài (JS / SQL / Quizlet).
   - Tự động lưu nháp (Auto-save draft) + hiển thị thời gian lưu.
2. **Step 2: Cấu hình bài tập theo bản chất từng loại**:
   - **Header cố định**: Chỉ còn duy nhất 1 nút `Publish / Gửi duyệt` (kèm tooltip lý do nếu chưa đạt checklist) + nút `Lưu nháp` + `Quay lại`.
   - **JavaScript Worker**:
     - Starter Code có template sẵn.
     - **Test Cases dạng thẻ (Cards)**: Nút `+ Thêm test case`, Mô tả, Input, Expected, nút Ẩn/Hiện, Nhân bản, Xóa, tự sinh script `assert`.
     - Reference Solution.
     - Nút **"▶ Chạy thử"**: Chạy giải pháp với tất cả Test Cases bằng Web Worker ngay trên trình duyệt, báo pass/fail từng thẻ.
   - **SQL**:
     - Tách thành 4 khu vực riêng biệt:
       1. `Schema & Data`: DDL/DML SQL (`CREATE TABLE`, `INSERT`) + nút "Xem dữ liệu" dạng bảng lưới.
       2. `Starter Query`: Editor SQL cho học viên.
       3. `Test Cases dạng thẻ`: Kết quả mong đợi dạng bảng (Grid) + nút **"⚡ Sinh từ Solution"** (chạy câu query mẫu để tự điền kết quả vào bảng).
       4. `Reference Solution`: Query mẫu có nút chạy thử và kiểm tra với toàn bộ test cases.
   - **Quizlet**:
     - Danh sách câu hỏi bên trái (kèm status `✓`, `⚠`, `○`).
     - Soạn câu hỏi ở giữa: hỗ trợ 2-6 đáp án, huy hiệu "✓ Đáp án đúng", giải thích.
     - Preview góc nhìn học viên ở bên phải.
     - Nhập hàng loạt từ Markdown.
     - Xóa câu hỏi có thông báo Undo (5s).
3. **Checklist kiểm duyệt trước khi Publish**: Chặn lỗi sớm nếu chưa đủ tiêu chuẩn.

---

## 2. Kế hoạch Phân rã Nhiệm vụ (Two-Tier Task Decomposition)

### Task 1: Xây dựng Redux Slice & Cơ chế Optimistic Update cho Contributor
- [x] **Subtask 1.1**: Tạo `MODULE_FE/src/stores/slices/contributor.slice.ts` quản lý state danh sách `mySeries`, `myLabs`, trạng thái tạo mới nhanh.
  - *File*: `MODULE_FE/src/stores/slices/contributor.slice.ts`
  - *Verify*: Export đầy đủ actions (`addOptimisticSeries`, `addOptimisticLab`, `setMySeries`, `setMyLabs`).
- [x] **Subtask 1.2**: Đăng ký `contributorReducer` vào `MODULE_FE/src/stores/store.ts`.
  - *File*: `MODULE_FE/src/stores/store.ts`
  - *Verify*: `store.getState().contributor` có mặt trong RootState.
- [x] **Subtask 1.3**: Tích hợp Optimistic Update vào hàm tạo Series: khi bấm tạo, push ngay vào Redux state và `queryClient.setQueryData`, sau đó gọi API lưu xuống Backend và trigger `queryClient.invalidateQueries`.
  - *File*: `MODULE_FE/src/features/lab/api/series.api.ts`, `MODULE_FE/src/pages/contributor/...`
  - *Verify*: Tạo series mới hiển thị ngay lập tức 0ms, không cần reload trang.

### Task 2: Chuyển Tạo Mới thành Popup Modal & Tách bạch Topic - Series - Lab
- [x] **Subtask 2.1**: Tạo component `MODULE_FE/src/pages/contributor/_components/CreateContentDialog.tsx` dạng Dialog popup (Tabs: New Series / New Topic / New Lab).
  - *File*: `MODULE_FE/src/pages/contributor/_components/CreateContentDialog.tsx`
  - *Verify*: Mở popup mượt mà, validate form, đóng modal khi hoàn thành.
- [x] **Subtask 2.2**: Tích hợp nút kích hoạt `CreateContentDialog` trên `ContributorDashboardPage` và `ContributorContentPage`. Chuyển hướng route `/contributor/create` về Content Page kèm mở modal.
  - *File*: `MODULE_FE/src/pages/contributor/ContributorDashboardPage.tsx`, `MODULE_FE/src/routes/index.tsx`
  - *Verify*: Nhấp "+ Create Content" ở bất cứ đâu đều mở popup tại chỗ, không nhảy trang.
- [x] **Subtask 2.3**: Thiết kế lại 3 tab trong `ContributorContentPage.tsx`:
  - **Tab Topics**: Danh thiếp danh mục (Taxonomy Cards) hiển thị icon/màu sắc, mô tả, số series và bài lab thuộc topic.
  - **Tab Series**: Danh sách các Series có badge trạng thái (Draft, Review, Published), cấp độ, số lượng lab bên trong.
  - **Tab My Labs**: Bảng danh sách bài thực hành với tên Series cha, loại bài tập (JS / SQL / Quizlet), thời lượng ước tính.
  - *File*: `MODULE_FE/src/pages/contributor/ContributorContentPage.tsx`
  - *Verify*: Ba tab có cấu trúc trực quan riêng biệt, không còn cảm giác trùng lặp.

### Task 3: Tách bạch Luồng Contributor vs Admin Flow
- [x] **Subtask 3.1**: Cấu hình route Lab Studio cho Contributor: Thêm `/contributor/labs/new` và `/contributor/labs/:labId/edit` vào `MODULE_FE/src/routes/index.tsx`.
  - *File*: `MODULE_FE/src/routes/index.tsx`
  - *Verify*: Contributor truy cập được Lab Studio mà không bị chặn bởi quyền `admin`.
- [x] **Subtask 3.2**: Sửa các đường dẫn trong `ContributorContentPage`, `ContributorDashboardPage` để trỏ về `/contributor/labs/new` thay vì `/admin/labs/new`.
  - *File*: `MODULE_FE/src/pages/contributor/ContributorContentPage.tsx`, `ContributorDashboardPage.tsx`
  - *Verify*: Không còn bất kỳ đường dẫn nào từ Contributor nhảy sang route `/admin`.

### Task 4: Tái cấu trúc Step 1 (Theory & Guidelines) - Bố cục Chia đôi
- [x] **Subtask 4.1**: Tái cấu trúc Step 1 thành 2 cột:
  - Cột trái (~280px, collapsible): Chọn Series cha, Loại Sandbox, Tiêu đề Lab, Thời lượng, PRO badge, Checklist hoàn thành thời gian thực (Title ✓, Series ✓, Lý thuyết ≥ 100 ký tự ✓).
  - Cột phải: **Split view 50/50** với Markdown Editor bên trái và Live Preview bên phải, cuộn đồng bộ.
  - *File*: `MODULE_FE/src/pages/admin/AdminLabStudioPage.tsx`
  - *Verify*: Vừa gõ markdown vừa thấy preview tức thì.
- [x] **Subtask 4.2**: Bổ sung Toolbar Markdown chuẩn (Bold, Italic, Code, Code block, Heading, Table, Link) và Smart Templates theo từng loại bài (JS / SQL / Quizlet).
  - *File*: `MODULE_FE/src/pages/admin/_components/MarkdownEditorWithPreview.tsx`
  - *Verify*: Bấm toolbar chèn đúng cú pháp markdown; template xuất hiện đúng dạng văn bản thật.
- [x] **Subtask 4.3**: Thêm cơ chế tự động lưu nháp (Auto-save draft vào localStorage) và hiển thị chỉ báo "Đã lưu lúc HH:mm".
  - *File*: `MODULE_FE/src/pages/admin/AdminLabStudioPage.tsx`
  - *Verify*: Dữ liệu form tự động lưu, có thông báo và nút khôi phục khi tạo bài lab.

### Task 5: Tái cấu trúc Step 2 (Exercise Builders) theo Bản chất Từng Loại
- [x] **Subtask 5.1**: Thiết kế lại **JavaScript Worker Builder**:
  - Starter Code có template hàm mặc định (`function solution(input) { ... }`).
  - **Test Cases dạng thẻ (Card list)**: Nút `+ Thêm test case`, trường Mô tả, Input, Expected, nút Ẩn/Hiện, Nhân bản, Xóa thẻ. Tự động sinh cú pháp `assert`.
  - Reference Solution có mẫu lời giải.
  - **Nút "▶ Chạy thử"**: Tích hợp chạy Reference Solution với toàn bộ Test Cases trong Web Worker trình duyệt (`useLabWorker`), hiển thị kết quả pass ✓ / fail ✗ trực quan trên từng thẻ.
  - *File*: `MODULE_FE/src/pages/admin/_components/JsWorkerExerciseBuilder.tsx`
  - *Verify*: Bấm "Chạy thử" báo kết quả chính xác, bắt đúng lỗi khi solution sai.
- [x] **Subtask 5.2**: Xây dựng mới hoàn toàn **SQL Exercise Builder**:
  - Tab 1: `Schema & Data` (DDL `CREATE TABLE`, DML `INSERT INTO`) + nút "Xem dữ liệu" dạng bảng lưới.
  - Tab 2: `Starter Query` bằng SQL editor (không yêu cầu viết JS).
  - Tab 3: `Reference Solution` có nút "▶ Chạy thử Solution" và kiểm thử tính hợp lệ.
  - Tab 4: `Test Cases dạng thẻ` với Kết quả mong đợi dạng bảng lưới (Grid) + nút **"⚡ Sinh từ Solution"** (tự động điền dữ liệu mong đợi).
  - *File*: `MODULE_FE/src/pages/admin/_components/SqlExerciseBuilder.tsx`
  - *Verify*: Trải nghiệm hoàn toàn bằng ngôn ngữ SQL, sinh bảng kết quả tự động nhanh chóng.
- [x] **Subtask 5.3**: Nâng cấp **Quizlet Exercise Builder**:
  - Danh sách câu hỏi bên trái có chấm trạng thái (✓ Sẵn sàng, ⚠ Thiếu đáp án đúng, ○ Trống).
  - Khung soạn câu hỏi: 2 đến 6 đáp án, huy hiệu "✓ Đáp án đúng", textarea tự co giãn, hỗ trợ inline code & markdown.
  - Live Preview góc nhìn học viên bên phải.
  - Tính năng xóa câu hỏi có thông báo Toast kèm nút Hoàn tác (Undo 5s).
  - Hỗ trợ nhập hàng loạt từ văn bản Markdown (Bulk import).
  - *File*: `MODULE_FE/src/pages/admin/_components/QuizletExerciseBuilder.tsx`
  - *Verify*: Dễ dàng soạn và quản lý 20-30 câu trắc nghiệm trực quan.
- [x] **Subtask 5.4**: Chuẩn hóa Header cố định & Cổng kiểm tra Pre-publish Checklist:
  - Header trên cùng cố định: `[← Quay lại]` ... `[Lưu nháp]` `[Publish / Submit for Review]`.
  - Chỉ còn DUY NHẤT 1 nút Publish ở header (bỏ nút lặp dưới chân trang).
  - Nút Publish bị vô hiệu hóa kèm tooltip giải thích nếu chưa đạt checklist (chưa có test case, hoặc Reference Solution chưa pass hết test).
  - *File*: `MODULE_FE/src/pages/admin/AdminLabStudioPage.tsx`
  - *Verify*: Ngăn chặn 100% việc publish bài lab lỗi hoặc dữ liệu rác.

### Task 6: Kiểm thử Toàn diện & Nghiệm thu
- [x] **Subtask 6.1**: Chạy `npm run build` ở cả `MODULE_FE` và `MODULE_BE` đảm bảo không có lỗi TypeScript.
- [x] **Subtask 6.2**: Test luồng tạo Series từ Contributor: mở popup -> tạo -> kiểm tra hiển thị tức thì không cần reload.
- [x] **Subtask 6.3**: Test luồng tạo bài Lab (JS, SQL, Quizlet): soạn lý thuyết chia đôi -> cấu hình test -> chạy thử -> kiểm tra checklist -> publish.
