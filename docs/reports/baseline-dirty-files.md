# Baseline & Dirty Files Ownership Audit (Task 0.1)

> **Document ID**: REPORT-BASE-01  
> **Date**: 2026-10-17  
> **Commit Ref Baseline**: `6c8f283` (feat: merge ui-ux-auth-feedback-enhancement into dev)  
> **Audit Status**: VERIFIED & LOCKED  

---

## 1. Mục đích
Ghi nhận toàn bộ trạng thái dirty files tại thời điểm bắt đầu triển khai chương trình **Agent Runbook Hub — Lab Platform Upgrade**, phân định rõ ràng quyền sở hữu (ownership) từng file để đảm bảo nguyên tắc **Surgical Changes**: Không reset, không ghi đè và không làm hỏng công việc dở dang của các agent/tính năng khác.

---

## 2. Bảng Phân định File Ownership (Dirty Files Matrix)

| File Đường Dẫn | Trạng Thái Git | Workstream Phụ Trách | Mục Đích & Ghi Chú Bảo Toàn |
|---|---|---|---|
| `.agents/rules/plan-and-execute.md` | M | Core Governance | Quy tắc Plan-and-Execute cập nhật |
| `.agents/skills/plan-and-execute/SKILL.md` | M | Core Governance | Skill Plan-and-Execute |
| `AGENTS.md` | M | Core Governance | Hướng dẫn tác tử monorepo |
| `MODULE_ADMIN/src/services/topicTags.service.ts` | M | Admin Module | Quản lý topic tags trong admin |
| `MODULE_ADMIN/src/types/lab.types.ts` | M | Admin Module | Đồng bộ types lab admin |
| `MODULE_BE/prisma/seed.ts` | M | Task 2 (Lab Contract) | Seed dữ liệu 3 lab types (automation, sql, quiz) |
| `MODULE_BE/src/modules/labs/labs.service.ts` | M | Task 2 (Lab Contract) | Xử lý persistence DTO/metadata bài lab |
| `MODULE_FE/src/features/lab/components/WorkerResultPanel.tsx` | M | Task 4 (Automation) | Hiển thị kết quả test runner của worker |
| `MODULE_FE/src/features/lab/hooks/useLabWorker.ts` | M | Task 4 (Automation) | Hook giao tiếp với runner worker |
| `MODULE_FE/src/features/lab/workers/lab-runner.worker.ts` | M | Task 4 (Automation) | Web Worker thực thi test script |
| `MODULE_FE/src/pages/HomePage.tsx` | M | General Frontend | Hiển thị series và badges cập nhật |
| `MODULE_FE/src/pages/lab/LabWorkspacePage.tsx` | M | Task 3 (Shell Owner) | Monolith đang được refactor sang shell + strategies |
| `MODULE_FE/src/pages/lab/SeriesDetailPage.tsx` | M | Learning Flow | Chi tiết series |
| `MODULE_FE/src/pages/lab/SeriesHubPage.tsx` | M | Learning Flow | Danh sách series |
| `MODULE_FE/src/services/topicTags.service.ts` | M | Learning Flow | Tag service frontend |
| `MODULE_FE/src/types/lab.types.ts` | M | Task 2 (Lab Contract) | Khai báo types Lab V1 |
| `docs/README.md` | M | Docs Registry | Đăng ký DOC-12, DOC-13, DOC-15 |

---

## 3. Quy tắc Bảo toàn Working Tree
1. Tuyệt đối không chạy `git checkout -- .` hay `git reset --hard`.
2. Mọi sửa đổi trong các Task tiếp theo chỉ tập trung đúng file được giao (`File Ownership Boundaries`).
3. Toàn bộ dirty files đã được kiểm tra tính toàn vẹn (build FE/BE hiện đều PASS).
