# Kế hoạch Thực thi: Phân quyền Quản lý Thẻ Topic cho Admin & Tối ưu hóa Luồng Gắn Tag cho Contributor

> **Trạng thái**: HOÀN THÀNH (COMPLETED & VERIFIED)  
> **Giao thức**: Plan-and-Execute Pattern (`.agents/skills/plan-and-execute/SKILL.md`)  
> **Kiểm thử**: `MODULE_FE` và `MODULE_BE` build pass 100% 0 errors.

---

## 1. Phân tích Hiện trạng & Yêu cầu (Context & Requirements)

### Hiện trạng
1. **Sidebar Contributor dư thừa & gây hiểu lầm**:
   - Sidebar trước đây có cả 3 mục: `Topics`, `Series`, `My Labs` cùng trỏ về một trang đa tab `ContributorContentPage.tsx`.
   - Contributor không có vai trò tạo danh mục lớn của hệ thống (Topic Taxonomy), việc hiển thị tab tạo Topic ở Contributor làm loãng trải nghiệm và lẫn lộn quyền hạn với Admin.
2. **Khái niệm Topic trong hệ thống**:
   - `Topic` (Chủ đề / Lĩnh vực công nghệ) là **Taxonomy cấp hệ thống** do **Admin** quy định (ví dụ: *Tester & QA*, *Database & SQL*, *Backend API*, *DevOps & Docker*).
   - `Series` (Chuyên đề / Lộ trình học) và `Lab` (Bài thực hành) là **Nội dung cụ thể** do **Contributor** sáng tạo và chỉ cần **gắn thẻ (tag) Topic** phù hợp.

### Yêu cầu người dùng
1. **Gộp lại Sidebar của Contributor**:
   - Xóa bỏ mục `Topics` khỏi Sidebar Contributor.
   - Chỉ giữ các mục tác giả thực sự cần: `Overview`, `Series`, `My Labs`, `Review Feedback`, `Published Content`.
   - Xóa bỏ Tab `Topics` trong `ContributorContentPage.tsx` và xóa Tab "New Topic" trong modal `CreateContentDialog.tsx`.
2. **Chuyển toàn bộ quyền tạo và quản lý Thẻ Topic sang Admin**:
   - Xây dựng giao diện Quản trị Thẻ Topic (Topic Tags Management) trên trang Admin (`AdminContentPage.tsx`).
   - Admin có thể xem danh sách các thẻ topic hệ thống, thêm thẻ topic mới (Tên, mã tag, mô tả, màu sắc) và chỉnh sửa/xóa thẻ.
3. **Contributor chỉ cần gắn Thẻ Topic (Tag) vào Series hoặc Lab**:
   - Trong `CreateContentDialog.tsx` và `SeriesModal.tsx`: Thay dropdown chọn đơn điệu bằng bộ chọn Thẻ Topic dạng Chip/Badge trực quan.
   - Khi tạo Series, tác giả chỉ cần click chọn 1 hoặc nhiều Thẻ Topic có sẵn do Admin cung cấp.
   - Bài Lab tự động kế thừa thẻ Topic từ Series cha và hiển thị huy hiệu thẻ rõ ràng.

---

## 2. Kế hoạch Phân rã Nhiệm vụ (Two-Tier Task Decomposition)

### Task 1: Tinh gọn Sidebar & Giao diện Contributor
- [x] **Subtask 1.1**: Xóa bỏ mục `Topics` khỏi `NAV_ITEMS` trong `MODULE_FE/src/layouts/ContributorLayout.tsx`.
  - *Verify*: Sidebar Contributor chỉ còn `Overview`, `Series`, `My Labs`, `Review Feedback`, `Published Content`.
- [x] **Subtask 1.2**: Tinh chỉnh `MODULE_FE/src/pages/contributor/ContributorContentPage.tsx`:
  - Bỏ tab `Topics`.
  - Giữ lại tab `Series`, `My Labs`, `Feedback`, `Published`.
  - Cập nhật định tuyến route `/contributor/topics` tự động redirect về `/contributor/series`.
  - *Verify*: Giao diện không còn tab Topics, truy cập chuyển hướng mượt mà.
- [x] **Subtask 1.3**: Xóa bỏ Tab `New Topic` trong `MODULE_FE/src/pages/contributor/_components/CreateContentDialog.tsx`.
  - Chỉ giữ 2 tab: `New Series` và `New Lab`.
  - *Verify*: Modal tạo nội dung chỉ tập trung vào Series và Lab.

### Task 2: Chuyển tính năng Quản lý Thẻ Topic sang cho Admin
- [x] **Subtask 2.1**: Tạo component Quản lý Thẻ Topic cho Admin `MODULE_FE/src/pages/admin/_components/AdminTopicTagsModal.tsx`:
  - Hiển thị danh sách các thẻ topic hệ thống (*Tester & QA*, *Database & SQL*, *Backend API*, *DevOps & Docker*...).
  - Form thêm mới Thẻ Topic: Tên thẻ, Mã tag (slug), Mô tả ngắn, Màu sắc đại diện.
  - Chức năng sửa/xóa thẻ topic.
  - *Verify*: Admin có thể thêm mới thẻ topic và xem danh sách trực quan.
- [x] **Subtask 2.2**: Tích hợp nút "Quản lý Thẻ Topic (Topic Tags)" trên Header của `AdminContentPage.tsx`.
  - *Verify*: Admin dễ dàng mở modal/quản lý thẻ từ trang Catalog Oversight.

### Task 3: Tối ưu UI Gắn Thẻ Topic (Topic Tag Selector) cho Contributor
- [x] **Subtask 3.1**: Xây dựng UI chọn thẻ Topic dạng Chip/Tag tương tác trong `CreateContentDialog.tsx`:
  - Hiển thị danh sách các thẻ topic có sẵn dưới dạng Chip/Badge có màu sắc.
  - Contributor nhấp chuột để chọn thẻ topic gắn vào Series mới tạo.
  - *Verify*: Thao tác gắn tag mượt mà, trực quan, không cần gõ tay.
- [x] **Subtask 3.2**: Đồng bộ hiển thị Thẻ Topic (Topic Badge) trên từng Card Series và Bảng My Labs trong `ContributorContentPage.tsx`.
  - *Verify*: Series và bài Lab hiển thị đúng huy hiệu thẻ chủ đề đã gắn.

### Task 4: Kiểm thử Toàn diện & Nghiệm thu
- [x] **Subtask 4.1**: Chạy `npm run build` ở cả `MODULE_FE` và `MODULE_BE` đảm bảo không có lỗi TypeScript.
- [x] **Subtask 4.2**: Kiểm tra luồng Admin: Mở trang Catalog -> Quản lý Thẻ Topic -> Thêm/sửa thẻ topic.
- [x] **Subtask 4.3**: Kiểm tra luồng Contributor: Sidebar gọn gàng -> Mở "+ Create Content" -> Gắn thẻ topic vào Series -> Kiểm tra Series hiển thị thẻ tag.
