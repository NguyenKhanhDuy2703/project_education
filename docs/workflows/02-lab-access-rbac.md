---
doc_type: workflow
title: Sơ đồ Luồng Truy cập Bài Lab & Phân quyền Pro (RBAC Guard)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Kiểm soát quyền truy cập nội dung bài lab theo vai trò học viên
date: 2026-10-02
source_file: "MODULE_BE/src/common/guards/roles.guard.ts, MODULE_FE/src/routes"
status: final
language: vi
related_docs: [../01-proposal.md, ../05-database.md]
---

# Sơ đồ Luồng Truy cập Bài Lab & Phân quyền Pro (RBAC Guard)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Truy cập Bài Lab & Phân quyền Pro |
| **Version** | v1.0 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Luồng người dùng khám phá danh mục Series, chọn bài lab, kiểm tra vai trò (RBAC) và mở không gian thực hành Lab Workspace |
| **Thời gian** | 2026-10-02 |
| **Tham chiếu từ** | `MODULE_BE/src/common/guards/roles.guard.ts` và cơ chế bảo vệ Route phía `MODULE_FE/src/routes` |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên
    participant FE as Giao diện Web
    participant Guard as Roles Guard
    participant LabService as Lab Service
    participant DB as Database (Postgres)

    User->>FE: Chọn Series bài lab trên trang chủ
    FE->>LabService: GET /api/series/:slug
    LabService->>DB: Lấy thông tin Series và danh sách bài lab
    DB-->>LabService: Dữ liệu Series và các bài lab con
    LabService-->>FE: 200 OK (Danh sách bài lab)

    User->>FE: Bấm chọn một bài lab cụ thể
    FE->>Guard: GET /api/labs/:id (kèm Bearer Token)

    Guard->>Guard: Giải mã JWT lấy userId và role
    Guard->>DB: Truy vấn bài lab theo id
    DB-->>Guard: Dữ liệu lab kèm cờ isProOnly

    alt Bài lab Pro nhưng User là tài khoản Free
        Guard-->>FE: 403 Forbidden (Yêu cầu nâng cấp Pro)
        FE-->>User: Hiển thị Modal nâng cấp tài khoản UserPro
    else Hợp lệ (Bài lab Free hoặc User đã là Pro)
        Guard->>LabService: Chuyển tiếp request hợp lệ
        LabService->>DB: Lấy đề bài, initialSnippet, testScript
        DB-->>LabService: Dữ liệu đầy đủ bài lab
        LabService-->>FE: 200 OK (Trả về nội dung bài lab)
        FE-->>User: Render màn hình Lab Workspace 2 cột
    end
```

### 2.2. Phân tích Chi tiết Từng Bước

1. **Cấp độ Series (Public Catalog)**:
   * Danh sách các Series bài lab được công khai để khách vãng lai và học viên tự do khám phá.
   * Từng bài lab trong series được gắn nhãn minh bạch: `Miễn phí (Free Preview)` hoặc `Dành cho Pro (Pro Only)`.

2. **Cơ chế Bảo vệ 2 Lớp (Dual-layer Guard)**:
   * **Lớp 1 (Phía Frontend)**: Kiểm tra thông tin `user.role` trong Redux Store để hiển thị biểu tượng ổ khóa 🔒 hoặc nút mở khóa.
   * **Lớp 2 (Phía Backend - Tuyệt đối)**: Sử dụng NestJS `RolesGuard`. Dù học viên có cố tình gọi API trực tiếp bằng Postman, nếu không có token `userPro` hoặc `admin`, backend lập tức từ chối với mã `403 Forbidden`. Không trả về bất kỳ nội dung bài lab hay kịch bản test nào.

3. **Cung cấp Dữ liệu Môi trường Thực hành (Lab Workspace)**:
   * Khi vượt qua kiểm tra quyền, Frontend nhận về payload gồm:
     * `instructions`: Nội dung hướng dẫn từng bước viết bằng Markdown.
     * `initialSnippet`: Đoạn code mẫu ban đầu đưa vào khung soạn thảo.
     * `sandboxType`: Loại môi trường cần khởi tạo (`js_worker`, `ui_mock`, `api_mock`).
     * `testScript`: Kịch bản kiểm thử sẵn sàng để gửi xuống Web Worker khi bấm nút Test.

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn liên quan**:
  - Guard kiểm tra vai trò: [MODULE_BE/src/common/guards/roles.guard.ts](file:///d:/Projects/study-web/MODULE_BE/src/common/guards/roles.guard.ts)
  - Định tuyến bảo vệ Frontend: [MODULE_FE/src/routes/ProtectedRoute.tsx](file:///d:/Projects/study-web/MODULE_FE/src/routes/ProtectedRoute.tsx)
- **Tài liệu hệ thống**:
  - Đề xuất Dự án: [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md)
  - Thiết kế Cơ sở Dữ liệu: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
