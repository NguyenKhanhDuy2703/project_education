---
doc_type: product-backlog
title: Danh sách Yêu cầu Sản phẩm study-web — Mô hình Lab Series (Product Backlog)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Product Owner & Fullstack Lead}
scope: Backlog tập trung vào Core Web và Phân hệ Series Bài Lab Thực hành
date: 2026-10-02
source_file: "MODULE_FE/src, MODULE_BE/src"
status: final
language: vi
related_docs: [01-proposal.md, 05-database.md]
---

# Danh sách Yêu cầu Sản phẩm study-web (Product Backlog)

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Danh sách Yêu cầu Sản phẩm study-web — Mô hình Lab Series |
| **Version** | v1.1 |
| **Người làm** | Nguyen Khanh Duy (Product Owner & Fullstack Lead) |
| **Phạm vi (Scope)** | Danh sách User Stories (PBI) tập trung vào Core hệ thống và các Series bài Lab thực hành ngắn hạn |
| **Thời gian** | 2026-10-02 |
| **Tham chiếu từ** | Hiện trạng codebase và định hướng tinh gọn: không làm khóa học, chỉ làm series bài lab thực hành |

---

## 2. Nội dung chính (Content)

### 2.1. TL;DR (Tóm tắt cốt lõi)
- **Cấu trúc Epics**: 5 Epics tinh gọn, tập trung hoàn toàn vào **Core Web (Auth, RBAC, Profile)** và **Series bài Lab thực hành**.
- **Ước lượng**: Sử dụng Story Points (SP) theo dãy Fibonacci (1, 2, 3, 5, 8).
- **Chu kỳ Sprint**: 4 Sprint (mỗi Sprint 2 tuần) với mục tiêu đưa MVP thực hành lab vào hoạt động sớm nhất.

### 2.2. Danh sách Epics Tinh gọn
1. **EPIC-01: Core Auth & Phân quyền RBAC (User, UserPro, Admin)**
2. **EPIC-02: Khám phá Series & Danh mục Bài Lab (Lab Series Hub)**
3. **EPIC-03: Không gian Thực hành Lab với App Mẫu (Lab Workspace & Spec)**
4. **EPIC-04: Nộp bài Lab & Ghi nhận Tiến độ (Lab Submission & Progress)**
5. **EPIC-05: Quản trị Hệ thống & Quản lý Bài Lab (Admin CMS & User Control)**

---

### 2.3. Bảng Chi tiết Product Backlog Items (PBI)

| ID | Epic | User Story (As a / I want / So that) | Acceptance Criteria (Tiêu chí chấp thuận) | Điểm (SP) | Ưu tiên | Sprint |
|---|---|---|---|---|---|---|
| **PB-01** | EPIC-01 | **Là** khách truy cập, **tôi muốn** đăng ký tài khoản bằng SĐT và mật khẩu, **để** lưu vết các bài lab tôi đã thực hành. | - Validate định dạng số điện thoại VN.<br>- Mật khẩu tối thiểu 6 ký tự.<br>- Không cho phép trùng SĐT (trả về 409 Conflict). | 3 | Must | Sprint 1 |
| **PB-02** | EPIC-01 | **Là** người dùng, **tôi muốn** đăng nhập và nhận JWT an toàn qua Cookie, **để** hệ thống nhận diện vai trò (`user`, `userPro`, `admin`). | - Trả về `accessToken` và gán `refreshToken` vào HttpOnly Cookie.<br>- Tự động giải mã vai trò để điều hướng. | 3 | Must | Sprint 1 |
| **PB-03** | EPIC-01 | **Là** học viên, **tôi muốn** cơ chế tự động Refresh Token, **để** phiên làm việc không bị gián đoạn khi tôi đang đọc hướng dẫn lab. | - Axios Interceptor tự động gọi `/auth/refresh` khi gặp lỗi 401.<br>- Điều hướng về trang đăng nhập nếu refresh thất bại. | 3 | Must | Sprint 1 |
| **PB-04** | EPIC-01 | **Là** học viên, **tôi muốn** xem trang Dashboard cá nhân và cập nhật thông tin (Tên, Avatar), **để** quản lý hồ sơ của mình. | - Hiển thị tên, avatar và nhãn phân quyền (`Free` hoặc `Pro Badge`).<br>- Cho phép cập nhật `name`, `avatarUrl`, `defaultAddress`. | 2 | Should | Sprint 2 |
| **PB-05** | EPIC-02 | **Là** học viên, **tôi muốn** xem danh sách các Series bài lab (Tester, Backend, DevOps) trên Trang chủ, **để** chọn chuỗi bài lab cần rèn luyện. | - Hiển thị thẻ Series gồm: Tên series, chuyên môn, số lượng bài lab, thời lượng ước tính.<br>- Có bộ lọc theo chuyên môn (Tester / Backend / DevOps). | 3 | Must | Sprint 1 |
| **PB-06** | EPIC-02 | **Là** học viên, **tôi muốn** xem danh sách bài lab trong một Series, **để** biết thứ tự các bài thực hành cần làm. | - Danh sách bài lab hiển thị theo `orderIndex`.<br>- Hiển thị nhãn `Miễn phí` hoặc `Pro Only` cho từng bài lab. | 2 | Must | Sprint 2 |
| **PB-07** | EPIC-03 | **Là** học viên, **tôi muốn** mở không gian làm bài lab (Lab Workspace) gồm đề bài, mục tiêu và hướng dẫn từng bước bằng Markdown, **để** thực hành dễ dàng. | - Hỗ trợ hiển thị Markdown, code snippet có highlight cú pháp.<br>- Cung cấp mã mẫu ban đầu (Initial Snippet) và dữ liệu đầu vào. | 3 | Must | Sprint 2 |
| **PB-08** | EPIC-03 | **Là** học viên, **tôi muốn** truy cập trang Dự án mẫu xuyên suốt, **để** lấy source code và tài liệu Swagger API phục vụ làm lab. | - Cung cấp link GitHub repository của app mẫu.<br>- Cung cấp link Swagger UI tương tác trực tiếp API app mẫu. | 2 | Must | Sprint 2 |
| **PB-09** | EPIC-03 | **Là** học viên thường, **khi tôi** bấm vào bài lab thuộc nhóm `Pro Only`, **tôi muốn** thấy màn hình giới thiệu nâng cấp Pro, **để** biết quyền lợi tài khoản. | - Chặn xem chi tiết đề bài nếu tài khoản là `user` thường.<br>- Hiển thị modal/banner giới thiệu nâng cấp `UserPro`. | 2 | Should | Sprint 2 |
| **PB-10** | EPIC-03 | **Là** học viên Tester làm lab bắt lỗi, **tôi muốn** có phần "Gợi ý lỗi (Bug Hints)", **để** đối chiếu sau khi tự mình tìm kiếm trên app mẫu. | - Nút đóng/mở gợi ý tránh làm lộ kết quả trước khi tự làm.<br>- Phân loại lỗi theo mức độ: Critical, Major, Minor. | 3 | Should | Sprint 3 |
| **PB-11** | EPIC-04 | **Là** học viên, **tôi muốn** nộp kết quả bài lab (link pull request, đoạn code giải, hoặc file test case), **để** hệ thống lưu vết bài làm. | - Form nộp kết quả lưu vào bảng `lab_submissions`.<br>- Hiển thị trạng thái nộp bài (`pending`, `passed`, `failed`). | 3 | Must | Sprint 3 |
| **PB-12** | EPIC-04 | **Là** học viên Pro, **sau khi nộp bài**, **tôi muốn** xem đáp án chuẩn (Solution) và giải thích chi tiết, **để** so sánh với cách giải của mình. | - Chỉ hiển thị mục `Solution` nếu học viên có quyền `userPro` hoặc `admin`.<br>- Cung cấp code mẫu chuẩn hoặc bộ test case hoàn chỉnh. | 3 | Should | Sprint 3 |
| **PB-13** | EPIC-04 | **Là** học viên, **tôi muốn** thấy số bài lab đã hoàn thành và thanh tiến độ trên Dashboard, **để** duy trì động lực thực hành liên tục. | - Tự động đánh dấu hoàn thành bài lab vào bảng `user_progress`.<br>- Hiển thị % hoàn thành từng Series và tổng số lab đã làm xong. | 3 | Should | Sprint 3 |
| **PB-14** | EPIC-05 | **Là** Admin, **tôi muốn** tìm kiếm người dùng và nâng cấp tài khoản từ `User` lên `UserPro`, **để** kích hoạt quyền làm lab Pro cho học viên. | - Danh sách người dùng có tìm kiếm theo Tên/SĐT/Email.<br>- Nút chuyển đổi vai trò (`user` <-> `userPro`) có hộp thoại xác nhận. | 3 | Must | Sprint 4 |
| **PB-15** | EPIC-05 | **Là** Admin, **tôi muốn** tạo và chỉnh sửa các Series bài lab và từng bài lab qua giao diện CMS, **để** cập nhật nội dung thực hành mới. | - Form tạo/sửa Series (tên, chuyên mục, dự án mẫu gắn kèm, cờ Pro).<br>- Trình soạn thảo hướng dẫn bài lab bằng Markdown có Live Preview. | 5 | Could | Sprint 4 |

---

### 2.4. Kế hoạch Phân bổ Sprint (Sprint Plan)

| Sprint | Trọng tâm bàn giao | PBI hoàn thành | Tổng SP |
|---|---|---|---|
| **Sprint 1** | Hoàn thiện Core Auth, RBAC, CSDL PostgreSQL và giao diện Trang chủ Hub Series | PB-01, PB-02, PB-03, PB-05 | 11 |
| **Sprint 2** | Danh mục Series, Không gian làm bài Lab (Workspace) & Tích hợp App Mẫu | PB-04, PB-06, PB-07, PB-08, PB-09 | 12 |
| **Sprint 3** | Nộp bài lab, Xem đáp án chuẩn (Pro) & Theo dõi tiến độ trên Dashboard | PB-10, PB-11, PB-12, PB-13 | 12 |
| **Sprint 4** | Quản trị người dùng Admin, CMS biên tập Series/Lab và Tối ưu CI/CD | PB-14, PB-15 | 8 |

### 2.5. Lịch sử sửa đổi (Revision History)

| Version | Ngày | Tác giả | Ghi chú thay đổi |
|---|---|---|---|
| 1.0 | 2026-10-02 | Nguyen Khanh Duy | Khởi tạo ban đầu |
| 1.1 | 2026-10-02 | Nguyen Khanh Duy | **Điều chỉnh định hướng**: Chuyển đổi toàn bộ PBI theo mô hình Series bài Lab thực hành ngắn hạn |

### 2.6. Vấn đề tồn đọng (Open Issues)
- Đang đánh giá việc bổ sung tính năng nộp bài bằng liên kết GitHub Webhook tự động kiểm tra cú pháp bài giải (để dành cho giai đoạn sau MVP).

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn Routes & Components**:
  - Giao diện người dùng: [MODULE_FE/src](file:///d:/Projects/study-web/MODULE_FE/src)
  - Phân hệ xác thực & RBAC: [MODULE_BE/src/modules/auth](file:///d:/Projects/study-web/MODULE_BE/src/modules/auth)
- **Tài liệu liên quan**:
  - Đề xuất Dự án: [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md)
  - Thiết kế Cơ sở Dữ liệu: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
