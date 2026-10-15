# Authentication & Feedback Enhancement - Execution Plan & Working Memory

> **Trạng thái**: Hoàn thành toàn diện (COMPLETED)  
> **Mục tiêu**: 
> 1. Chuyển đổi toàn bộ UI Đăng nhập & Đăng ký sang tiếng Anh chuẩn, loại bỏ nút Đăng ký bằng Google tại trang Register.
> 2. Bổ sung bộ chọn nhanh các Chức năng hệ thống hiện có vào User Feedback Widget cùng các tag gợi ý báo lỗi siêu tốc.
> 3. Khắc phục triệt để lỗi Đăng ký tài khoản, đồng bộ điều kiện mật khẩu (>=8 ký tự), bổ sung validation số điện thoại (10 số, đầu số hợp lệ) và email định dạng chuẩn ở cả Frontend & Backend, hiển thị thông báo lỗi chi tiết theo từng trường hợp.

---

### Task 1: Chuyển đổi UI Login & Register sang tiếng Anh, Tinh giản Register Flow
- [x] **Subtask 1.1**: Chuẩn hóa tiếng Anh cho `LoginForm.tsx` & `AuthLayout.tsx`
  - Chuyển đổi: "Sign In", "Phone or Email", "Password", "Remember me", "Forgot password?", "Sign in with Google", "Don't have an account? Sign up for free".
  - Chuyển nút điều hướng trên AuthLayout: "Home", footer "© 2025 StudyIT.dev · Hands-on IT Learning".
  - *File*: `MODULE_FE/src/features/auth/components/LoginForm.tsx`, `MODULE_FE/src/layouts/AuthLayout.tsx`
  - *Verify*: `npx tsc --noEmit` exit 0, toàn bộ chuỗi ký tự đã được chuyển ngữ chuẩn.
- [x] **Subtask 1.2**: Chuẩn hóa tiếng Anh và loại bỏ Google OAuth trên `RegisterForm.tsx`
  - Chuyển đổi toàn bộ nhãn, placeholder, nút bấm, độ mạnh mật khẩu sang tiếng Anh.
  - Loại bỏ hoàn toàn nút "Đăng ký với Google" và đường kẻ phân cách "Hoặc / OR" (giữ trải nghiệm đăng nhập Google duy nhất tại Login).
  - *File*: `MODULE_FE/src/features/auth/components/RegisterForm.tsx`
  - *Verify*: `npx tsc --noEmit` exit 0, form tiếng Anh trực quan, sạch sẽ, không còn Google button.

---

### Task 2: Tích hợp Bộ chọn Chức năng Hệ thống vào Feedback Widget
- [x] **Subtask 2.1**: Thiết kế danh mục Chức năng Hệ thống & Chip gợi ý báo lỗi
  - Bổ sung nhóm chọn tính năng trực quan:
    - 📚 `Series & Learning Path` (Khám phá Series & Lộ trình)
    - 💻 `Practice Lab Workspace` (Không gian Thực hành)
    - ⚡ `Code Runner & Sandbox` (Trình chạy Code & Docker Sandbox)
    - ✍️ `Contributor Studio` (Soạn thảo Bài tập & Series)
    - 📊 `Dashboard & Submissions` (Tiến độ & Bài nộp)
    - 🔐 `Account & Auth` (Đăng nhập, Hồ sơ & Tài khoản)
  - Thêm danh sách Quick Issue Tags theo từng chức năng (ví dụ: Timeout runner, Lỗi giao diện, Sai test case, Không tải được bài).
  - Tự động gắn tag `[Tính năng: <Tên>]` vào nội dung feedback để Admin dễ dàng phân loại và hiển thị badge nổi bật.
  - *File*: `MODULE_FE/src/components/feedback/FeedbackWidget.tsx`, `MODULE_ADMIN/src/pages/admin/AdminFeedbackPage.tsx`
  - *Verify*: `npx tsc --noEmit` exit 0 trên cả FE & ADMIN; giao diện widget có grid tính năng & chip gợi ý.

---

### Task 4: Sửa lỗi Đăng ký, Tăng cường Validation Phone & Email ở 2 đầu FE & BE
- [x] **Subtask 4.1**: Cập nhật DTO & Service Validation tại Backend
  - Đồng bộ `RegisterDto`: Mật khẩu `@MinLength(8)`, Email `@IsEmail()`, Số điện thoại `@Matches` regex chuẩn 10 chữ số Việt Nam (`/^(?:\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/`).
  - Phân tách thông báo lỗi rõ ràng trong `auth.service.ts`: "This email is already in use." vs "This phone number is already in use.".
  - *File*: `MODULE_BE/src/modules/auth/auth.dto.ts`, `MODULE_BE/src/modules/auth/auth.service.ts`
  - *Verify*: `npm run build` Backend thành công; gọi test API xác nhận bắt chính xác số điện thoại sai đầu số/độ dài.
- [x] **Subtask 4.2**: Cải tiến Form Validation & Error Handling chi tiết tại `RegisterForm.tsx`
  - Thêm validate realtime:
    - Số điện thoại: kiểm tra độ dài (chính xác 10 số nếu bắt đầu bằng 0), đầu số mạng viễn thông VN hợp lệ.
    - Email: bắt buộc (không để optional sai lệch với backend), kiểm tra chuẩn cú pháp RFC.
    - Mật khẩu: tối thiểu 8 ký tự (khắc phục lỗi lệch 6 vs 8 ký tự gây lỗi 400).
    - Khớp mật khẩu xác nhận.
  - Xử lý bắt lỗi Axios chính xác từ backend (hiển thị đúng lỗi email trùng / sđt trùng thay vì lỗi gộp mơ hồ).
  - *File*: `MODULE_FE/src/features/auth/components/RegisterForm.tsx`
  - *Verify*: `npx tsc --noEmit` exit 0, form hiển thị lỗi inline khi phone hoặc email sai format, bóc tách chính xác server message.

---

### Task 5: Build Gate & Kiểm thử Toàn diện
- [x] **Subtask 5.1**: Chạy Build Gate cho cả 2 module Frontend (`MODULE_FE`) và Backend (`MODULE_BE`).
  - *Verify*: `npm run build` exit 0 trên `MODULE_FE` (768ms), `MODULE_ADMIN` (812ms) và `MODULE_BE`.
- [x] **Subtask 5.2**: Test luồng thực tế: Đăng ký tài khoản mới -> Đăng nhập bằng tài khoản mới -> Mở feedback gửi báo cáo kèm tag chức năng.
  - *Verify*: Test suite chạy qua 5 kịch bản (đăng ký thành công 201, bắt trùng email 400, bắt trùng SĐT 400, đăng nhập lấy JWT token 200, tạo feedback có tag tính năng 201) đều passed 100%.
