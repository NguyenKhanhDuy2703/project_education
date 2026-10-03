# Danh mục Tài liệu Dự án study-web (Project Documentation Hub)

Tài liệu được quản lý theo tiêu chuẩn **Docs-as-Code**, lưu trữ trực tiếp trong repository và tuân thủ cấu trúc chuẩn 3 phần (Thông tin - Nội dung - Tham khảo).

---

## 1. Sổ đăng ký Tài liệu (Document Register)

| Mã | Tài liệu | Version | Ngày | Tác giả | Trạng thái | Đường dẫn file |
|---|---|---|---|---|---|---|
| **DOC-01** | Đề xuất Dự án (Project Proposal) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [01-proposal.md](file:///d:/Projects/study-web/Docs/01-proposal.md) |
| **DOC-03** | Danh sách Yêu cầu Sản phẩm (Product Backlog) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [03-product-backlog.md](file:///d:/Projects/study-web/Docs/03-product-backlog.md) |
| **DOC-05** | Thiết kế Cơ sở Dữ liệu (Database Design) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [05-database.md](file:///d:/Projects/study-web/Docs/05-database.md) |
| **DOC-06** | Sơ đồ Luồng Tuần tự (Workflows Hub) | 1.0 | 2026-10-02 | Nguyen Khanh Duy | Final | [workflows/README.md](file:///d:/Projects/study-web/Docs/workflows/README.md) |

---

## 2. Thông tin Đội ngũ Dự án (Team Organisation)

| Họ và Tên | Bí danh (Alias) | Vai trò chính | Phạm vi phụ trách chính |
|---|---|---|---|
| **Nguyen Khanh Duy** | Duy | Product Owner / Fullstack Lead | Kiến trúc tổng thể, Core Backend (NestJS), Prisma DB, Thiết kế UI & Series bài lab thực hành |

---

## 3. Lịch trình Tổng thể (Master Timeline - Lab Series Model)

| Mốc thời gian | Giai đoạn | Trọng tâm công việc | Kết quả đầu ra |
|---|---|---|---|
| **Sprint 1 (Tuần 1–2)** | Nền tảng cốt lõi (Core Foundation) | Khởi tạo PostgreSQL, Prisma ORM, Auth JWT & RBAC, Giao diện Hub Series | Hệ thống xác thực an toàn, phân quyền 3 cấp, trang chủ Series |
| **Sprint 2 (Tuần 3–4)** | Không gian Lab & Dự án mẫu | Trang chi tiết Series, Trình đọc hướng dẫn Lab Markdown, Liên kết source app mẫu | Học viên đọc được đề bài lab và lấy source mẫu để thực hành |
| **Sprint 3 (Tuần 5–6)** | Nộp bài Lab & Dashboard | Form nộp bài lab, Xem đáp án chuẩn cho tài khoản Pro, Theo dõi tiến độ | Hệ thống nộp bài, lưu vết tiến trình học tập |
| **Sprint 4 (Tuần 7–8)** | Quản trị Admin & CMS Lab | Quản lý người dùng, phân quyền Pro, CMS tạo/sửa Series & Lab, Tối ưu CI/CD | Hệ thống sẵn sàng đưa vào vận hành thực tế |

---

## 4. Các Quy tắc & Kỹ năng Kèm theo (Rules & Skills)

- **Quy chuẩn Git & CI/CD**: [git-workflow.md](file:///d:/Projects/study-web/.agents/rules/git-workflow.md)
- **Kỹ năng Chuyển đổi Tài liệu**: [SKILL.md](file:///d:/Projects/study-web/.agents/skills/docs-as-code/SKILL.md)
