# Agent Working Memory & Scratchpad Directory

Thư mục này dùng để lưu trữ các file kế hoạch thực thi (**External Working Memory / Scratchpad**) của Agent khi triển khai các tính năng, refactor hoặc sửa lỗi phức tạp.

## Quy chuẩn đặt tên file:
- File kế hoạch: `[task-name].plan.md`
- File scratchpad tạm: `[task-name].scratchpad.md`

## Nguyên tắc:
- Mọi file kế hoạch phải tuân theo cấu trúc 2 tầng: `### Task X` và `- [ ] Subtask X.Y`.
- Agent tự động cập nhật `- [x]` sau khi kiểm chứng thành công từng bước.

## Active plan register — 2026-10-24

| Classification | Plans | Meaning |
|---|---|---|
| **ACTIVE** | `remaining-work-closure.plan.md` | The only execution queue for the current closure pass. |
| **EXTERNAL / PRODUCT GATE** | `pglite-sql-sandbox-analysis.plan.md` | Implementation is complete; runtime asset budget failed and shared-database legacy authoring remains gated. |
| **COMPLETED** | Plans whose header says `COMPLETED`, `COMPLETE`, or `IMPLEMENTED & VERIFIED` | Historical evidence; do not reopen from old checkbox text. |
| **SUPERSEDED** | `git-push-separation*.plan.md`, old SQL/quiz plans, Smart Cloze analysis | Historical proposals whose assumptions were replaced; do not execute. |
| **MANUAL RELEASE GATE** | `docs/deployment/admin-subdomain-setup.md` | Requires deployed domains and suitable accounts; not part of local implementation completeness. |

When auditing pending work, include only `ACTIVE` plans. A raw repository-wide checkbox count is not an execution queue because archived/superseded plans intentionally retain their original task history.
