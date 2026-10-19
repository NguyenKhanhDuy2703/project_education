# ADR-001: Architecture Decision Record — Auth Session Model & Token Rotation

> **Document ID**: ADR-001  
> **Status**: APPROVED  
> **Date**: 2026-10-17  
> **Author**: Architecture & Security Workstream  
> **Scope**: `MODULE_BE` Authentication, Session Persistence, `MODULE_FE` Refresh Coordinator  

---

## 1. Ngữ cảnh (Context & Problem Statement)

Hệ thống xác thực hiện tại gặp các rủi ro cấu trúc nghiêm trọng đã được chỉ ra trong `docs/12-lab-platform-upgrade-analysis.md`:
1. **Lưu trữ Plaintext**: `User.refreshToken` lưu trực tiếp chuỗi token không mã hóa trong database.
2. **Race Condition Đa luồng / Đa tab**: Mỗi user chỉ có duy nhất 1 trường `refreshToken`. Khi có nhiều request đồng thời (ví dụ: Tab A và Tab B cùng gặp 401 khi hết hạn access token 15 phút), request đầu tiên kích hoạt rotation làm token trong DB đổi mới ngay lập tức; request thứ hai gửi token vừa bị đổi sẽ bị DB từ chối -> kích hoạt logout ngoài ý muốn.
3. **Lưu trữ không an toàn ở Browser**: Refresh token đang được gửi qua response body và lưu trong JavaScript `localStorage` / Redux store, dễ bị tấn công qua XSS.
4. **Thu hồi (Revocation) hạn chế**: Không hỗ trợ quản lý đa thiết bị (multi-device) hoặc phân biệt giữa các phiên làm việc độc lập.

---

## 2. Quyết định Kiến trúc (Architectural Decisions)

### DEC-01. Mô hình `AuthSession` Chuyên biệt & Hash Token
- Thay thế việc lưu trực tiếp trên bảng `User` bằng thực thể `AuthSession` độc lập.
- **Trường dữ liệu**:
  - `id`: UUID khóa chính.
  - `userId`: Khóa ngoại trỏ đến `User`.
  - `refreshTokenHash`: Chuỗi băm SHA-256 của refresh token hiện tại. Tuyệt đối không lưu raw token.
  - `previousTokenHash`: Chuỗi băm SHA-256 của token ngay trước đó.
  - `previousTokenExpiresAt`: Thời điểm hết hạn của previous token (Grace Window).
  - `userAgent`, `ipAddress`: Metadata nhận dạng thiết bị.
  - `revokedAt`: Thời điểm phiên bị hủy (nếu có).
  - `expiresAt`: Thời điểm hết hạn toàn bộ session (mặc định 7 ngày).

### DEC-02. Idempotent Rotation với Grace Window 30 giây
- Khi một refresh token hợp lệ được gửi lên:
  - Nếu token khớp với `refreshTokenHash`: Sinh cặp token mới (Access Token + Refresh Token). Cập nhật `previousTokenHash = refreshTokenHash`, `previousTokenExpiresAt = NOW() + 30 seconds`, và `refreshTokenHash = HASH(newToken)`.
  - Nếu token khớp với `previousTokenHash` VÀ `NOW() < previousTokenExpiresAt`: Đây là concurrent retry từ tab khác. Backend xử lý **idempotent**, trả về Access Token hiện hành mà không hủy session hay báo lỗi 401.
  - Nếu token khớp với token cũ hơn hoặc session đã bị `revokedAt`: Từ chối 401, ghi nhận cảnh báo an ninh tiềm ẩn replay attack.

### DEC-03. HttpOnly Cookie Contract cho Trình duyệt
- Endpoint refresh chuyển sang cơ chế Cookie-First:
  - Refresh token chỉ được gửi và nhận qua HttpOnly, Secure, SameSite cookie (`study_refresh_token`).
  - Response body của `/auth/refresh` và `/auth/login` **không chứa** refresh token trong JSON trả về cho browser.
  - Xóa bỏ hoàn toàn việc đọc/ghi refresh token từ `localStorage`.

### DEC-04. Phối hợp Đa Tab ở Frontend (Cross-Tab Coordination)
- Frontend triển khai `RefreshCoordinator` sử dụng `BroadcastChannel` (`auth_refresh_channel`).
- Khi nhiều tab cùng phát hiện access token sắp hết hạn hoặc nhận 401:
  - Chỉ 1 tab đại diện thực hiện gọi API `/auth/refresh`.
  - Các tab khác lắng nghe thông điệp hoàn thành qua channel và cập nhật access token mới vào bộ nhớ RAM.

---

## 3. Các Phương án Đã xem xét & Lý do từ chối (Alternatives Considered)

| Phương án | Mô tả | Lý do từ chối |
|---|---|---|
| **Chấp nhận mọi JWT chưa hết hạn trong 30s** | Bỏ qua kiểm tra DB nếu token còn hạn ký JWT trong 30s | **Rất nguy hiểm**: Không thể revoke session tức thì khi user bấm Logout hoặc đổi mật khẩu. |
| **Giữ nguyên 1 token trên bảng User** | Thêm cột `previousToken` vào bảng `User` | Không hỗ trợ nhiều thiết bị (Desktop + Mobile cùng đăng nhập một tài khoản). |
| **Redis Cache Distributed Lock** | Dùng Redis lưu token và khóa phân tán | Tăng chi phí hạ tầng và độ phức tạp vận hành không cần thiết ở giai đoạn hiện tại. |

---

## 4. Kế hoạch Chuyển đổi & Khôi phục (Migration & Rollback)
1. **Migration**:
   - Tạo model `AuthSession` trong Prisma schema.
   - Thêm quan hệ `User.sessions AuthSession[]`.
   - Vẫn giữ tạm thời trường `User.refreshToken` dạng nullable để tương thích ngược cho tới khi toàn bộ user migrate sang session mới.
2. **Rollback**:
   - Nếu phát sinh sự cố, có thể rollback code về logic fallback đọc `User.refreshToken` mà không làm hỏng dữ liệu người dùng.
