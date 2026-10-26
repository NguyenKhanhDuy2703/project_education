# Danh mục Tài liệu Dự án study-web (Project Documentation Hub)

Tài liệu được quản lý theo tiêu chuẩn **Docs-as-Code**, lưu trữ trực tiếp trong repository và tuân thủ cấu trúc chuẩn 3 phần (Thông tin - Nội dung - Tham khảo).

---

## 1. Sổ đăng ký Tài liệu (Document Register)

| Mã | Tài liệu | Version | Ngày | Tác giả | Trạng thái | Đường dẫn file |
|---|---|---|---|---|---|---|
| **DOC-01** | Đề xuất Dự án (Project Proposal) | 1.1 | 2026-10-02 | Nguyen Khanh Duy | Final | [01-proposal.md](01-proposal.md) |
| **DOC-03** | Product Backlog — Stabilization First | 1.3 | 2026-10-26 | Nguyen Khanh Duy | Implemented & Verified (Manual milestone Done, automated scope Blocked) | [03-product-backlog.md](03-product-backlog.md) |
| **DOC-05** | Thiết kế Cơ sở Dữ liệu (Database Design) | 1.3 | 2026-10-26 | Nguyen Khanh Duy | Validated against migrations baseline (27 models: core + billing + notifications) | [05-database.md](05-database.md) |
| **DOC-06** | Sơ đồ Luồng Tuần tự (Workflows Hub - 18 Workflows) | 1.4 | 2026-10-24 | Nguyen Khanh Duy | Current | [workflows/README.md](workflows/README.md) |
| **DOC-07** | Phân quyền Động & Entitlements (Dynamic Entitlements) | 1.0 | 2026-10-09 | Nguyen Khanh Duy | Needs revalidation — PB-20 | [07-dynamic-authorization-and-entitlements.md](07-dynamic-authorization-and-entitlements.md) |
| **DOC-08** | Contributor, Admin Review & Group-based IAM | 1.1 | 2026-10-13 | Nguyen Khanh Duy | Needs revalidation — PB-21 | [08-contributor-admin-iam-sprint-roadmap.md](08-contributor-admin-iam-sprint-roadmap.md) |
| **DOC-09** | Kế hoạch Nâng cấp Backend: IAM, Contributor & Review Queue | 1.1 | 2026-10-13 | Nguyen Khanh Duy | Historical plan — implementation gaps remain | [09-backend-iam-contributor-review-plan.md](09-backend-iam-contributor-review-plan.md) |
| **DOC-11** | Phân tách Role Admin vs Contributor & Standalone App | 1.2 | 2026-10-15 | Nguyen Khanh Duy | Needs revalidation — PB-21 | [11-admin-contributor-separation-and-user-crud.md](11-admin-contributor-separation-and-user-crud.md) |
| **DOC-12** | Hướng dẫn Triển khai Admin Subdomain (Vercel/Nginx) | 1.0 | 2026-10-15 | Nguyen Khanh Duy | Final | [deployment/admin-subdomain-setup.md](deployment/admin-subdomain-setup.md) |
| **DOC-13** | Phân tích Nâng cấp Auth, Lab Workspace và Contributor Studio | 1.0 | 2026-10-17 | Nguyen Khanh Duy & Antigravity | Implemented (Final) | [12-lab-platform-upgrade-analysis.md](12-lab-platform-upgrade-analysis.md) |
| **DOC-14** | Kế hoạch Phân công Agent — Nâng cấp Auth, Lab Workspace và Contributor Studio | 1.0 | 2026-10-17 | Nguyen Khanh Duy & Antigravity | Implemented (100% Verified) | [13-lab-platform-upgrade-agent-execution-plan.md](13-lab-platform-upgrade-agent-execution-plan.md) |
| **DOC-15** | Bộ Runbook Phân công Agent — Lab Platform Upgrade | 1.0 | 2026-10-17 | Nguyen Khanh Duy & Antigravity | Implemented (Final) | [agent-guides/README.md](agent-guides/README.md) |
| **DOC-16** | UI/UX, Localization, Low-Code Playwright & Dashboard — Agent Execution Plan | 1.0 | 2026-10-19 | Nguyen Khanh Duy & Antigravity | Implemented (100% Verified) | [14-ui-ux-localization-dashboard-agent-execution-plan.md](14-ui-ux-localization-dashboard-agent-execution-plan.md) |
| **DOC-17** | Curriculum Source Registry, Adaptation Matrix & 24 MVP Labs | 3.0 | 2026-10-22 | Nguyen Khanh Duy & Antigravity | Implemented (Authoritative) | [curriculum/source-registry-and-adaptation-matrix.md](curriculum/source-registry-and-adaptation-matrix.md) |
| **DOC-18** | Sơ đồ Luồng Tuần tự — Automation V3 Client Sandbox & Low-Code Execution | 3.0 | 2026-10-22 | Nguyen Khanh Duy | Final | [workflows/14-automation-v3-client-sandbox-flow.md](workflows/14-automation-v3-client-sandbox-flow.md) |
| **DOC-19** | Account Lifecycle, Profile, Session Recovery & Preferences | 1.0 | 2026-10-24 | StudyWeb engineering team | Current | [workflows/15-account-lifecycle-profile-and-preferences.md](workflows/15-account-lifecycle-profile-and-preferences.md) |
| **DOC-20** | Learner Dashboard, Saved Library, Submissions & Progress | 1.0 | 2026-10-24 | StudyWeb engineering team | Current | [workflows/16-learner-dashboard-and-library.md](workflows/16-learner-dashboard-and-library.md) |
| **DOC-21** | Learning Unit Strategy Resolution & Execution | 1.0 | 2026-10-24 | StudyWeb engineering team | Current | [workflows/17-learning-unit-strategies.md](workflows/17-learning-unit-strategies.md) |
| **DOC-22** | Admin Content, Plans, Entitlements & Audit | 1.1 | 2026-10-26 | StudyWeb engineering team | Current (Billing settings, queue & announcements) | [workflows/18-admin-content-plans-and-audit.md](workflows/18-admin-content-plans-and-audit.md) |
| **DOC-23** | Quy trình Nâng cấp & Thanh toán (PRO Access & Manual Upgrade) | 2.1 | 2026-10-26 | StudyWeb engineering team | Current (Manual bank transfer milestone) | [workflows/12-upgrade-and-payment.md](workflows/12-upgrade-and-payment.md) |
| **DOC-24** | Sổ tay Vận hành Thanh toán (Billing Operations Runbook) | 1.0 | 2026-10-26 | StudyWeb engineering team | Final | [runbooks/billing-operations-runbook.md](runbooks/billing-operations-runbook.md) |
| **ADR-001** | Architecture Decision Record: Auth Refresh Token Rotation & Session Mgmt | 1.0 | 2026-10-17 | Antigravity Architecture Agent | Accepted | [adr/ADR-001-auth-refresh-rotation.md](adr/ADR-001-auth-refresh-rotation.md) |
| **ADR-002** | Architecture Decision Record: PGlite In-Browser SQL Learning Sandbox | 1.0 | 2026-10-18 | Antigravity Architecture Agent | Accepted | [adr/002-pglite-sql-sandbox.md](adr/002-pglite-sql-sandbox.md) |
| **ADR-003** | Architecture Decision Record: Client-Side Fixture Runner & Zero-Browser Automation V3 | 3.0 | 2026-10-22 | Nguyen Khanh Duy & Antigravity | Accepted | [adr/003-client-automation-v3-sandbox-runner.md](adr/003-client-automation-v3-sandbox-runner.md) |
| **SPEC-01** | Quy chuẩn Markdown Block Grammar V1 | 1.0 | 2026-10-17 | Antigravity Platform Agent | Frozen | [specs/lab-markdown-v1.md](specs/lab-markdown-v1.md) |
| **SPEC-02** | Lab Content Contract Envelope V1 JSON Schema | 1.0 | 2026-10-17 | Antigravity Platform Agent | Frozen | [specs/lab-content-contract-v1.json](specs/lab-content-contract-v1.json) |
| **SPEC-03** | Lab Content Contract Specification V3.0 (Automation Low-Code & Playwright) | 3.0 | 2026-10-22 | Nguyen Khanh Duy | Authoritative | [specs/lab-content-contract-v3.md](specs/lab-content-contract-v3.md) |
| **REP-01** | Báo cáo kiểm định Performance Budget | 1.0 | 2026-10-17 | Antigravity Platform Agent | Passed | [reports/lab-upgrade-performance.md](reports/lab-upgrade-performance.md) |
| **REP-02** | Báo cáo kiểm định An ninh (Security Audit) | 1.0 | 2026-10-17 | Antigravity Platform Agent | Passed | [reports/lab-upgrade-security.md](reports/lab-upgrade-security.md) |
| **REP-03** | Báo cáo tổng kết Release Readiness Audit | 1.1 | 2026-10-24 | Antigravity Platform Agent | Historical — superseded by REP-04 | [reports/release-readiness-audit.md](reports/release-readiness-audit.md) |
| **REP-04** | Current Product Backlog & Implementation Gap Audit | 1.1 | 2026-10-25 | OpenAI Codex | Current — release blockers identified | [reports/current-product-backlog-gap-audit.md](reports/current-product-backlog-gap-audit.md) |
| **PLAN-01** | Product Backlog v1.2 Remediation & Delivery Plan | 1.1 | 2026-10-25 | Nguyen Khanh Duy / Implementation Taskforce | Implemented & Verified (Waves 0–3 Completed) | [reports/product-backlog-v1-2-execution-plan.md](reports/product-backlog-v1-2-execution-plan.md) |
| **PLAN-02** | Notifications, Pricing & Manual Pro Upgrade | 1.1 | 2026-10-26 | OpenAI Codex; user-confirmed product decisions | Implemented & 100% Verified | [15-notifications-pricing-pro-execution-plan.md](15-notifications-pricing-pro-execution-plan.md) |

---

## 2. Thông tin Đội ngũ Dự án (Team Organisation)

| Họ và Tên | Bí danh (Alias) | Vai trò chính | Phạm vi phụ trách chính |
|---|---|---|---|
| **Nguyen Khanh Duy** | Kduy | Product Owner / Fullstack Lead | Quyết định scope/priority/Go-No-Go; kiến trúc tổng thể; điều phối Backend, Frontend, Admin và release evidence |
| **Backend owner** | TBD | Engineering | API, authorization, grading, persistence và migration; chưa nêu trong nguồn |
| **Learner/Admin FE owner** | TBD | Engineering | Learner/Admin journeys, contract consumer, UX states và accessibility; chưa nêu trong nguồn |
| **QA/Security owner** | TBD | Quality/Security | Negative tests, full-stack E2E và gate sign-off; chưa nêu trong nguồn |

---

## 3. Lịch trình Tổng thể (Master Timeline — Stabilization First)

| Mốc thời gian | Giai đoạn | Trọng tâm công việc | Kết quả đầu ra |
|---|---|---|---|
| **Lịch sử Sprint 1–4** | Baseline v1.1 | PB-01–PB-15, tổng 43 SP; không dùng làm evidence Done | Implementation hiện tại: 3 Done, 10 Partial, 2 Not implemented |
| **Wave 0** | Decisions & Ready gate | D-01–D-08; refine P0 contracts, owner và test strategy | G0 pass cho PB-16–PB-20 |
| **Wave 1** | P0 stabilization | Migration, grading, XSS, session security, entitlement/access | G1–G4 pass; không còn P0 open |
| **Wave 2** | Core flow restoration | Registration/profile/account, admin contract, submission/solution/progress, release CI | Core full-stack E2E; không còn release-blocking P1 |
| **Wave 3** | MVP completion | Sample project, Bug Hints, saved series, shared taxonomy | Original PBs hoàn tất hoặc formally Deferred; G6 pass |
| **Wave 4** | Expansion | Payment/subscription; GitHub/Webhook chỉ khi re-prioritized | External decisions, capacity plan và full gates |
| **PLAN-02 — Implemented** | Monthly Pro & Notifications | Admin-managed pricing; manual bank-transfer verification; inbox; expiry reminders | 7 tasks / 15 subtasks complete and 100% verified across BE, FE, Admin; [execution plan](15-notifications-pricing-pro-execution-plan.md) |

Ngày/sprint mới chưa được gán vì repository không nêu team capacity hoặc availability. Thứ tự wave là dependency bắt buộc, không phải lịch cam kết.

---

## 4. Mâu thuẫn và vấn đề chéo tài liệu (Cross-document issues)

- PLAN-02 (Monthly Pro through bank transfer, manual Admin reconciliation, learner solution completion gate, in-app notifications) đã được triển khai và kiểm thử 100% (478 tests pass). PB-24 giữ trạng thái Blocked đối với tích hợp cổng thanh toán tự động (Stripe, MoMo, VNPay). Sổ tay vận hành tại [runbooks/billing-operations-runbook.md](runbooks/billing-operations-runbook.md).
- REP-03 từng kết luận release gần sẵn sàng nhưng REP-04 phát hiện migration, grading, XSS, session và entitlement blockers; REP-04 là evidence hiện hành.
- ADR-001 mô tả refresh rotation đã accepted, nhưng legacy raw-token fallback vẫn làm revoke không đáng tin cậy; PB-03/PB-19 chịu trách nhiệm.
- ADR-003 và Automation V3 mô tả client sandbox, nhưng starter/public checks không đủ bảo vệ grading outcome; PB-17 phải khóa server-authoritative boundary.
- Một số tài liệu IAM/Admin ghi `Implemented (Final)` nhưng API contract và ownership vẫn lệch; trạng thái đã hạ xuống “Needs revalidation” trong register.
- Workflow topic governance là browser-local, không phải shared persistence; PB-25 chịu trách nhiệm.
- Product Backlog v1.2 và PLAN-01 đang Draft cho đến khi PO duyệt D-01–D-08, owner và capacity.
- Brand/domain `KDUY StudyLab` chưa phải quyết định repository; việc đổi tên nằm ngoài backlog baseline này.

---

## 5. Các Quy tắc & Kỹ năng Kèm theo (Rules & Skills)

- **Quy chuẩn Git & CI/CD**: [git-workflow.md](../.agents/rules/git-workflow.md)
- **Kỹ năng Chuyển đổi Tài liệu**: [docs-as-code/SKILL.md](../.agents/skills/docs-as-code/SKILL.md)
- **Execution tracking**: [Product Backlog v1.2 scratchpad](../.agents/scratchpad/product-backlog-v1-2-rewrite.md)
