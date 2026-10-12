# Danh mục Sơ đồ Luồng Hệ thống study-web (Workflows & Sequences Hub)

Thư mục này chứa toàn bộ các **Sơ đồ Tuần tự (Sequence Diagrams)** và phân tích luồng kỹ thuật chi tiết cho các chức năng cốt lõi của nền tảng **study-web**, tuân thủ cấu trúc chuẩn 3 phần (Thông tin - Nội dung - Tham khảo).

---

## Danh sách Sơ đồ Tuần tự (Sequence Diagrams)

| Mã | Tài liệu Luồng | Chức năng chính | Vai trò liên quan | Đường dẫn file |
|---|---|---|---|---|
| **WF-01** | Xác thực & Quản lý Phiên | Luồng đăng nhập Email/Password & Google OAuth, phân quyền JWT và cơ chế Silent Refresh qua Cookie | Toàn bộ người dùng | [01-auth-and-session.md](file:///d:/Projects/study-web/docs/workflows/01-auth-and-session.md) |
| **WF-02** | Truy cập Bài Lab & RBAC Guard | Khám phá Series, Mở Lab Workspace và Kiểm tra phân quyền tài khoản Pro 2 lớp | User, UserPro, Admin | [02-lab-access-rbac.md](file:///d:/Projects/study-web/Docs/workflows/02-lab-access-rbac.md) |
| **WF-03** | Chạy Kiểm thử Web Worker | Thực thi code học viên trên luồng nền trình duyệt, Timeout Guard 2s chống đơ tab | Học viên lập trình / Backend | [03-webworker-execution.md](file:///d:/Projects/study-web/Docs/workflows/03-webworker-execution.md) |
| **WF-04** | Nộp bài Lab & Ghi nhận Tiến độ | Lưu lịch sử bài nộp chi tiết và cập nhật bản ghi trạng thái hoàn thành O(1) vào CSDL | Học viên, Dashboard cá nhân | [04-lab-submission-progress.md](file:///d:/Projects/study-web/Docs/workflows/04-lab-submission-progress.md) |
| **WF-05** | Mô phỏng Mini-App Bắt Lỗi | Nhúng component cấy sẵn lỗi, thao tác tìm Bug trên UI và chấm tự động phiếu Bug Report | Học viên Tester | [05-tester-bug-simulation.md](file:///d:/Projects/study-web/Docs/workflows/05-tester-bug-simulation.md) |

---

## Mối liên kết với Tài liệu Hệ thống

- **Đề xuất Dự án tổng thể**: [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md)
- **Thiết kế Cơ sở Dữ liệu**: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
- **Danh sách Yêu cầu Sản phẩm**: [03-product-backlog.md](file:///d:/Projects/study-web/Docs/03-product-backlog.md)
- **Trang chủ Tài liệu**: [Docs/README.md](file:///d:/Projects/study-web/Docs/README.md)
