---
doc_type: proposal
title: Đề xuất Dự án study-web — Nền tảng Thực hành Lab IT Qua Dự án Mẫu
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Core hệ thống study-web và Phân hệ Series Bài Lab Thực hành (không làm khóa học dài)
date: 2026-10-02
source_file: "MODULE_FE/src, MODULE_BE/src"
status: final
language: vi
related_docs: [03-product-backlog.md, 05-database.md]
---

# Đề xuất Dự án study-web — Nền tảng Thực hành Lab IT Qua Dự án Mẫu

## 1. Thông tin tài liệu (Document Information)

| Thuộc tính | Chi tiết |
|---|---|
| **Tên tài liệu** | Đề xuất Dự án study-web — Nền tảng Thực hành Lab IT Qua Dự án Mẫu |
| **Version** | v1.1 |
| **Người làm** | Nguyen Khanh Duy (Lead Developer / Software Architect) |
| **Phạm vi (Scope)** | Xây dựng Core hệ thống (Auth, RBAC, Profile, Dashboard) và Phân hệ các Series bài Lab thực hành ngắn hạn |
| **Thời gian** | 2026-10-02 |
| **Tham chiếu từ** | Hiện trạng codebase và định hướng tinh gọn: thay thế khóa học dài bằng chuỗi bài lab thực chiến ngắn |

---

## 2. Nội dung chính (Content)

### 2.1. TL;DR (Tóm tắt cốt lõi)
- **Định hướng sản phẩm**: study-web **không** phát triển theo mô hình các khóa học (courses) lý thuyết dài dòng, mà tập trung 100% vào **các Series bài Lab thực hành ngắn (Hands-on Lab Series)** xoay quanh **1 dự án mẫu thực tế**.
- **Mục tiêu**: Người học vào là làm được ngay, mỗi bài lab chỉ kéo dài 15–30 phút, giải quyết một vấn đề cụ thể (viết 1 bộ Test Case, bắt 1 con Bug, code 1 REST API, viết 1 file Dockerfile, cấu hình 1 workflow CI/CD).
- **Phạm vi Core ban đầu**:
  1. *Core Platform*: Hệ thống xác thực bảo mật JWT (Access + Refresh Token qua Cookie), phân quyền 3 cấp (User, UserPro, Admin), Dashboard quản lý tiến độ.
  2. *Lab Series Hub*: Quản lý và cung cấp danh sách các Series bài lab phân theo chuyên môn (Tester, Backend, DevOps).
  3. *Lab Workspace*: Đề bài lab, hướng dẫn từng bước, mã mẫu/dữ liệu mẫu và cơ chế nộp kết quả thực hành.

### 2.2. Phân công & Vai trò (Who does what)

| Vai trò / Đối tượng | Trách nhiệm trong hệ thống |
|---|---|
| **Học viên thường (User)** | Tiếp cận các Series bài lab cơ bản miễn phí, đọc hướng dẫn thực hành, nộp bài lab mức căn bản. |
| **Học viên Pro (UserPro)** | Mở khóa toàn bộ các Series bài lab chuyên sâu (nâng cao về API, ISTQB, Docker, CI/CD), nhận đáp án mẫu chuẩn công nghiệp. |
| **Quản trị viên (Admin)** | Quản lý tài khoản, nâng cấp quyền UserPro cho học viên, tạo/sửa các Series và bài Lab qua CMS. |
| **Hệ sinh thái Dự án mẫu** | Đóng vai trò là "vật liệu thực hành" cho tất cả các bài lab: cung cấp repo GitHub, tài liệu Swagger API, và các bug cố ý để học viên tìm kiếm. |

### 2.3. Bối cảnh & Lý do chọn mô hình "Series Lab ngắn"
- **Vấn đề của khóa học truyền thống**: Quá nhiều video lý thuyết lan man, người học dễ nản và bỏ dở giữa chừng (tỷ lệ drop-off > 85%).
- **Lợi thế của Series bài Lab ngắn**:
  - *Thời lượng tinh gọn*: Mỗi bài lab giải quyết trọn vẹn 1 task thực tế (15–30 phút).
  - *Học bằng cách làm (Learn by Doing)*: Đọc đề bài -> Mở project mẫu -> Thực hành -> Đối chiếu đáp án.
  - *Dễ theo dõi*: Học viên hoàn thành từng lab và nhìn thấy ngay tiến độ (Progress Streak) tích lũy trên trang cá nhân.

### 2.4. Danh mục các Series Lab Dự kiến cho MVP

| Series Lab | Chuyên môn | Nội dung bài lab tiêu biểu | Độ dài dự kiến |
|---|---|---|---|
| **Series 01: Lab Bắt Lỗi & Test API App Mẫu** | Tester | - Lab 01: Thiết kế Test Case màn Đăng nhập/Đăng ký<br>- Lab 02: Bắt lỗi giao diện & logic trên app mẫu<br>- Lab 03: Kiểm thử API với Postman & Swagger | 3–5 bài lab |
| **Series 02: Lab Luyện Đề ISTQB Foundation** | Tester | - Lab 01: Kỹ thuật phân vùng tương đương (EP) & giá trị biên (BVA)<br>- Lab 02: Bảng quyết định & chuyển trạng thái<br>- Lab 03: Bộ đề thi thử 40 câu có giải thích | 3–4 bài lab |
| **Series 03: Lab Xây dựng RESTful API với NestJS** | Backend | - Lab 01: Setup module Auth & mã hóa mật khẩu Bcrypt<br>- Lab 02: Thiết kế Prisma Model & truy vấn PostgreSQL<br>- Lab 03: Phân quyền RBAC qua Guard | 3–5 bài lab |
| **Series 04: Lab Đóng Gói Docker & Tự Động Hóa CI/CD** | DevOps / BE | - Lab 01: Viết Dockerfile tối ưu đa tầng (Multi-stage build)<br>- Lab 02: Soạn `docker-compose.yml` kết nối Postgres & App<br>- Lab 03: Cấu hình GitHub Actions chạy Test tự động | 3 bài lab |

### 2.5. Chỉ số Đánh giá Hiệu quả (KPIs)
- **Tỷ lệ hoàn thành Lab**: > 70% người bắt đầu một Series hoàn thành ít nhất 3 bài lab.
- **Tương tác**: Thời gian trung bình giải quyết 1 bài lab từ 15 đến 35 phút.
- **Tốc độ hệ thống Core**: Tải trang bài lab < 100ms, API xác thực < 150ms.

### 2.6. Lịch sử sửa đổi (Revision History)

| Version | Ngày | Tác giả | Ghi chú thay đổi |
|---|---|---|---|
| 1.0 | 2026-10-02 | Nguyen Khanh Duy | Bản khởi tạo đầu tiên |
| 1.1 | 2026-10-02 | Nguyen Khanh Duy | **Tinh gọn phạm vi**: Chuyển từ mô hình khóa học (courses) sang Series các bài Lab thực hành ngắn xoay quanh dự án mẫu |

### 2.7. Vấn đề tồn đọng (Open Issues)
- Đang cân nhắc việc cho phép học viên nộp bài lab dưới dạng link GitHub Pull Request hay form nhập liệu / upload file text trực tiếp.

---

## 3. Tài liệu tham khảo & Liên kết (References)

- **Mã nguồn dự án**:
  - Giao diện người dùng: [MODULE_FE/src](file:///d:/Projects/study-web/MODULE_FE/src)
  - Dịch vụ lõi Backend: [MODULE_BE/src](file:///d:/Projects/study-web/MODULE_BE/src)
  - Khai báo Schema CSDL: [MODULE_BE/prisma/schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **Tài liệu liên quan**:
  - Thiết kế Cơ sở Dữ liệu tinh gọn: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
  - Danh sách Yêu cầu & Backlog: [03-product-backlog.md](file:///d:/Projects/study-web/Docs/03-product-backlog.md)
