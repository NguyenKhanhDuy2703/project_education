---
doc_type: workflow
title: Sơ đồ Luồng Quản trị Người dùng & Phân quyền Đặc quyền (Admin Users & Entitlements Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Quản trị Admin, Quản lý Người dùng, Phân bổ Vai trò (Role) và Ghi đè Quyền hạn (Feature Overrides)
date: 2026-10-14
source_file: "MODULE_FE/src/pages/admin/AdminUsersPage.tsx, MODULE_FE/src/features/admin/components/AdminUsersTab.tsx, MODULE_BE/src/modules/users"
status: final
language: vi
related_docs: [01-auth-login-to-home.md, 10-admin-user-groups-split-view.md, 07-content-review-and-publish.md]
---

# Sơ đồ Luồng Quản trị Người dùng & Phân quyền Đặc quyền (Admin Users & Entitlements Flow)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Quản trị Người dùng & Phân quyền Đặc quyền |
| **Version** | v1.0 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Trải nghiệm quản trị tài khoản tại `/admin/users`: Tra cứu người dùng, phân trang 10 dòng/trang, thay đổi vai trò (User, UserPro, Contributor, Admin), khóa/mở khóa tài khoản (Suspend/Active), và cấp quyền hạn đặc biệt (Feature Overrides / Direct Entitlements) kèm hạn sử dụng |
| **Thời gian** | 2026-10-14 |
| **Tham chiếu từ** | `MODULE_FE/src/features/admin/components/AdminUsersTab.tsx`, `MODULE_BE/src/modules/users/users.controller.ts`, `MODULE_BE/src/modules/audit-logs` |

---

## 2. Nội dung chính (Content)

### 2.1. Tóm tắt luồng (TL;DR)
- **Đầu vào**: Quản trị viên truy cập `/admin/users`.
- **Hiển thị & Tra cứu**:
  - Giao diện nạp danh sách người dùng với thanh tìm kiếm (Họ tên, SĐT, Email), bộ lọc theo Role (`user`, `user_pro`, `contributor`, `admin`) và Trạng thái (`active`, `suspended`).
  - Áp dụng phân trang chuẩn mực 10 người dùng/trang (`DataTablePagination`).
- **Thao tác Nghiệp vụ**:
  1. **Đổi vai trò (Change Role)**: Nâng cấp học viên thành `contributor` (để họ có thể soạn bài) hoặc bổ nhiệm `admin`.
  2. **Khóa tài khoản (Suspend)**: Vô hiệu hóa quyền truy cập khi vi phạm chính sách; chặn đăng nhập và thu hồi phiên làm việc tức thì.
  3. **Ghi đè quyền trực tiếp (Direct Feature Overrides)**: Cấp riêng lẻ một tính năng nâng cao (ví dụ: `FEATURE_AI_MENTOR`, `FEATURE_EXPORT_PDF`) cho một người dùng cụ thể mà không cần họ phải mua toàn bộ gói dịch vụ.

---

### 2.2. Phân công & Vai trò (Who does what)

| Thực thể | Loại | Vai trò & Trách nhiệm trong luồng |
|---|---|---|
| **Admin** | Actor | Thực hiện tìm kiếm, điều chỉnh vai trò, cấp quyền hoặc khóa tài khoản |
| **AdminUsersTab** | Client UI | Render danh sách user, thanh phân trang shadcn, dialog đổi role và modal ghi đè quyền |
| **Users Controller & Service** | NestJS Backend | Xác thực quyền admin, xử lý mutation cập nhật database |
| **AuditLogsService** | Audit Ledger | Ghi vết hành động của Admin: `USER_ROLE_CHANGE`, `USER_SUSPEND`, `USER_OVERRIDE` |
| **PostgreSQL Database** | Storage | Bảng `users`, `user_entitlements`, `audit_logs` |

---

### 2.3. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant UI as AdminUsersTab (/admin/users)
    participant Modal as UserDetails & Override Modal
    participant BE as NestJS Backend (UsersModule)
    participant Audit as AuditLog Service
    participant DB as PostgreSQL

    Note over Admin, DB: 1. Nạp danh sách & Phân trang 10 người dùng
    Admin->>UI: Truy cập `/admin/users` (hoặc chuyển trang 2)
    UI->>BE: GET /api/users?page=2&limit=10&role=all&search=
    BE->>DB: SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 10
    DB-->>BE: 10 bản ghi người dùng + Tổng số trang (totalPages)
    BE-->>UI: 200 OK { data: [...], meta: { page: 2, totalPages: 15, totalItems: 148 } }
    UI-->>Admin: Hiển thị bảng kèm phân trang shadcn chính xác

    Note over Admin, DB: 2. Thao tác Nâng cấp quyền Contributor
    Admin->>UI: Bấm vào action menu của User "Hoàng Nam", chọn "Change Role"
    UI->>UI: Mở Select Dialog chọn Role mới = "contributor"
    Admin->>UI: Bấm "Lưu thay đổi"
    UI->>BE: PATCH /api/users/:id/role { role: "contributor" }
    BE->>DB: UPDATE users SET role = 'contributor' WHERE id = :id
    BE->>Audit: Ghi log: Admin A changed role of User B to 'contributor'
    DB-->>BE: Cập nhật thành công
    BE-->>UI: 200 OK { id, role: "contributor" }
    UI-->>Admin: Badge chuyển thành tím "Contributor" + Toast thành công!

    Note over Admin, DB: 3. Ghi đè Quyền hạn Đặc biệt (Feature Overrides)
    Admin->>UI: Bấm nút "Entitlements" trên dòng của User
    UI->>Modal: Mở modal cấu hình Feature Overrides
    Admin->>Modal: Tích chọn "FEATURE_SQL_LABS", Hạn dùng: 2026-12-31
    Admin->>Modal: Bấm "Xác nhận cấp quyền"
    Modal->>BE: POST /api/users/:id/entitlements/override { featureKey: "FEATURE_SQL_LABS", expiresAt: "2026-12-31" }
    BE->>DB: INSERT INTO user_entitlements (user_id, feature_key, expires_at) VALUES (...) ON CONFLICT DO UPDATE
    BE->>Audit: Ghi log: Admin A granted override FEATURE_SQL_LABS to User B
    DB-->>BE: Ghi nhận thành công
    BE-->>Modal: 200 OK
    Modal-->>Admin: Toast "Đã cấp đặc quyền thành công!"

    Note over Admin, DB: 4. Thao tác Khóa Tài khoản (Suspend)
    Admin->>UI: Bấm "Suspend User" tại người dùng vi phạm
    UI->>BE: POST /api/users/:id/suspend { reason: "Spam comment" }
    BE->>DB: UPDATE users SET status = 'suspended', refresh_token_hash = NULL WHERE id = :id
    BE->>Audit: Ghi log: Admin A suspended User B
    DB-->>BE: Thu hồi phiên thành công
    BE-->>UI: 200 OK
    UI-->>Admin: Badge chuyển sang đỏ "Suspended"
```

---

### 2.4. Phân tích Kỹ thuật Chi tiết

1. **Kiến trúc Phân quyền Linh hoạt (Role-based vs Direct-entitlement)**:
   - Thay vì ràng buộc cứng mọi tính năng vào một Role duy nhất, hệ thống kết hợp 2 tầng:
     - **Tầng 1 (Role cơ bản)**: Quyết định quyền truy cập các portal lớn (`/admin/*`, `/contributor/*`).
     - **Tầng 2 (Feature Overrides)**: Bảng `user_entitlements` cho phép bật/tắt từng tính năng độc lập (ví dụ mở quyền cho một học sinh giỏi học thử bài Lab nâng cao có hạn dùng 30 ngày).
2. **Thu hồi Phiên ngay lập tức (Instant Session Invalidation)**:
   - Khi tài khoản bị `suspended`, backend lập tức gán `refresh_token_hash = NULL` trong CSDL.
   - Khi token cũ hết hạn 15 phút, người dùng bị khóa không thể refresh phiên và bị buộc đăng xuất ngay lập tức.
3. **Phân trang Tối ưu Hiệu năng (Shadcn DataTablePagination)**:
   - Tích hợp số trang hiển thị dạng `[1] [2] ... [10]`, nút Prev/Next, hỗ trợ truy cập trực tiếp trang bất kỳ mà không phải tải toàn bộ tập dữ liệu đồ sộ về client.

---

### 2.5. Xử lý Ngoại lệ (Edge Cases)

| Tình huống ngoại lệ | Phản hồi hệ thống | Trải nghiệm người dùng |
|---|---|---|
| **Admin tự khóa tài khoản của chính mình** | Backend chặn với lỗi `400 Bad Request: Cannot suspend self` | Giao diện cảnh báo *"Bạn không thể tự khóa tài khoản của chính mình"* |
| **Hạ quyền của Admin duy nhất còn lại trong hệ thống** | Backend kiểm tra số lượng admin tối thiểu (≥ 1) | Chặn thao tác và cảnh báo *"Hệ thống phải có ít nhất 1 Quản trị viên"* |
| **Ghi đè quyền với ngày hết hạn trong quá khứ** | Form validate ngày hết hạn phải `> now()` | Báo lỗi kiểm tra định dạng ngày |

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn Frontend**:
  - Trang Quản lý Users: [MODULE_FE/src/pages/admin/AdminUsersPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/AdminUsersPage.tsx)
  - Tab Danh sách Người dùng: [MODULE_FE/src/features/admin/components/AdminUsersTab.tsx](file:///d:/Projects/study-web/MODULE_FE/src/features/admin/components/AdminUsersTab.tsx)
  - Component Phân trang: [MODULE_FE/src/components/ui/data-table-pagination.tsx](file:///d:/Projects/study-web/MODULE_FE/src/components/ui/data-table-pagination.tsx)
- **Mã nguồn Backend**:
  - Users Controller: [MODULE_BE/src/modules/users/users.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/users/users.controller.ts)
  - Audit Logs Service: [MODULE_BE/src/modules/audit-logs/audit-logs.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/audit-logs/audit-logs.service.ts)
- **Tài liệu liên quan**:
  - Xác thực & Phiên làm việc: [01-auth-login-to-home.md](file:///d:/Projects/study-web/docs/workflows/01-auth-login-to-home.md)
  - Quản trị Nhóm Người dùng 2 Bảng: [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md)
