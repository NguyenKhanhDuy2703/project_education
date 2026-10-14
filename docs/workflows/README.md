# Danh mục Sơ đồ Luồng Hệ thống study-web (Workflows & Sequences Hub)

Thư mục này chứa toàn bộ các **Sơ đồ Tuần tự (Sequence Diagrams)** và tài liệu đặc tả luồng kỹ thuật chi tiết cho từng tính năng độc lập của nền tảng **study-web**, tuân thủ nghiêm ngặt chuẩn cấu trúc **3 phần (Thông tin - Nội dung - Tham khảo)** theo quy chuẩn `docs-as-code`.

Mọi luồng chức năng đều được tách riêng thành từng file độc lập (không gộp chung), minh họa rõ ràng các điểm chạm người dùng (User Touchpoints), luồng dữ liệu giữa Frontend (React/Redux), Backend (NestJS), CSDL (PostgreSQL) và các dịch vụ bên thứ ba (Web Worker, VNPAY).

---

## Danh sách Sơ đồ Tuần tự Chi tiết (Granular Sequence Workflows)

| Mã Luồng | Tên Tài liệu Luồng | Chức năng & Phạm vi Kỹ thuật | Vai trò Liên quan | Đường dẫn File Markdown |
|---|---|---|---|---|
| **WF-01** | **Xác thực & Điều hướng Trang chủ** | Đăng nhập SĐT/Mật khẩu, Google OAuth, cấp phát cặp Access Token (15m)/Refresh Token HttpOnly (7d), cơ chế Silent Refresh ngầm và tự động điều hướng theo Role | Toàn bộ Người dùng | [01-auth-login-to-home.md](file:///d:/Projects/study-web/docs/workflows/01-auth-login-to-home.md) |
| **WF-02** | **Khám phá Khóa học & Lọc Thẻ Topic** | Truy cập Catalog, tải danh mục Series, bộ lọc tức thì theo Thẻ Topic Tags, tìm kiếm từ khóa, xem lộ trình học và kiểm tra quyền truy cập bài Lab 2 lớp | Học viên, Khách vãng lai | [02-catalog-topic-discovery.md](file:///d:/Projects/study-web/docs/workflows/02-catalog-topic-discovery.md) |
| **WF-03** | **Thực hành Lab & Sandbox Web Worker** | Bố cục Workspace 2 panel, soạn thảo Monaco Editor, thực thi JavaScript/SQL trên luồng nền OS Web Worker, Timeout Guard 2s chống treo tab | Học viên thực hành | [03-lab-practice-webworker.md](file:///d:/Projects/study-web/docs/workflows/03-lab-practice-webworker.md) |
| **WF-04** | **Nộp Bài Lab & Ghi nhận Tiến độ** | Chu trình nộp bài, lưu vết lịch sử không giới hạn vào `lab_submissions`, cập nhật trạng thái đơn nhất vào `user_progress` (Upsert), đồng bộ Dashboard | Học viên, Hệ thống | [04-lab-submission-progress.md](file:///d:/Projects/study-web/docs/workflows/04-lab-submission-progress.md) |
| **WF-05** | **Tạo Series & Gắn Thẻ Topic** | Modal popup tạo Series nhanh, sinh slug SEO, chọn Thẻ Topic có sẵn, cập nhật tức thì Redux State (Optimistic) không cần reload trang | Contributor, Quản trị viên | [05-create-series.md](file:///d:/Projects/study-web/docs/workflows/05-create-series.md) |
| **WF-06** | **Studio Tạo Bài Lab 2 Bước** | Step 1 Soạn Lý thuyết Markdown (Live Preview song song) $\to$ Step 2 Cấu hình Bài tập (Starter, Solution, Test Cases trực quan), bắt buộc Chạy thử Solution trước khi gửi duyệt | Contributor, Giảng viên | [06-create-lab-studio.md](file:///d:/Projects/study-web/docs/workflows/06-create-lab-studio.md) |
| **WF-07** | **Duyệt & Xuất bản Nội dung** | Vòng đời nội dung (`draft` $\to$ `submitted` $\to$ `changes_requested` / `approved` $\to$ `published`), Hàng đợi duyệt Review Queue, phân trang 10 mục/trang, ghi vết Audit Log | Contributor, Quản trị viên | [07-content-review-and-publish.md](file:///d:/Projects/study-web/docs/workflows/07-content-review-and-publish.md) |
| **WF-08** | **Quản trị Thẻ Topic Toàn Hệ thống** | Admin quản lý tập trung Thẻ Topic dùng chung (CRUD Tags, mã màu, chống rác thẻ), phát sự kiện `topic-tags-updated` đồng bộ thời gian thực tới Contributor và Catalog | Quản trị viên (Admin) | [08-admin-topic-governance.md](file:///d:/Projects/study-web/docs/workflows/08-admin-topic-governance.md) |
| **WF-09** | **Quản trị Người dùng & Phân quyền** | Bảng người dùng phân trang 10 dòng/trang, thay đổi Role (User, Pro, Contributor, Admin), khóa tài khoản Suspend thu hồi phiên tức thì, cấp Feature Overrides độc lập | Quản trị viên (Admin) | [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md) |
| **WF-10** | **Quản trị Nhóm Người dùng 2 Bảng** | Bố cục Split View tách riêng khỏi Plans: Thư mục nhóm bên trái (~35%) và danh sách thành viên bên phải (~65%), thêm/xóa thành viên tức thời kèm phân trang riêng | Quản trị viên (Admin) | [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md) |
| **WF-11** | **Thu thập & Xử lý Ý kiến Phản hồi** | Form gửi góp ý/báo lỗi tự động đính kèm URL ngữ cảnh, Bảng điều khiển `/admin/feedback` với 4 thẻ thống kê KPI, bộ lọc danh mục và Modal xem chi tiết | Học viên, Quản trị viên | [11-user-feedback-loop.md](file:///d:/Projects/study-web/docs/workflows/11-user-feedback-loop.md) |
| **WF-12** | **Nâng cấp PRO & Thanh toán VNPAY** | Modal Paywall bảng giá gói Tháng/Năm, chuyển tiếp Cổng VNPAY, Webhook IPN đối soát chữ ký bảo mật HMAC-SHA512, kích hoạt huy hiệu PRO và mở khóa bài học | Học viên, Cổng VNPAY | [12-upgrade-and-payment.md](file:///d:/Projects/study-web/docs/workflows/12-upgrade-and-payment.md) |

---

## Mối liên kết với Kiến trúc Dự án

- **Đề xuất Dự án tổng thể**: [01-proposal.md](file:///d:/Projects/study-web/docs/01-proposal.md)
- **Danh sách Yêu cầu Sản phẩm**: [03-product-backlog.md](file:///d:/Projects/study-web/docs/03-product-backlog.md)
- **Thiết kế Kiến trúc Hệ thống**: [04-architecture.md](file:///d:/Projects/study-web/docs/04-architecture.md)
- **Thiết kế Cơ sở Dữ liệu**: [05-database.md](file:///d:/Projects/study-web/docs/05-database.md)
- **Đặc tả Phân quyền Động & Entitlements**: [07-dynamic-authorization-and-entitlements.md](file:///d:/Projects/study-web/docs/07-dynamic-authorization-and-entitlements.md)
- **Trang chủ Toàn bộ Tài liệu**: [docs/README.md](file:///d:/Projects/study-web/docs/README.md)
