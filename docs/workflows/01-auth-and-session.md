---
doc_type: workflow
title: Sơ đồ Luồng Xác thực & Quản lý Phiên Đăng nhập (Auth & Silent Refresh)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Luồng nghiệp vụ người dùng (Email/Password & Google OAuth) và chu trình xác thực JWT, Cookie bảo mật
date: 2026-10-12
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
| **Version** | v1.1 |
| **Người làm** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Phạm vi (Scope)** | Luồng nghiệp vụ người dùng (Email/Mật khẩu & Google OAuth), phân quyền JWT và cơ chế Silent Refresh qua Axios Interceptor |
| **Thời gian** | 2026-10-12 |
| **Tham chiếu từ** | Hiện trạng mã nguồn xác thực tại `MODULE_BE/src/modules/auth` và `MODULE_FE/src/services/api.client.ts` |

---

## 2. Nội dung chính (Content)

### 2.1. Sơ đồ Luồng Nghiệp vụ Người dùng (User Business Flow)

Sơ đồ thể hiện chu trình tương tác thực tế của người dùng trên giao diện Web khi thực hiện đăng nhập qua 2 hình thức: Tài khoản thông thường (Email & Mật khẩu) hoặc Google OAuth:

```mermaid
flowchart TD
    Start([User mở trang Đăng nhập]) --> Choice{User chọn cách đăng nhập}

    %% --- Cách 1: Email / Password ---
    Choice -->|Nhập tài khoản| Form[Nhập Email và Mật khẩu]
    Form --> ClickLogin[Bấm nút 'Đăng nhập']
    ClickLogin --> CheckInput{Kết quả hiển thị trên màn hình}
    CheckInput -->|Thông tin sai / để trống| ErrMsg[Màn hình hiện thông báo đỏ: 'Sai email hoặc mật khẩu']
    ErrMsg --> Form

    %% --- Cách 2: Google ---
    Choice -->|Dùng Google| ClickGoogle[Bấm nút 'Tiếp tục với Google']
    ClickGoogle --> GoogleScreen[Màn hình Google hiện lên để chọn tài khoản]
    GoogleScreen --> GoogleAction{User thao tác trên Google}
    GoogleAction -->|Tắt popup / Bấm Hủy| BackToLogin[Quay lại màn hình Đăng nhập]
    BackToLogin --> Choice

    %% --- Kết quả chung ---
    GoogleAction -->|Chọn tài khoản & Đồng ý| LoginSuccess
    CheckInput -->|Thông tin chính xác| LoginSuccess

    LoginSuccess{Trạng thái tài khoản} -->|Tài khoản bị khóa| BannedMsg[Hiện thông báo: 'Tài khoản đã bị tạm khóa']
    BannedMsg --> Start

    LoginSuccess -->|Bình thường| SuccessUI[Chuyển màn hình vào Dashboard / Trang chủ]
    SuccessUI --> Done([Bắt đầu sử dụng hệ thống])
```

#### Các điểm chạm (Touchpoints) của Người dùng trên Giao diện:
1. **Lựa chọn hình thức**: Người dùng nhìn thấy 2 tùy chọn rõ ràng trên màn hình (Form nhập Email/Password và nút liên kết "Tiếp tục với Google").
2. **Phản hồi lỗi trên UI**:
   - Nếu nhập thiếu hoặc sai thông tin, giao diện giữ nguyên ngữ cảnh nhập liệu và hiển thị thông báo lỗi trực quan ngay tại form.
   - Khi chọn đăng nhập Google, mở hộp thoại chọn tài khoản Google. Nếu người dùng đóng popup/hủy bỏ, trạng thái trang đăng nhập được bảo toàn.
3. **Phản hồi trạng thái & Điều hướng**:
   - Trường hợp tài khoản bị khóa: Hệ thống hiển thị thông báo trạng thái tài khoản bị tạm khóa.
   - Trường hợp thành công: Người dùng được tự động điều hướng vào Dashboard hoặc trang bài lab đang thao tác dở trước đó.

### 2.2. Sơ đồ Tuần tự Kỹ thuật (Sequence Diagram)

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

### 2.3. Phân tích Chi tiết Từng Bước

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
