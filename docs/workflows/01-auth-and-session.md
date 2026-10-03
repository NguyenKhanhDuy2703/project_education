---
doc_type: workflow
title: Sơ đồ Luồng Xác thực & Quản lý Phiên Đăng nhập (Auth & Silent Refresh)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Xác thực JWT, Cookie bảo mật và Tự động làm mới phiên ngầm
date: 2026-10-02
source_file: "MODULE_BE/src/modules/auth, MODULE_FE/src/features/auth"
status: final
language: vi
related_docs: [../01-proposal.md, ../05-database.md]
---

# Sơ đồ Luồng Xác thực & Quản lý Phiên Đăng nhập (Auth & Silent Refresh)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Xác thực & Quản lý Phiên Đăng nhập |
| **Version** | v1.0 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Chu trình xác thực người dùng bằng SĐT/Mật khẩu, phân quyền JWT và cơ chế Silent Refresh qua Axios Interceptor |
| **Thời gian** | 2026-10-02 |
| **Tham chiếu từ** | Hiện trạng mã nguồn xác thực tại `MODULE_BE/src/modules/auth` và `MODULE_FE/src/services/api.client.ts` |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên
    participant FE as Frontend (React)
    participant Axios as Axios Interceptor
    participant BE as Backend (NestJS)
    participant DB as Database (Postgres)

    Note over User, DB: Giai đoạn 1: Đăng nhập hệ thống
    User->>FE: Nhập SĐT và Mật khẩu rồi bấm Đăng nhập
    FE->>BE: POST /api/auth/login (phone, password)
    BE->>DB: Query user theo phone
    DB-->>BE: Bản ghi user và hash password
    BE->>BE: So sánh mật khẩu (bcrypt.compare)

    alt Đăng nhập thành công
        BE->>BE: Ký Access Token (15 phút) và Refresh Token (7 ngày)
        BE->>DB: Lưu Refresh Token vào bảng users
        BE-->>FE: 200 OK (Access Token và HttpOnly Cookie)
        FE->>FE: Lưu user vào Redux và chuyển hướng về Trang chủ (/) (Dashboard tại /user/dashboard)
    else Sai thông tin
        BE-->>FE: 401 Unauthorized (Sai SĐT hoặc mật khẩu)
        FE-->>User: Hiển thị thông báo lỗi trên Form
    end

    Note over User, DB: Giai đoạn 2: Tự động gia hạn phiên ngầm (Silent Refresh)
    User->>FE: Thao tác học bài khi Access Token đã hết hạn
    FE->>Axios: Gửi request kèm Access Token cũ
    Axios->>BE: GET /api/labs/lab-01
    BE-->>Axios: 401 Token Expired
    
    Note over Axios, BE: Interceptor phát hiện 401 và gọi Refresh ngầm
    Axios->>BE: POST /api/auth/refresh (kèm Cookie ngầm)
    BE->>DB: Kiểm tra refreshToken trong CSDL
    DB-->>BE: Khớp bản ghi hợp lệ
    BE->>BE: Ký Access Token mới (15 phút)
    BE-->>Axios: 200 OK (Cấp Access Token mới)
    
    Axios->>Axios: Cập nhật Bearer Header với token mới
    Axios->>BE: Tự động gửi lại request GET ban đầu
    BE-->>FE: 200 OK (Trả dữ liệu bài lab)
    FE-->>User: Hiển thị nội dung bài học mượt mà không bị ngắt quãng
```

### 2.2. Phân tích Chi tiết Từng Bước

1. **Đăng nhập an toàn**:
   * Mật khẩu không bao giờ được lưu dạng thô (plain-text) mà luôn được băm với salt 10 rounds qua Bcrypt.
   * `Access Token` chỉ có thời hạn ngắn (15 phút) lưu trong bộ nhớ tạm (Redux State) để chống rò rỉ lâu dài.
   * `Refresh Token` có thời hạn dài (7 ngày) được trả về qua cờ `HttpOnly`, `SameSite=Strict` để JavaScript phía trình duyệt không thể đọc được, chống triệt để tấn công XSS.

2. **Cơ chế Silent Refresh Token**:
   * Phía Frontend cấu hình `Axios Response Interceptor`. Khi bất kỳ API nào trả về lỗi `401 Unauthorized` do hết hạn token, interceptor sẽ tạm dừng request đó, gọi ngầm endpoint `/api/auth/refresh`.
   * Trình duyệt tự động đính kèm cookie `refreshToken`. Nếu hợp lệ, backend cấp Access Token mới và interceptor tự động phát lại (replay) request cũ mà không cần người dùng thao tác lại.

3. **Xử lý Ngoại lệ (Edge Cases)**:
   * Nếu Refresh Token cũng hết hạn (hoặc bị vô hiệu hóa): API `/api/auth/refresh` trả về `401/403` -> Redux dispatch action `logout()`, xóa sạch state và chuyển hướng về trang `/login` kèm thông báo *"Phiên làm việc đã hết hạn, vui lòng đăng nhập lại"*.

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn liên quan**:
  - Controller & Service Auth: [MODULE_BE/src/modules/auth](file:///d:/Projects/study-web/MODULE_BE/src/modules/auth)
  - Cấu hình Axios & Interceptor: [MODULE_FE/src/services/api.client.ts](file:///d:/Projects/study-web/MODULE_FE/src/services/api.client.ts)
  - Khai báo bảng Users: [MODULE_BE/prisma/schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **Tài liệu hệ thống**:
  - Thiết kế Cơ sở Dữ liệu: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
  - Danh sách Yêu cầu Sản phẩm: [03-product-backlog.md](file:///d:/Projects/study-web/Docs/03-product-backlog.md)
