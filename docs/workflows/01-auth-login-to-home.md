---
doc_type: workflow
title: Sơ đồ Luồng Đăng nhập, Quản lý Phiên & Điều hướng Trang chủ (Auth & Session Flow)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Phân hệ Xác thực JWT, Google OAuth, Cookie HttpOnly và Điều hướng Trang chủ/Dashboard
date: 2026-10-14
source_file: "MODULE_BE/src/modules/auth, MODULE_FE/src/features/auth, MODULE_FE/src/services/api.client.ts"
status: final
language: vi
related_docs: [../01-proposal.md, ../05-database.md, 02-catalog-topic-discovery.md]
---

# Sơ đồ Luồng Đăng nhập, Quản lý Phiên & Điều hướng Trang chủ (Auth & Session Flow)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Sơ đồ Luồng Đăng nhập, Quản lý Phiên & Điều hướng Trang chủ |
| **Version** | v1.1 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Toàn bộ chu trình từ khi người dùng mở form đăng nhập, nhập SĐT/Mật khẩu hoặc chọn Google OAuth, xác thực qua NestJS, lưu trữ Access Token trong Redux, thiết lập HttpOnly Cookie, cho đến khi điều hướng thành công vào Trang chủ hoặc Dashboard chuyên biệt |
| **Thời gian** | 2026-10-14 |
| **Tham chiếu từ** | `MODULE_BE/src/modules/auth/auth.controller.ts`, `MODULE_BE/src/modules/auth/auth.service.ts`, `MODULE_FE/src/features/auth/store/authSlice.ts`, `MODULE_FE/src/services/api.client.ts` |

---

## 2. Nội dung chính (Content)

### 2.1. Tóm tắt luồng (TL;DR)
- **Đầu vào**: Số điện thoại + Mật khẩu (hoặc tài khoản Google).
- **Xử lý**:
  - Mật khẩu băm Bcrypt được đối chiếu tại CSDL Postgres.
  - Cấp cặp Token: Access Token (thời hạn 15 phút, nằm trong Redux state của React) và Refresh Token (thời hạn 7 ngày, nằm trong HttpOnly cookie).
- **Đầu ra**: Người dùng đăng nhập thành công, Redux cập nhật state `isAuthenticated = true`, lưu thông tin `user` (id, name, phone, role, entitlements) và tự động điều hướng:
  - Role `admin`: `/admin/overview` (hoặc `/`)
  - Role `contributor`: `/contributor/overview` (hoặc `/`)
  - Role `user`: `/` (Trang chủ nền tảng).

---

### 2.2. Phân công & Vai trò (Who does what)

| Thực thể | Loại | Vai trò & Trách nhiệm trong luồng |
|---|---|---|
| **Người dùng / Khách** | Actor | Điền thông tin đăng nhập hoặc bấm nút Google OAuth |
| **LoginPage (React FE)** | Client UI | Validate form, dispatch login thunk, hiển thị thông báo lỗi nếu thất bại |
| **Redux Store (`authSlice`)** | Client State | Lưu trữ Access Token, thông tin user, role và danh sách quyền hạn (entitlements) |
| **Axios Client (`api.client.ts`)** | HTTP Gateway | Gắn Bearer Token vào header, chặn bắt lỗi 401 và kích hoạt cơ chế Silent Refresh ngầm |
| **AuthController & Service** | NestJS Backend | Xác thực credentials, băm/so sánh Bcrypt, ký JWT, set cookie `refreshToken` |
| **PostgreSQL Database** | Storage | Lưu bảng `users` và hash refresh token để thu hồi phiên |

---

### 2.3. Sơ đồ Tuần tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as LoginPage / React
    participant Redux as Redux Store (authSlice)
    participant Axios as Axios Interceptor
    participant BE as NestJS Backend (AuthModule)
    participant DB as PostgreSQL (users)

    Note over User, DB: 1. Đăng nhập qua Số điện thoại & Mật khẩu
    User->>FE: Nhập SĐT, Mật khẩu và bấm "Đăng nhập"
    FE->>FE: Client-side validation (SĐT đúng định dạng, pass ≥ 6 ký tự)
    FE->>BE: POST /api/auth/login { phone, password }
    BE->>DB: SELECT * FROM users WHERE phone = $1
    DB-->>BE: User record (id, role, password_hash, status)
    
    alt Tài khoản bị khóa (status = suspended)
        BE-->>FE: 403 Forbidden ("Tài khoản đã bị tạm khóa")
        FE-->>User: Hiển thị lỗi cảnh báo đỏ
    else Mật khẩu không khớp
        BE-->>FE: 401 Unauthorized ("SĐT hoặc mật khẩu không chính xác")
        FE-->>User: Rung lắc form và báo lỗi xác thực
    else Xác thực thành công
        BE->>BE: Ký JWT Access Token (15m, payload: id, phone, role)
        BE->>BE: Ký JWT Refresh Token (7d)
        BE->>DB: UPDATE users SET refresh_token_hash = $1 WHERE id = $2
        BE-->>FE: 200 OK + Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict<br/>Body: { accessToken, user: { id, name, role, ... } }
        FE->>Redux: dispatch(setCredentials({ accessToken, user }))
        
        alt Role là Admin
            FE-->>User: Điều hướng vào `/admin/overview` hoặc `/`
        else Role là Contributor
            FE-->>User: Điều hướng vào `/contributor/overview` hoặc `/`
        else Role là User thường
            FE-->>User: Điều hướng vào Trang chủ `/`
        end
    end

    Note over User, DB: 2. Tự động gia hạn phiên (Silent Refresh Token)
    User->>FE: Chuyển trang / thao tác học tập khi Access Token đã hết hạn
    FE->>Axios: Gửi request API (ví dụ: GET /api/catalog/series)
    Axios->>BE: GET /api/catalog/series (Bearer token hết hạn)
    BE-->>Axios: 401 Unauthorized (jwt expired)
    
    Note over Axios, BE: Axios Interceptor bắt mã 401 & thực hiện refresh ngầm
    Axios->>BE: POST /api/auth/refresh (tự động đính kèm HttpOnly cookie)
    BE->>DB: Đối chiếu refreshToken hợp lệ trong DB
    DB-->>BE: Khớp bản ghi
    BE->>BE: Ký Access Token mới (15m)
    BE-->>Axios: 200 OK { accessToken: "new_token" }
    Axios->>Redux: dispatch(updateAccessToken("new_token"))
    Axios->>BE: Replay lại request GET /api/catalog/series với token mới
    BE-->>Axios: 200 OK { data: [...] }
    Axios-->>FE: Dữ liệu tải thành công mà người dùng không bị văng ra
```

---

### 2.4. Phân tích Kỹ thuật Chi tiết

1. **Bảo mật đa tầng**:
   - Mật khẩu mã hóa Bcrypt với salt rounds = 10.
   - `Access Token`: Thời hạn ngắn (15 phút), lưu trong memory (Redux State), không ghi vào `localStorage` để triệt tiêu nguy cơ bị đánh cắp qua tấn công XSS.
   - `Refresh Token`: Thời hạn dài (7 ngày), lưu trữ an toàn trong `HttpOnly Cookie`, thiết lập cờ `SameSite=Strict; Path=/api/auth/refresh; Secure`.
2. **Cơ chế tái phát request (Request Replaying Queue)**:
   - Trong `api.client.ts`, nếu có nhiều request đồng thời gặp lỗi 401 khi token vừa hết hạn, hệ thống sử dụng cờ `isRefreshing` và hàng đợi `failedQueue` để chỉ gọi API refresh đúng **1 lần duy nhất**, sau đó tái phát toàn bộ các request đang chờ với token mới.
3. **Xử lý đăng xuất & hủy phiên**:
   - Khi người dùng bấm "Đăng xuất":
     - FE gọi `POST /api/auth/logout`.
     - Backend xóa refresh token trong CSDL và gửi chỉ thị `Clear-Cookie`.
     - Redux dispatch action `logout()`, reset toàn bộ cache state về rỗng.

---

### 2.5. Xử lý Ngoại lệ (Edge Cases)

| Tình huống ngoại lệ | Phản hồi hệ thống | Trải nghiệm người dùng |
|---|---|---|
| **Refresh Token hết hạn hoặc bị thu hồi** | API `/api/auth/refresh` trả về `401 Unauthorized` | Interceptor hủy toàn bộ hàng đợi, dispatch logout, chuyển hướng về `/login?redirect=...` kèm thông báo *"Phiên đăng nhập đã hết hạn"* |
| **Mất kết nối mạng khi đang refresh** | Request ném mã mạng `ERR_NETWORK` | Giữ nguyên trạng thái, thông báo *"Không có kết nối mạng, vui lòng thử lại"* |
| **Người dùng bị Admin khóa tài khoản (Suspend)** | Token bị từ chối do middleware kiểm tra status user trong DB | Đăng xuất ngay lập tức kèm thông báo liên hệ hỗ trợ |

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn Frontend**:
  - Form Đăng nhập: [MODULE_FE/src/features/auth/components/LoginForm.tsx](file:///d:/Projects/study-web/MODULE_FE/src/features/auth/components/LoginForm.tsx)
  - Redux Auth Slice: [MODULE_FE/src/features/auth/store/authSlice.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/auth/store/authSlice.ts)
  - Axios Interceptor: [MODULE_FE/src/services/api.client.ts](file:///d:/Projects/study-web/MODULE_FE/src/services/api.client.ts)
- **Mã nguồn Backend**:
  - Auth Controller: [MODULE_BE/src/modules/auth/auth.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/auth/auth.controller.ts)
  - Auth Service: [MODULE_BE/src/modules/auth/auth.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/auth/auth.service.ts)
  - Prisma User Model: [MODULE_BE/prisma/schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **Tài liệu liên quan**:
  - Luồng Khám phá Khóa học: [02-catalog-topic-discovery.md](file:///d:/Projects/study-web/docs/workflows/02-catalog-topic-discovery.md)
  - Quản trị Người dùng: [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md)
