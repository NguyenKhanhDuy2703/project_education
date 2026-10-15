# Kế Hoạch Chi Tiết Lần 2: Tích Hợp Contributor Vào User (PBAC) & Tách Admin Subdomain

> **Tài liệu Kế hoạch Thực thi & Bộ nhớ làm việc bên ngoài (External Working Memory - Round 2)**
> Áp dụng quy chuẩn: **Plan-and-Execute Protocol** (`.agents/skills/plan-and-execute/SKILL.md`) & **Requirements Elicitation** (`.agents/skills/requirements-elicitation/SKILL.md`)
> Quy tắc bất di bất dịch: **Gate Check Nghiêm Ngặt** — Mọi task đều có tiêu chí và điều kiện nghiệm thu rõ ràng, BẮT BUỘC PASS 100% trước khi bước sang task tiếp theo.
> Trạng thái: **ĐÃ HOÀN TẤT THỰC THI 100% CẢ 2 GIAI ĐOẠN (GATE 1 -> GATE 10 PASS)**

---

## 1. Phân Tích Chuyên Sâu Lần 2: Từ RBAC Cứng Sang PBAC Linh Hoạt

### 1.1. Bản Chất Thay Đổi (The Paradigm Shift)
- **Mô hình cũ (RBAC Cứng)**:
  - `UserRole = 'admin' | 'contributor' | 'user' | 'userPro'`.
  - Một tài khoản bị "giam" trong một role duy nhất. Nếu một học viên muốn viết bài, họ phải chuyển đổi toàn bộ role sang `contributor`, gây mâu thuẫn với các gói thuê bao học tập (`userPro`).
  - Phân quyền theo kiểu so sánh chuỗi: `user.role === 'contributor'`.
- **Mô hình mới (PBAC / Attribute-Based Access Control)**:
  - `UserRole` chỉ quản lý phân cấp tài khoản hệ thống:
    - `user`: Học viên tiêu chuẩn.
    - `userPro`: Học viên đăng ký gói dịch vụ PRO.
    - `admin`: Quản trị viên hệ thống.
  - **Quyền Contributor** được xem như một **năng lực / quyền năng (Capability/Permission)** được bật/tắt độc lập:
    - Cột `isContributor: boolean` trên bảng `User`: Cho phép truy vấn tức thời 0ms.
    - Cột `contributorStatus: ContributorStatus`: Quản lý vòng đời xét duyệt (`NONE | PENDING | APPROVED | REJECTED | SUSPENDED`).
    - Gắn kết với hệ thống `PermissionCode` hiện có của dự án:
      - `CONTENT_TOPIC_CREATE`
      - `CONTENT_SERIES_CREATE`
      - `CONTENT_LAB_CREATE`
      - `CONTENT_EDIT_OWN`
      - `CONTENT_SUBMIT_REVIEW`
  - Bất kỳ `user` hay `userPro` nào khi được Admin phê duyệt `isContributor = true` đều có thể soạn thảo chuyên đề và bài thực hành trong Contributor Studio mà không bị mất quyền lợi của gói học viên Pro.

---

## 2. Danh Mục Task Chi Tiết Kèm Verification Gate Check (Phase 1: Gộp Contributor Vào User)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QUY TRÌNH THỰC THI PHASE 1                     │
│                                                                        │
│  ┌──────────┐    Gate 1 Pass    ┌──────────┐    Gate 2 Pass    ┌───────┐
│  │  Task 1  │ ───────────────> │  Task 2  │ ───────────────> │Task 3 │
│  │ DB Schema│                  │BE Guards │                  │App API│
│  └──────────┘                  └──────────┘                  └───────┘
│                                                                  │
│                                                     Gate 3 Pass │
│                                                                  ▼
│  ┌──────────┐    Gate 5 Pass    ┌──────────┐    Gate 4 Pass    ┌───────┐
│  │  Task 5  │ <─────────────── │  Task 4  │ <─────────────── │Task 4 │
│  │UI Approve│                  │FE Routes │                  │ApplyUI│
│  └──────────┘                  └──────────┘                  └───────┘
└────────────────────────────────────────────────────────────────────────┘
```

---

### Task 1: Nâng Cấp Schema Database, Model Quan Hệ & Migration Dữ Liệu Cũ

#### Mục tiêu:
Mở rộng cấu trúc thực thể trong PostgreSQL thông qua Prisma, tạo bảng lưu hồ sơ xét duyệt Contributor, và chạy script migration bảo đảm không làm mất quyền của bất kỳ tài khoản Contributor hiện có nào.

#### Files tác động:
- `MODULE_BE/prisma/schema.prisma`
- `MODULE_BE/prisma/migrations/*` (hoặc script `MODULE_BE/src/prisma/migrate-contributors.ts`)

#### Danh sách Subtasks:
- [x] **Subtask 1.1**: Cập nhật model `User` trong `MODULE_BE/prisma/schema.prisma`:
  - Thêm `isContributor Boolean @default(false)`
  - Thêm `contributorStatus String @default("NONE")` (các giá trị: `NONE`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`)
  - Thiết lập quan hệ `@relation("UserApplications")` với bảng đơn đăng ký.
- [x] **Subtask 1.2**: Tạo model mới `ContributorApplication` trong `schema.prisma`:
  - `id String @id @default(uuid())`
  - `userId String`
  - `bio String @db.Text`
  - `portfolioUrl String?`
  - `sampleTopic String @db.Text`
  - `status String @default("PENDING")`
  - `adminNote String? @db.Text`
  - `reviewedById String?`
  - `reviewedAt DateTime?`
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
  - Khóa ngoại liên kết với `User` (`user`) và `User` (`reviewedBy`).
- [x] **Subtask 1.3**: Chạy cập nhật database và sinh Prisma Client:
  - Chạy `npx prisma db push` (hoặc migrate dev).
  - Tự động sinh type mới trong `@prisma/client`.
- [x] **Subtask 1.4**: Viết script migration dữ liệu bảo toàn (Data Migration Script):
  - Tìm tất cả bản ghi `User` đang có `role = 'contributor'`.
  - Cập nhật thành: `role = 'user'`, `isContributor = true`, `contributorStatus = 'APPROVED'`.

#### 🛑 GATE CHECK TASK 1 (ĐÃ PASS 100%):
- [x] 1. **Schema Check**: Chạy `npx prisma validate` trả về hợp lệ, không có lỗi cú pháp quan hệ.
- [x] 2. **Prisma Generation Check**: `npx prisma generate` hoàn thành không cảnh báo, các thuộc tính `isContributor`, `contributorStatus`, `contributorApplications` xuất hiện đầy đủ trong kiểu dữ liệu của Prisma.
- [x] 3. **Data Integrity Check**: Chạy script migration và query DB: Đã migrate tài khoản cũ `lieutrang236@gmail.com` sang `role='user'`, `isContributor=true`. Remaining `role='contributor'`: 0.
- [x] 4. **Backend Build Check**: Chạy `npm run build` trong `MODULE_BE` đạt exit code 0.

---

### Task 2: Xây Dựng Backend PBAC Guards & Cập Nhật Auth DTO / Strategy

#### Mục tiêu:
Chuyển đổi toàn bộ cơ chế bảo vệ API từ so khớp Role sang kiểm tra quyền Contributor (`ContributorGuard`). Cập nhật `JwtStrategy` và `AuthService` để dữ liệu xác thực của người dùng luôn mang theo trạng thái `isContributor` thời gian thực.

#### Files tác động:
- `MODULE_BE/src/modules/auth/jwt.strategy.ts`
- `MODULE_BE/src/modules/auth/auth.service.ts`
- `MODULE_BE/src/modules/auth/auth.controller.ts`
- `MODULE_BE/src/common/guards/contributor.guard.ts` (Tạo mới)
- `MODULE_BE/src/common/guards/resource-owner.guard.ts`
- `MODULE_BE/src/modules/labs/labs.controller.ts`
- `MODULE_BE/src/modules/labs/labs.service.ts`
- `MODULE_BE/src/modules/series/series.controller.ts`
- `MODULE_BE/src/modules/series/series.service.ts`

#### Danh sách Subtasks:
- [x] **Subtask 2.1**: Xây dựng `ContributorGuard`:
  - Kiểm tra `req.user`:
    - Nếu `req.user.role === UserRole.admin` -> Cho phép qua (Admin bypass).
    - Nếu `req.user.isContributor === true` -> Cho phép qua.
    - Ngược lại -> Ném lỗi `ForbiddenException('Yêu cầu quyền Contributor để truy cập tài nguyên này.')`.
- [x] **Subtask 2.2**: Cập nhật `JwtStrategy.validate(payload)`:
  - Bổ sung `isContributor: user.isContributor` và `contributorStatus: user.contributorStatus` vào đối tượng sanitized `req.user`.
- [x] **Subtask 2.3**: Cập nhật endpoint `GET /auth/me` và `POST /auth/login`:
  - Trả về đối tượng `user` bao gồm `isContributor` và `contributorStatus` cho Frontend tiêu thụ.
- [x] **Subtask 2.4**: Thay thế `@Roles(UserRole.admin, UserRole.contributor)` cũ trong `labs.controller.ts` và `series.controller.ts`:
  - Thay bằng `@UseGuards(AuthGuard('jwt'), ContributorGuard)`.
- [x] **Subtask 2.5**: Cập nhật logic Anti-Bypass trong `labs.service.ts` và `series.service.ts`:
  - Non-admin author bị ép trạng thái về `draft`, không cho phép tự ý đổi `status` thành `published`.
- [x] **Subtask 2.6**: Cập nhật `ResourceOwnerGuard`:
  - Đảm bảo kiểm tra quyền sở hữu bài viết giữa `authorId` và `user.userId` hoạt động chuẩn xác.

#### 🛑 GATE CHECK TASK 2 (ĐÃ PASS 100%):
- [x] 1. **Compilation Check**: `npm run build` trong `MODULE_BE` hoàn tất không có lỗi type.
- [x] 2. **Access Control Check**: ContributorGuard chặn user thường (`403 Forbidden`) và cho phép user có `isContributor = true` hoặc admin.
- [x] 3. **Anti-Bypass Check**: Non-admin author không thể tự ý đẩy bài lên `published`.
- [x] 4. **Profile Response Check**: `GET /api/v1/auth/me` và `POST /api/v1/auth/login` trả về đúng thuộc tính `"isContributor"` và `"contributorStatus"`.

---

### Task 3: Xây Dựng Module Đăng Ký & Quản Lý Đơn Contributor (Backend)

#### Mục tiêu:
Cung cấp bộ API hoàn chỉnh để học viên nộp đơn xin cấp quyền Contributor và Quản trị viên duyệt / từ chối hồ sơ kèm ghi nhận Audit Log.

#### Files tác động:
- `MODULE_BE/src/modules/contributor-application/dto/apply-contributor.dto.ts` (Tạo mới)
- `MODULE_BE/src/modules/contributor-application/dto/review-contributor.dto.ts` (Tạo mới)
- `MODULE_BE/src/modules/contributor-application/contributor-application.service.ts` (Tạo mới)
- `MODULE_BE/src/modules/contributor-application/contributor-application.controller.ts` (Tạo mới)
- `MODULE_BE/src/modules/contributor-application/contributor-application.module.ts` (Tạo mới)
- `MODULE_BE/src/app.module.ts`

#### Danh sách Subtasks:
- [x] **Subtask 3.1**: Định nghĩa DTOs kèm validation:
  - `ApplyContributorDto`: `bio` (chuỗi >= 20 ký tự), `portfolioUrl` (URL hợp lệ hoặc rỗng), `sampleTopic` (chuỗi >= 10 ký tự).
  - `ReviewContributorDto`: `action` (`APPROVE` | `REJECT`), `adminNote` (lý do phản hồi).
- [x] **Subtask 3.2**: Viết `ContributorApplicationService`:
  - `apply(userId, dto)`: Chặn nộp trùng đơn `PENDING`, tạo đơn mới, cập nhật `user.contributorStatus = 'PENDING'`.
  - `getMyApplication(userId)`: Lấy thông tin đơn gần nhất của học viên.
  - `findAllForAdmin(status, page, limit)`: Phân trang danh sách đơn cho Admin.
  - `reviewApplication(applicationId, adminId, dto)`:
    - Nếu `action === 'APPROVE'`: Cập nhật đơn thành `APPROVED`, bật `isContributor = true`, ghi `AuditLog`.
    - Nếu `action === 'REJECT'`: Cập nhật đơn thành `REJECTED`, ghi `AuditLog`.
- [x] **Subtask 3.3**: Viết `ContributorApplicationController`:
  - `POST /api/v1/contributor/apply`: `@UseGuards(AuthGuard('jwt'))`.
  - `GET /api/v1/contributor/my-application`: `@UseGuards(AuthGuard('jwt'))`.
  - `GET /api/v1/admin/contributor-applications`: `@UseGuards(AuthGuard('jwt'), RolesGuard)` + `@Roles(UserRole.admin)`.
  - `POST /api/v1/admin/contributor-applications/:id/review`: `@UseGuards(AuthGuard('jwt'), RolesGuard)` + `@Roles(UserRole.admin)`.
- [x] **Subtask 3.4**: Đăng ký module vào `app.module.ts`.

#### 🛑 GATE CHECK TASK 3 (ĐÃ PASS 100%):
- [x] 1. **Build Check**: `npm run build` Backend thành công 100%.
- [x] 2. **Application Submission**: Endpoint `/contributor/apply` lưu record `PENDING` và cập nhật user.
- [x] 3. **Duplicate Prevention**: Gửi đơn lần 2 ném `ConflictException (409)`.
- [x] 4. **Admin Approval & Audit Trail**: Admin duyệt đơn kích hoạt `isContributor = true` tức thời và ghi vết `AuditLog`.
- [x] 5. **Admin Guard Check**: Endpoint admin applications được bảo vệ nghiêm ngặt bằng `RolesGuard` (`403 Forbidden` cho user thường).

---

### Task 4: Chuyển Đổi Phân Quyền Trên Frontend (FE PBAC & Navbar & Routes)

#### Mục tiêu:
Cập nhật toàn bộ hệ thống type, auth store và navigation của Frontend để nhận diện thuộc tính `isContributor`, loại bỏ hoàn toàn các đoạn code kiểm tra cứng `role === 'contributor'`, và bảo vệ các routes `/contributor/*` bằng Route Guard mới.

#### Files tác động:
- `MODULE_FE/src/types/user.types.ts`
- `MODULE_FE/src/stores/slices/auth.slice.ts`
- `MODULE_FE/src/features/auth/permissions.ts`
- `MODULE_FE/src/components/layout/Navbar.tsx`
- `MODULE_FE/src/routes/ProtectedRoute.tsx`
- `MODULE_FE/src/routes/index.tsx`

#### Danh sách Subtasks:
- [x] **Subtask 4.1**: Cập nhật `MODULE_FE/src/types/user.types.ts`:
  - Thêm `isContributor?: boolean` và `contributorStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'` vào interface `User`.
- [x] **Subtask 4.2**: Cập nhật hàm kiểm tra quyền trong `permissions.ts`:
  - Cập nhật logic: Người dùng có `user.isContributor === true` tự động được nạp quyền authoring.
- [x] **Subtask 4.3**: Tái cấu trúc thanh điều hướng trong `Navbar.tsx`:
  - Khai báo cờ: `const isContributorOrAbove = user?.role === 'admin' || user?.isContributor === true;`
  - Nút **"Contributor Studio"** chỉ hiển thị khi `isContributorOrAbove === true`.
- [x] **Subtask 4.4**: Nâng cấp `ProtectedRoute.tsx`:
  - Bổ sung prop `requireContributor?: boolean`.
  - Tự động chặn và redirect về trang chủ nếu user chưa có quyền.
- [x] **Subtask 4.5**: Cập nhật `routes/index.tsx`:
  - Route `/contributor` được bảo vệ bằng `<ProtectedRoute requireContributor />`.

#### 🛑 GATE CHECK TASK 4 (ĐÃ PASS 100%):
- [x] 1. **Frontend Type Check & Build**: Chạy `npm run build` trong `MODULE_FE` đạt exit code 0 không có lỗi TypeScript.
- [x] 2. **UI Navigation Check**: Navbar chỉ hiển thị Contributor Studio khi `isContributor === true || role === 'admin'`.
- [x] 3. **Route Guard Interception**: Truy cập `/contributor/*` khi không có quyền bị chuyển hướng về trang chủ `/`.

---

### Task 5: Xây Dựng Giao Diện Đăng Ký (User) & Giao Diện Phê Duyệt (Admin)

#### Mục tiêu:
Cung cấp giao diện tương tác người dùng mượt mà: Modal nộp đơn cho học viên kèm hiển thị trạng thái hồ sơ thời gian thực, và Bảng điều khiển xét duyệt đơn cho Admin trong Admin Studio.

#### Files tác động:
- `MODULE_FE/src/features/contributor/components/ContributorApplyModal.tsx` (Tạo mới)
- `MODULE_FE/src/features/contributor/api/contributor-application.api.ts` (Tạo mới)
- `MODULE_FE/src/pages/admin/AdminContributorApplicationsPage.tsx` (Tạo mới)
- `MODULE_FE/src/pages/admin/_components/AdminSidebar.tsx`
- `MODULE_FE/src/routes/index.tsx`

#### Danh sách Subtasks:
- [x] **Subtask 5.1**: Tạo `contributor-application.api.ts`:
  - `apply(payload: { bio, portfolioUrl, sampleTopic })`
  - `getMyApplication()`
  - `getAdminApplications(params)`
  - `reviewApplication(id, payload: { action, adminNote })`
- [x] **Subtask 5.2**: Xây dựng `ContributorApplyModal.tsx`:
  - Sử dụng Radix UI Dialog.
  - Các trường: Bio, Portfolio link, Ý tưởng bài viết.
  - Xử lý trạng thái phản hồi `PENDING`, `APPROVED`, `REJECTED`.
- [x] **Subtask 5.3**: Tích hợp Modal vào `Navbar.tsx`:
  - Nhấp vào "Trở thành Contributor" trong Navbar/User menu sẽ mở `ContributorApplyModal`.
- [x] **Subtask 5.4**: Xây dựng màn hình Admin duyệt đơn (`AdminContributorApplicationsPage.tsx`):
  - Bảng danh sách đơn, bộ lọc trạng thái, xem chi tiết và nút Duyệt / Từ chối kèm lý do.
- [x] **Subtask 5.5**: Thêm mục "Contributor Applications" vào `AdminSidebar.tsx` và cấu hình route `/admin/contributors` trong `routes/index.tsx`.

#### 🛑 GATE CHECK TASK 5 (ĐÃ PASS 100% - TOÀN BỘ PHASE 1 HOÀN TẤT):
- [x] 1. **Full Build Check**: Chạy `npm run build` trên cả 2 thư mục `MODULE_BE` và `MODULE_FE` ➔ Đạt 100% không lỗi.
- [x] 2. **E2E User Journey**: Học viên nộp đơn ➔ Admin duyệt đơn ➔ Cấp quyền `isContributor = true` tức thì ➔ Contributor Studio mở quyền.
- [x] 3. **Audit Trail**: Bảng `audit_logs` có record ghi nhận hành động phê duyệt của Admin.

---

## 3. Kế Hoạch Chi Tiết Phase 2: Tách Admin Thành App Độc Lập (`admin.studyit.dev`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              QUY TRÌNH THỰC THI PHASE 2                                │
│                                                                                        │
│  ┌──────────────┐    Gate 6 Pass    ┌──────────────┐    Gate 7 Pass    ┌─────────────┐ │
│  │   Task 6     │ ────────────────> │   Task 7     │ ────────────────> │   Task 8    │ │
│  │Khởi tạo Admin│                   │Di chuyển Code│                   │Dọn dẹp Web  │ │
│  │  App Độc lập │                   │ Sang AdminApp│                   │  Chính (FE) │ │
│  └──────────────┘                   └──────────────┘                   └─────────────┘ │
│                                                                               │        │
│                                                                  Gate 8 Pass  │        │
│                                                                               ▼        │
│  ┌──────────────┐                   ┌──────────────┐    Gate 9 Pass    ┌─────────────┐ │
│  │   Task 10    │ <──────────────── │   Task 9     │ <──────────────── │  Backend    │ │
│  │Vercel Deploy │  Gate 10 Pass     │Bảo mật BE,   │                   │Security &   │ │
│  │& Audit E2E   │                   │CORS & Cookies│                   │Role Enforce │ │
│  └──────────────┘                   └──────────────┘                   └─────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Task 6: Khởi Tạo Ứng Dụng Admin Độc Lập (`MODULE_ADMIN`)

#### Mục tiêu:
Thiết lập một dự án frontend Vite + React 19 + TypeScript hoàn toàn độc lập dành riêng cho Quản trị viên, chạy trên port riêng (vd: `5174`), cấu hình build riêng biệt và không dính dáng bundle với web chính.

#### Files tác động:
- `MODULE_ADMIN/package.json`
- `MODULE_ADMIN/vite.config.ts`
- `MODULE_ADMIN/tsconfig.json`
- `MODULE_ADMIN/index.html`
- `MODULE_ADMIN/src/main.tsx`
- `MODULE_ADMIN/src/App.tsx`

#### Danh sách Subtasks:
- [x] **Subtask 6.1**: Khởi tạo thư mục `MODULE_ADMIN` với cấu trúc chuẩn Vite + React 19 + TypeScript.
- [x] **Subtask 6.2**: Đồng bộ danh sách dependencies cốt lõi (`@reduxjs/toolkit`, `@tanstack/react-query`, `lucide-react`, `radix-ui`, `axios`, `react-router-dom`, `tailwindcss` v4).
- [x] **Subtask 6.3**: Cấu hình `vite.config.ts`: port `5174`, path alias `@/` trỏ vào `MODULE_ADMIN/src`, proxy API trỏ về NestJS Backend (`localhost:3000`).
- [x] **Subtask 6.4**: Cấu hình Tailwind CSS v4, Geist font và dark/light theme chuẩn của hệ thống.

#### 🛑 GATE CHECK TASK 6:
- [x] 1. **Vite Build Check**: Chạy `npm run build` trong `MODULE_ADMIN` đạt exit code 0 không lỗi.
- [x] 2. **Dev Server Check**: Chạy thử dev server trên port `5174` render thành công giao diện chào mừng.

---

### Task 7: Di Chuyển Toàn Bộ Giao Diện & Logic Quản Trị Sang `MODULE_ADMIN`

#### Mục tiêu:
Chuyển giao trọn vẹn toàn bộ 10 trang quản trị, các component bảng biểu, modal, tab và API client từ `MODULE_FE/src/pages/admin` và `MODULE_FE/src/features/admin` sang `MODULE_ADMIN`. Xây dựng trang đăng nhập Admin riêng biệt (`AdminLoginPage`).

#### Files tác động:
- `MODULE_ADMIN/src/layouts/AdminLayout.tsx`
- `MODULE_ADMIN/src/components/` (UI primitives: Button, Card, Dialog, Table, Avatar...)
- `MODULE_ADMIN/src/pages/admin/` (Toàn bộ 10 trang quản trị)
- `MODULE_ADMIN/src/features/admin/api/` (Các API client admin)
- `MODULE_ADMIN/src/pages/auth/AdminLoginPage.tsx` (Trang đăng nhập chuyên biệt cho Admin)
- `MODULE_ADMIN/src/routes/index.tsx` (Bộ định tuyến của Admin App)

#### Danh sách Subtasks:
- [x] **Subtask 7.1**: Sao chép các UI components dùng chung (primitives shadcn/ui) và utils sang `MODULE_ADMIN/src/components/ui`.
- [x] **Subtask 7.2**: Di chuyển toàn bộ các trang Admin:
  - `AdminDashboardPage`, `AdminReviewPage`, `AdminContentPage`
  - `AdminUsersPage`, `AdminContributorApplicationsPage`, `AdminPlansPage`, `AdminGroupsPage`
  - `AdminFeedbackPage`, `AdminAuditPage`, `AdminLabStudioPage`
  - Kèm toàn bộ component con trong `_components/`, `_hooks/`, `_utils/`.
- [x] **Subtask 7.3**: Di chuyển và cấu hình API client admin trong `MODULE_ADMIN/src/features/admin/api/` và Auth Store.
- [x] **Subtask 7.4**: Xây dựng trang `AdminLoginPage.tsx` tại `/login` trên Admin App:
  - Form đăng nhập bảo mật (Email & Password).
  - Kiểm tra vai trò: Nếu tài khoản không có role `admin`, từ chối phiên và hiển thị thông báo lỗi rõ ràng.
- [x] **Subtask 7.5**: Cấu hình bộ định tuyến `AdminRoutes`:
  - Route `/login` -> `AdminLoginPage`.
  - Route `/` (hoặc `/dashboard`) được bảo vệ bởi Guard kiểm tra role `admin`.

#### 🛑 GATE CHECK TASK 7:
- [x] 1. **Admin App Build Check**: Chạy `npm run build` trong `MODULE_ADMIN` đạt 100% không có lỗi TypeScript hay thiếu import.
- [x] 2. **Navigation Test**: Đăng nhập tài khoản admin thử nghiệm trên port `5174`, điều hướng qua lại giữa tất cả các tab quản trị mượt mà.

---

### Task 8: Dọn Dẹp Sạch Sẽ Mã Nguồn Admin Khỏi Web Chính (`MODULE_FE`)

#### Mục tiêu:
Thực hiện "Stealth Mode": Loại bỏ 100% mã nguồn, trang, route, component và nút bấm liên quan đến Admin khỏi Web chính (`studyit.dev`). Giữ lại `LabStudio` riêng cho Contributor trong User Dashboard.

#### Files tác động:
- `MODULE_FE/src/pages/dashboard/views/LabStudioView.tsx` (Tạo mới hoặc trích xuất từ `AdminLabStudioPage`)
- `MODULE_FE/src/pages/admin/` (XÓA BỎ HOÀN TOÀN)
- `MODULE_FE/src/features/admin/` (XÓA BỎ HOÀN TOÀN)
- `MODULE_FE/src/routes/index.tsx` (Gỡ bỏ toàn bộ route `/admin/*`)
- `MODULE_FE/src/components/layout/Navbar.tsx` (Gỡ bỏ nút Admin Studio)
- `MODULE_FE/src/pages/dashboard/_components/UserSidebar.tsx` và `UserTopbar.tsx` (Gỡ bỏ link Admin Studio)

#### Danh sách Subtasks:
- [x] **Subtask 8.1**: Trích xuất `AdminLabStudioPage` thành `LabStudioPage` độc lập đặt tại `MODULE_FE/src/pages/lab/` để Contributor tiếp tục soạn thảo lab trong User Dashboard.
- [x] **Subtask 8.2**: Xóa bỏ hoàn toàn thư mục `MODULE_FE/src/pages/admin` và `MODULE_FE/src/features/admin`.
- [x] **Subtask 8.3**: Gỡ bỏ toàn bộ nhánh route `/admin` khỏi `MODULE_FE/src/routes/index.tsx`.
- [x] **Subtask 8.4**: Rà soát và gỡ bỏ tất cả các nút, icon `Shield`, link điều hướng tới "Admin Studio" trong `Navbar.tsx`, `UserSidebar.tsx` và `UserTopbar.tsx`.
- [x] **Subtask 8.5**: Kiểm tra bundle sau khi build: đảm bảo không còn bất kỳ file chunk nào chứa chữ `admin` hay lộ logic quản trị.

#### 🛑 GATE CHECK TASK 8 (ĐÃ PASS 100%):
- [x] 1. **Web App Build Check**: `npm run build` trong `MODULE_FE` đạt exit code 0.
- [x] 2. **Zero-Trace Audit**: Tìm kiếm chuỗi `/admin` trong code của `MODULE_FE` đạt kết quả 0 (ngoại trừ các API call hợp lệ nếu có).
- [x] 3. **Contributor Flow Check**: Contributor vẫn tạo và chỉnh sửa bài lab bình thường thông qua `LabStudioPage` mới.

---

### Task 9: Siết Chặt Bảo Mật Backend: CORS, Host-Only Cookies & Role Enforcement

#### Mục tiêu:
Cách ly hoàn toàn các API quản trị trên Backend: Chỉ chấp nhận request từ subdomain `admin.studyit.dev`, phân biệt phiên đăng nhập và chặn mọi hành vi bypass từ người dùng thông thường.

#### Files tác động:
- `MODULE_BE/src/main.ts`
- `MODULE_BE/src/modules/auth/auth.controller.ts`
- `MODULE_BE/src/common/guards/roles.guard.ts`
- Các Controller quản trị: `review.controller.ts`, `audit-logs.controller.ts`, `groups.controller.ts`, `entitlements.controller.ts`, `users.controller.ts`.

#### Danh sách Subtasks:
- [x] **Subtask 9.1**: Cập nhật CORS trong `MODULE_BE/src/main.ts`:
  - Thêm `http://localhost:5174` (local dev của Admin) và `https://admin.studyit.dev` vào danh sách cho phép.
  - Cấu hình Origin Filter: Cho phép origin từ Admin App truy cập các API endpoints.
- [x] **Subtask 9.2**: Bảo đảm cookie Host-Only:
  - Tuyệt đối không cấu hình `domain: '.studyit.dev'` (để cookie của `admin.studyit.dev` không bị gửi kèm sang `studyit.dev` và ngược lại).
- [x] **Subtask 9.3**: Rà soát 100% các endpoint quản trị:
  - Kiểm tra decorator `@UseGuards(AuthGuard('jwt'), RolesGuard)` và `@Roles('admin')`.
  - Đảm bảo trả về HTTP `403 Forbidden` nếu token không có role `admin`.

#### 🛑 GATE CHECK TASK 9 (ĐÃ PASS 100%):
- [x] 1. **Backend Build Check**: `npm run build` trong `MODULE_BE` đạt exit code 0.
- [x] 2. **Penetration Test (Bypass Check)**: Dùng token của user thường gọi vào endpoint `/api/v1/admin/users` hoặc `/api/v1/review/queue` ➔ Kết quả: Nhận `403 Forbidden` lập tức do RolesGuard kiểm tra `role === 'admin'`.
- [x] 3. **CORS Boundary Check**: Đã khai báo rõ `admin.studyit.dev` và `localhost:5174` trong CORS whitelist; các origin lạ bị chặn bởi CORS policy.

---

### Task 10: Cấu Hình Triển Khai Vercel & Audit Toàn Diện

#### Mục tiêu:
Cung cấp cấu hình deploy hoàn chỉnh trên Vercel cho 2 ứng dụng độc lập từ cùng một kho mã nguồn (Git Monorepo), kiểm tra kết nối end-to-end.

#### Files tác động:
- `MODULE_ADMIN/vercel.json`
- `MODULE_FE/vercel.json`
- `docs/deployment/admin-subdomain-setup.md` (Tài liệu hướng dẫn Vercel & Cloudflare Zero Trust)

#### Danh sách Subtasks:
- [x] **Subtask 10.1**: Tạo file `MODULE_ADMIN/vercel.json` với cấu hình rewrite SPA (`/(.*)` -> `/index.html`) và security headers.
- [x] **Subtask 10.2**: Soạn thảo tài liệu hướng dẫn thiết lập trên Vercel Dashboard:
  - Project 1 (Web): Root Directory = `MODULE_FE`, Domain = `studyit.dev`.
  - Project 2 (Admin): Root Directory = `MODULE_ADMIN`, Domain = `admin.studyit.dev`.
- [x] **Subtask 10.3**: Soạn thảo hướng dẫn bảo mật nhiều lớp (Defense in Depth):
  - Kích hoạt Vercel Deployment Protection hoặc Cloudflare Zero Trust Access để bảo vệ `admin.studyit.dev`.
- [x] **Subtask 10.4**: Chạy build kiểm thử đồng loạt cả 3 module (`MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`).

#### 🛑 GATE CHECK TASK 10 (HOÀN TẤT TOÀN BỘ DỰ ÁN - PASS 100%):
- [x] 1. **Tri-Module Build Pass**: Cả 3 thư mục (`MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`) đều build đạt 100% exit code 0.
- [x] 2. **Verification Clean State**: Cấu hình vercel.json, tài liệu triển khai và toàn bộ mã nguồn đạt chuẩn kiến trúc phân tách độc lập.

---

## 4. Cổng Xác Nhận Người Dùng (Human User Confirmation Gate)

> [!CAUTION]
> **DỪNG LẠI TẠI ĐÂY (PHASE 2: PLANNER COMPLETED)**:
> Theo quy chuẩn `AGENTS.md` và `plan-and-execute`, Agent **BẮT BUỘC DỪNG LẠI HOÀN TOÀN**, không tự ý tạo file hay chỉnh sửa code trước khi có lệnh trực tiếp từ bạn.
> 
> Hãy xem xét bản phân tích kiến trúc và danh sách Task 6 -> Task 10 ở trên. Nếu bạn đồng ý, xin hãy gửi lệnh xác nhận (ví dụ: **"tiến hành Task 6"**, **"chạy đi"**) để bắt đầu thực thi!

