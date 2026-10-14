---
doc_type: workflow
title: Sơ đồ Luồng Thu thập & Xử lý Ý kiến Đóng góp (User Feedback Loop Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Phản hồi & Đóng góp ý kiến (Feedback), Bảng điều khiển Quản trị `/admin/feedback`, Thống kê và Xử lý Yêu cầu
date: 2026-10-14
source_file: "MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx, MODULE_FE/src/features/admin/api/feedback.admin.api.ts, MODULE_BE/src/modules/feedback"
status: final
language: vi
related_docs: [01-auth-login-to-home.md, 09-admin-users-and-entitlements.md]
---

# Sơ đồ Luồng Thu thập & Xử lý Ý kiến Đóng góp (User Feedback Loop Flow)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Thu thập & Xử lý Ý kiến Đóng góp |
| **Version** | v1.0 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Toàn bộ vòng lặp phản hồi của người dùng: Từ khi học viên gửi góp ý/báo lỗi trên giao diện, dữ liệu được ghi vào CSDL Postgres, cho đến khi Quản trị viên tra cứu, phân loại (Bug, Feature Request, Content Lab, Other), xem chi tiết ngữ cảnh trang và xử lý tại `/admin/feedback` |
| **Thời gian** | 2026-10-14 |
| **Tham chiếu từ** | `MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx`, `MODULE_BE/src/modules/feedback/feedback.controller.ts`, `MODULE_BE/src/modules/feedback/feedback.service.ts` |

---

## 2. Nội dung chính (Content)

### 2.1. Tóm tắt luồng (TL;DR)
- **Thu thập Phản hồi (Student Touchpoint)**:
  - Người dùng bấm nút "Góp ý / Báo lỗi" trên thanh công cụ hoặc footer.
  - Chọn danh mục: `bug` (Báo lỗi phần mềm), `feature_request` (Đề xuất tính năng mới), `content_lab` (Góp ý nội dung đề bài), `other` (Khác).
  - Điền nội dung chi tiết. Hệ thống tự động đính kèm đường dẫn trang web hiện tại (`page_url`) và ID người gửi.
  - Gửi request `POST /api/feedback` ghi vào CSDL.
- **Quản trị & Tiếp nhận (Admin Hub `/admin/feedback`)**:
  - Thống kê tổng quan qua 4 thẻ KPI: Tổng số feedback, Số lỗi Bug, Số đề xuất Feature, Số phản hồi Bài Lab.
  - Bộ lọc Tabs theo từng thể loại, thanh tìm kiếm nội dung/email và phân trang chuẩn 10 dòng/trang.
  - Nhấp vào từng dòng để mở **Detail Inspection Modal**: xem toàn văn phản hồi, kiểm tra URL gặp sự cố và cập nhật trạng thái xử lý (`open`, `in_progress`, `resolved`).

---

### 2.2. Phân công & Vai trò (Who does what)

| Thực thể | Loại | Vai trò & Trách nhiệm trong luồng |
|---|---|---|
| **Học viên / Khách** | Actor | Gửi biểu mẫu phản hồi hoặc báo cáo sự cố trong quá trình học tập |
| **Feedback Widget / Modal** | Client UI | Modal thu thập danh mục, nội dung góp ý, tự động lấy `window.location.pathname` |
| **Admin** | Actor | Giám sát danh sách tại `/admin/feedback`, đọc chi tiết và chuyển trạng thái xử lý |
| **AdminFeedbackPage** | Client UI | Bảng thống kê thẻ số liệu, bộ lọc category, tìm kiếm, phân trang và modal xem chi tiết |
| **Feedback Controller & Service** | NestJS Backend | Lưu feedback vào DB, cung cấp API `GET /api/feedback/admin` có phân quyền Admin |
| **PostgreSQL Database** | Storage | Bảng `feedbacks` lưu trữ id, userId, category, message, pageUrl, status, createdAt |

---

### 2.3. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên / Người dùng
    participant FWidget as Feedback Form (Client)
    actor Admin as Quản trị viên (Admin)
    participant AUI as Admin Feedback Hub (/admin/feedback)
    participant Modal as Detail Inspection Modal
    participant BE as NestJS (FeedbackModule)
    participant DB as PostgreSQL

    Note over User, DB: Giai đoạn 1: Học viên gửi phản hồi đóng góp
    User->>FWidget: Bấm nút "Phản hồi" tại trang làm bài Lab
    FWidget-->>User: Mở form góp ý (Category, Message)
    User->>FWidget: Chọn Category = "content_lab", Nhập: "Test case #2 của bài SQL GROUP BY bị sai cú pháp"
    FWidget->>BE: POST /api/feedback { category: "content_lab", message: "...", pageUrl: "/practice/lab-sql-02" }
    BE->>DB: INSERT INTO feedbacks (user_id, category, message, page_url, status) VALUES (...)
    DB-->>BE: Lưu bản ghi thành công
    BE-->>FWidget: 201 Created { id: "fb-102" }
    FWidget-->>User: Toast "Cảm ơn bạn đã đóng góp ý kiến giúp hoàn thiện hệ thống!"

    Note over Admin, DB: Giai đoạn 2: Admin kiểm tra & Xử lý tại Dashboard
    Admin->>AUI: Truy cập `/admin/feedback`
    AUI->>BE: GET /api/feedback/admin
    BE->>DB: SELECT * FROM feedbacks ORDER BY created_at DESC
    DB-->>BE: Danh sách toàn bộ phản hồi từ người học
    BE-->>AUI: 200 OK [ { id, category, message, user: { name, email }, pageUrl, status }, ... ]
    AUI->>AUI: Tính toán thống kê thẻ: Total: 28, Bug: 12, Feature: 8, Lab: 6, Other: 2
    AUI-->>Admin: Hiển thị bảng số liệu trực quan & phân trang 10 dòng/trang

    Note over Admin, DB: Giai đoạn 3: Xem chi tiết phản hồi & Xử lý sự cố
    Admin->>AUI: Bấm chọn tab "Content Lab" để lọc riêng lỗi bài tập
    AUI->>AUI: Lọc danh sách còn 6 bản ghi Content Lab
    Admin->>AUI: Bấm vào dòng của học viên "Lê Văn T"
    AUI->>Modal: Mở Modal xem chi tiết
    Modal-->>Admin: Hiển thị toàn văn góp ý + Link trang: `/practice/lab-sql-02`
    Admin->>Modal: Bấm chuyển trạng thái sang "In Progress" và mở link để kiểm tra sửa bài
    Modal->>BE: PATCH /api/feedback/admin/:id { status: "in_progress" }
    BE->>DB: UPDATE feedbacks SET status = 'in_progress' WHERE id = :id
    DB-->>BE: Cập nhật thành công
    BE-->>Modal: 200 OK
    Modal-->>Admin: Badge chuyển sang "In Progress" màu vàng
```

---

### 2.4. Phân tích Kỹ thuật Chi tiết

1. **Trực quan hóa Dữ liệu (Aggregated Statistics Cards)**:
   - Thay vì bảng trần không có bối cảnh, trang `/admin/feedback` cung cấp 4 thẻ chỉ số nhanh ở trên cùng:
     - Thẻ 1: Tổng số phản hồi nhận được (Total Feedbacks)
     - Thẻ 2: Báo cáo lỗi phần mềm (Bugs)
     - Thẻ 3: Đề xuất tính năng mới (Feature Requests)
     - Thẻ 4: Góp ý bài tập & nội dung (Content Lab)
2. **Theo dõi Ngữ cảnh Nguồn gốc (Context Tracking)**:
   - Thuộc tính `page_url` được client tự động ghi nhận khi người dùng mở form góp ý.
   - Khi Admin xem phản hồi, URL này hiển thị dưới dạng một liên kết có thể nhấp trực tiếp (Clickable Link), giúp Admin bay ngay tới bài học hoặc trang bị lỗi để tái hiện vấn đề mà không cần hỏi lại người dùng.
3. **Phân trang Phía Client Tối ưu (Shadcn DataTablePagination)**:
   - Dữ liệu feedback được trang bị component phân trang chuẩn mực, giúp giao diện gọn gàng, người quản trị dễ dàng duyệt qua các trang với độ trễ phản hồi tức thời.

---

### 2.5. Xử lý Ngoại lệ (Edge Cases)

| Tình huống ngoại lệ | Phản hồi hệ thống | Trải nghiệm người dùng |
|---|---|---|
| **Người dùng chưa đăng nhập (Khách vãng lai)** | Backend cho phép `user_id = NULL` nhưng yêu cầu nhập email liên hệ | Khách vẫn gửi được góp ý mà không bị ép buộc đăng nhập |
| **Nội dung phản hồi quá ngắn hoặc chứa ký tự spam** | Form validate độ dài message tối thiểu 10 ký tự | Nút gửi bị mờ kèm gợi ý: *"Vui lòng mô tả chi tiết ít nhất 10 ký tự"* |
| **Người dùng thường cố gọi API Admin Feedback** | Decorator `@Roles(UserRole.ADMIN)` chặn lại | Trả về lỗi 403 Forbidden |

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn Frontend**:
  - Trang Quản trị Feedback: [MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx)
  - API Client Admin Feedback: [MODULE_FE/src/features/admin/api/feedback.admin.api.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/admin/api/feedback.admin.api.ts)
  - Component Phân trang: [MODULE_FE/src/components/ui/data-table-pagination.tsx](file:///d:/Projects/study-web/MODULE_FE/src/components/ui/data-table-pagination.tsx)
- **Mã nguồn Backend**:
  - Feedback Controller: [MODULE_BE/src/modules/feedback/feedback.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/feedback/feedback.controller.ts)
  - Feedback Service: [MODULE_BE/src/modules/feedback/feedback.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/feedback/feedback.service.ts)
- **Tài liệu liên quan**:
  - Luồng Quản trị Người dùng: [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md)
  - Quản trị Nhóm Người dùng: [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md)
