# Danh mục Sơ đồ Luồng Hệ thống study-web (Workflows & Sequences Hub)

Thư mục này chứa toàn bộ các **Sơ đồ Tuần tự (Sequence Diagrams)** và phân tích luồng kỹ thuật chi tiết cho các chức năng cốt lõi của nền tảng **study-web**, tuân thủ cấu trúc chuẩn 3 phần (Thông tin - Nội dung - Tham khảo).

---

## Danh sách Sơ đồ Tuần tự (Sequence Diagrams)

| Mã | Tài liệu Luồng | Chức năng chính | Vai trò liên quan | Đường dẫn file |
|---|---|---|---|---|
| **WF-01** | Xác thực & Quản lý Phiên | Đăng nhập SĐT/Mật khẩu, phân quyền JWT và cơ chế Silent Refresh Token ngầm qua Cookie | Toàn bộ người dùng | [01-auth-and-session.md](file:///d:/Projects/study-web/Docs/workflows/01-auth-and-session.md) |
| **WF-02** | Truy cập Bài Lab & RBAC Guard | Luồng nghiệp vụ Trang chủ -> Danh sách Lab -> Mở bài Lab, kèm kiểm tra quyền Pro 2 lớp | User, UserPro, Admin | [02-lab-access-rbac.md](file:///d:/Projects/study-web/docs/workflows/02-lab-access-rbac.md) |
| **WF-03** | Chạy Kiểm thử Web Worker | Thực thi code học viên trên luồng nền trình duyệt, Timeout Guard 2s chống đơ tab | Học viên lập trình / Backend | [03-webworker-execution.md](file:///d:/Projects/study-web/Docs/workflows/03-webworker-execution.md) |
| **WF-04** | Nộp bài Lab & Ghi nhận Tiến độ | Luồng nghiệp vụ Workspace -> Do Lab -> Submit, lưu vết bài nộp và cập nhật trạng thái hoàn thành | Học viên, Dashboard cá nhân | [04-lab-submission-progress.md](file:///d:/Projects/study-web/docs/workflows/04-lab-submission-progress.md) |
| **WF-05** | Mô phỏng Mini-App Bắt Lỗi | Nhúng component cấy sẵn lỗi, thao tác tìm Bug trên UI và chấm tự động phiếu Bug Report | Học viên Tester | [05-tester-bug-simulation.md](file:///d:/Projects/study-web/docs/workflows/05-tester-bug-simulation.md) |
| **WF-07** | Nâng cấp Tài khoản & Thanh toán VNPAY | Luồng nghiệp vụ Popup Paywall -> Chọn gói Pricing -> Thanh toán qua VNPAY -> Kích hoạt quyền PRO | Toàn bộ người dùng | [07-upgrade-and-payment.md](file:///d:/Projects/study-web/docs/workflows/07-upgrade-and-payment.md) |
| **WF-08** | Quản trị Hệ thống (Admin Operations) | Luồng nghiệp vụ Quản lý User (Role, Suspend, Entitlements), Quản lý Lab, Gói cước và Audit Log | Quản trị viên (Admin) | [08-admin-operations.md](file:///d:/Projects/study-web/docs/workflows/08-admin-operations.md) |

---

## Mối liên kết với Tài liệu Hệ thống

- **Đề xuất Dự án tổng thể**: [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md)
- **Thiết kế Cơ sở Dữ liệu**: [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md)
- **Danh sách Yêu cầu Sản phẩm**: [03-product-backlog.md](file:///d:/Projects/study-web/Docs/03-product-backlog.md)
- **Trang chủ Tài liệu**: [Docs/README.md](file:///d:/Projects/study-web/Docs/README.md)
