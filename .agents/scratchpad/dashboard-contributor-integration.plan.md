# Kế Hoạch Tích Hợp Contributor Vào User Dashboard & Dọn Dẹp Mã Thừa

> **Status**: COMPLETED — checklist 15/15 closed

## Bối Cảnh & Mục Tiêu Kiến Trúc
1. **Mục tiêu**:
   - Tích hợp không gian làm việc của Contributor (quản lý Series, bài Lab, phản hồi kiểm duyệt) trực tiếp vào **User Dashboard** dưới dạng module mở rộng dựa trên quyền (PBAC: `user.isContributor === true`).
   - Tận dụng phong cách thiết kế của Sidebar (`AdminSidebar` style) với tiêu chí: **Sidebar chỉ dùng thuần túy cho Điều hướng (Navigation)**, chia theo các nhóm rõ ràng (`OVERVIEW`, `LEARNING`, `CREATOR`, `ACCOUNT`).
   - Dọn dẹp sạch sẽ mã nguồn thừa, layout dư thừa (`ContributorLayout.tsx`, `ContributorCreatePage.tsx`, các route rác) trước và sau khi tích hợp.
2. **Nguyên tắc**:
   - Tuân thủ Karpathy Coding Guidelines: Simplicity First, Surgical Changes, không drive-by refactoring.
   - Tuân thủ Plan-and-Execute: Quản lý bộ nhớ ngoài, cổng xác nhận người dùng (Human Confirmation Gate), tuần tự qua từng cổng kiểm thử (Verification Gate).

---

## Danh Sách Nhiệm Vụ & Subtasks (Checklist)

### Task 1: Dọn Dẹp Mã Thừa & Dead Code (Cleanup Not Necessary Code)
- [x] **Subtask 1.1**: Xóa bỏ file `ContributorCreatePage.tsx` (dead code, không được sử dụng ở bất kỳ đâu).
  - Target: `MODULE_FE/src/pages/contributor/ContributorCreatePage.tsx`
  - Verification: Kiểm tra không còn reference tới file này trong codebase.
- [x] **Subtask 1.2**: Rà soát và dọn dẹp các import / route dự phòng không cần thiết.
  - Target: `MODULE_FE/src/routes/index.tsx`
  - Verification: Chạy `npm run build` (`tsc -b && vite build`) trong `MODULE_FE` kiểm tra không gãy build.

### Task 2: Xây Dựng Pure Navigation Sidebar & Dashboard Layout
- [x] **Subtask 2.1**: Tạo component `UserSidebar.tsx` kế thừa cấu trúc của `AdminSidebar`:
  - Tiêu đề nhóm: `OVERVIEW`, `LEARNING`, `CREATOR`, `ACCOUNT`.
  - Mục điều hướng: Icon + Label + Active pill xanh dương.
  - Phân quyền hiển thị: Nhóm `CREATOR` chỉ hiển thị khi `user?.isContributor === true` hoặc `user?.role === 'admin'`.
  - Chân Sidebar: Profile mini bar (Avatar, tên, email) + nút Logout.
  - Target: `MODULE_FE/src/pages/dashboard/_components/UserSidebar.tsx`
  - Verification: Unit test giao diện & render responsive (desktop w-60/w-16, mobile drawer).
- [x] **Subtask 2.2**: Tạo `UserDashboardLayout.tsx` bọc các route con dưới `/user/dashboard/*`.
  - Target: `MODULE_FE/src/layouts/UserDashboardLayout.tsx`
  - Verification: Kiểm tra cấu trúc layout với `<Outlet />` bên trong vùng Content.

### Task 3: Tách & Tích Hợp Các Sub-Views Vào Dashboard
- [x] **Subtask 3.1**: Tái cấu trúc trang tổng quan học tập thành `DashboardOverviewView.tsx` (Streak, % hoàn thành, tiến độ theo Series).
  - Target: `MODULE_FE/src/pages/dashboard/views/DashboardOverviewView.tsx`
  - Verification: Hiển thị đúng dữ liệu `getDashboardStats`.
- [x] **Subtask 3.2**: Xây dựng trang `UserProfileView.tsx` phục vụ mục điều hướng `Profile` trong Sidebar (Thông tin tài khoản, SĐT, Email, Badge Free/Pro/Contributor, nút Đăng ký Contributor nếu chưa có).
  - Target: `MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`
  - Verification: Hiển thị đầy đủ thông tin user và tương tác mở đơn đăng ký Contributor.
- [x] **Subtask 3.3**: Di chuyển và tinh gọn bảng quản lý nội dung tác giả thành `UserContentManagementView.tsx` (kế thừa từ `ContributorContentPage.tsx`: Tabs Series, Labs, Search, Filter, Modal Tạo Mới).
  - Target: `MODULE_FE/src/pages/dashboard/views/UserContentManagementView.tsx`
  - Verification: Thao tác tìm kiếm, lọc status, submit bài, mở dialog tạo mới hoạt động trơn tru.
- [x] **Subtask 3.4**: Xây dựng view phản hồi kiểm duyệt `UserReviewFeedbackView.tsx` (danh sách phản hồi `changes_requested`).
  - Target: `MODULE_FE/src/pages/dashboard/views/UserReviewFeedbackView.tsx`
  - Verification: Tải và hiển thị danh sách phản hồi từ backend.
- [x] **Subtask 3.5**: Tạo placeholder/stub view sạch sẽ cho `Saved Series` và `Lab Submissions`.
  - Target: `MODULE_FE/src/pages/dashboard/views/UserSavedSeriesView.tsx`, `UserLabSubmissionsView.tsx`
  - Verification: Điều hướng không bị 404, hiển thị empty state thân thiện.

### Task 4: Cập Nhật Router, Redirects & Loại Bỏ Layout Cũ
- [x] **Subtask 4.1**: Cập nhật `routes/index.tsx`:
  - Đăng ký `UserDashboardLayout` với các sub-routes:
    - `/user/dashboard` -> `DashboardOverviewView`
    - `/user/dashboard/profile` -> `UserProfileView`
    - `/user/dashboard/content` -> `UserContentManagementView`
    - `/user/dashboard/feedback` -> `UserReviewFeedbackView`
    - `/user/dashboard/saved` -> `UserSavedSeriesView`
    - `/user/dashboard/submissions` -> `UserLabSubmissionsView`
  - Cấu hình Redirect 301/replace từ `/contributor/*` sang `/user/dashboard/content` và `/user/dashboard/feedback`.
  - Duy trì route Studio toàn màn hình `/user/dashboard/labs/:labId/edit` trỏ vào `AdminLabStudioPage`.
  - Target: `MODULE_FE/src/routes/index.tsx`
  - Verification: Kiểm tra tất cả route con và redirect hoạt động chính xác.
- [x] **Subtask 4.2**: Cập nhật `Navbar.tsx`: Nút "Contributor Studio" hoặc liên kết trong user menu trỏ vào `/user/dashboard/content`.
  - Target: `MODULE_FE/src/components/layout/Navbar.tsx`
  - Verification: Bấm vào link trên Navbar điều hướng đúng vào User Dashboard Content.
- [x] **Subtask 4.3**: Loại bỏ file layout cũ không còn sử dụng `ContributorLayout.tsx` (379 lines code thừa).
  - Target: Xóa `MODULE_FE/src/layouts/ContributorLayout.tsx`
  - Verification: Xác nhận không còn import `ContributorLayout` trong codebase.

### Task 5: Kiểm Thử Toàn Diện & Verification Gate
- [x] **Subtask 5.1**: Chạy `npm run build` (`tsc -b && vite build`) trong `MODULE_FE` - đảm bảo 0 lỗi TypeScript & 0 lỗi bundling.
- [x] **Subtask 5.2**: Chạy `npm run build` (`nest build`) trong `MODULE_BE` - xác nhận Backend ổn định.
- [x] **Subtask 5.3**: Đối chiếu và tích toàn bộ checklist trong Scratchpad và Artifact.
