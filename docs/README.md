# Danh mục Tài liệu Dự án study-web (Project Documentation Hub)

Tài liệu được quản lý theo tiêu chuẩn **Docs-as-Code**, lưu trữ trực tiếp trong repository và tuân thủ cấu trúc chuẩn 3 phần (Thông tin - Nội dung - Tham khảo).

---

## 1. Sổ đăng ký Tài liệu (Document Register)

| Mã | Tài liệu | Version | Ngày | Tác giả | Trạng thái | Đường dẫn file |
|---|---|---|---|---|---|---|
| **DOC-01** | Đề xuất Dự án (Project Proposal) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [01-proposal.md](file:///d:/Projects/study-web/docs/01-proposal.md) |
| **DOC-03** | Danh sách Yêu cầu Sản phẩm (Product Backlog) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [03-product-backlog.md](file:///d:/Projects/study-web/docs/03-product-backlog.md) |
| **DOC-05** | Thiết kế Cơ sở Dữ liệu (Database Design) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [05-database.md](file:///d:/Projects/study-web/docs/05-database.md) |
| **DOC-06** | Sơ đồ Luồng Tuần tự (Workflows Hub - 13 Workflows) | 1.2 | 2026-10-15 | Nguyen Khanh Duy | Final | [workflows/README.md](file:///d:/Projects/study-web/docs/workflows/README.md) |
| **DOC-07** | Phân quyền Động & Entitlements (Dynamic Entitlements) | 1.0 | 2026-10-09 | Nguyen Khanh Duy | Final | [07-dynamic-authorization-and-entitlements.md](file:///d:/Projects/study-web/docs/07-dynamic-authorization-and-entitlements.md) |
| **DOC-08** | Contributor, Admin Review & Group-based IAM | 1.1 | 2026-10-13 | Nguyen Khanh Duy | Final | [08-contributor-admin-iam-sprint-roadmap.md](file:///d:/Projects/study-web/docs/08-contributor-admin-iam-sprint-roadmap.md) |
| **DOC-09** | Kế hoạch Nâng cấp Backend: IAM, Contributor & Review Queue | 1.1 | 2026-10-13 | Nguyen Khanh Duy | Implemented (Final) | [09-backend-iam-contributor-review-plan.md](file:///d:/Projects/study-web/docs/09-backend-iam-contributor-review-plan.md) |
| **DOC-11** | Phân tách Role Admin vs Contributor & Standalone App | 1.2 | 2026-10-15 | Nguyen Khanh Duy | Implemented (Final) | [11-admin-contributor-separation-and-user-crud.md](file:///d:/Projects/study-web/docs/11-admin-contributor-separation-and-user-crud.md) |
| **DOC-12** | Hướng dẫn Triển khai Admin Subdomain (Vercel/Nginx) | 1.0 | 2026-10-15 | Nguyen Khanh Duy | Final | [deployment/admin-subdomain-setup.md](file:///d:/Projects/study-web/docs/deployment/admin-subdomain-setup.md) |
| **DOC-13** | Phân tích Nâng cấp Auth, Lab Workspace và Contributor Studio | 1.0 | 2026-10-17 | Nguyen Khanh Duy & Antigravity | Implemented (Final) | [12-lab-platform-upgrade-analysis.md](12-lab-platform-upgrade-analysis.md) |
| **DOC-14** | Kế hoạch Phân công Agent — Nâng cấp Auth, Lab Workspace và Contributor Studio | 1.0 | 2026-10-17 | Nguyen Khanh Duy & Antigravity | Implemented (100% Verified) | [13-lab-platform-upgrade-agent-execution-plan.md](13-lab-platform-upgrade-agent-execution-plan.md) |
| **DOC-15** | Bộ Runbook Phân công Agent — Lab Platform Upgrade | 1.0 | 2026-10-17 | Nguyen Khanh Duy & Antigravity | Implemented (Final) | [agent-guides/README.md](agent-guides/README.md) |
| **DOC-16** | UI/UX, Localization, Low-Code Playwright & Dashboard — Agent Execution Plan | 1.0 | 2026-10-19 | Nguyen Khanh Duy & Antigravity | Implemented (100% Verified) | [14-ui-ux-localization-dashboard-agent-execution-plan.md](14-ui-ux-localization-dashboard-agent-execution-plan.md) |
| **ADR-001** | Architecture Decision Record: Auth Refresh Token Rotation & Session Mgmt | 1.0 | 2026-10-17 | Antigravity Architecture Agent | Accepted | [adr/ADR-001-auth-refresh-rotation.md](adr/ADR-001-auth-refresh-rotation.md) |
| **SPEC-01** | Quy chuẩn Markdown Block Grammar V1 | 1.0 | 2026-10-17 | Antigravity Platform Agent | Frozen | [specs/lab-markdown-v1.md](specs/lab-markdown-v1.md) |
| **SPEC-02** | Lab Content Contract Envelope V1 JSON Schema | 1.0 | 2026-10-17 | Antigravity Platform Agent | Frozen | [specs/lab-content-contract-v1.json](specs/lab-content-contract-v1.json) |
| **REP-01** | Báo cáo kiểm định Performance Budget | 1.0 | 2026-10-17 | Antigravity Platform Agent | Passed | [reports/lab-upgrade-performance.md](reports/lab-upgrade-performance.md) |
| **REP-02** | Báo cáo kiểm định An ninh (Security Audit) | 1.0 | 2026-10-17 | Antigravity Platform Agent | Passed | [reports/lab-upgrade-security.md](reports/lab-upgrade-security.md) |
| **REP-03** | Báo cáo tổng kết Release Readiness Audit | 1.0 | 2026-10-17 | Antigravity Platform Agent | Production Ready | [reports/release-readiness-audit.md](reports/release-readiness-audit.md) |

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
