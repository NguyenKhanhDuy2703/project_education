---
title: "Runbook 09 — Integration QA and Release"
document_id: "DOC-15-R09"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-QA/DOCS"
task_scope: "Task 8"
updated: "2026-10-17"
---

# Runbook 09 — Integration QA and Release

## 1. Thông tin guide

**Mục tiêu:** kiểm chứng end-to-end toàn chương trình, đo performance/security, đồng bộ docs-as-code và đưa ra release gate có bằng chứng.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 8](../13-lab-platform-upgrade-agent-execution-plan.md#task-8-integration-e2e-performance-security-và-documentation), handoff Task 1A–7.

**Dependencies:** các task 1A–7 đã đạt exit gate. **Branch:** `codex/lab-upgrade-integration-qa`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | Đầu ra chính |
|---|---|---|
| 8.1 | Browser E2E harness | config/scripts/fixtures, trace/screenshot on failure |
| 8.2 | Auth E2E matrix | same-tab/two-tab/background/network/logout-replay |
| 8.3 | Automation journey | fail → diff → fix → pass → submit → history |
| 8.4 | SQL journey | lazy init, schema, real query, diff, reset, submit |
| 8.5 | Quiz journey | partial, palette, warning, grade, explanation, history |
| 8.6 | Studio journey | Markdown, preview, autosave, preflight, review |
| 8.7 | Performance budgets | `docs/reports/lab-upgrade-performance.md` |
| 8.8 | Security review | `docs/reports/lab-upgrade-security.md` |
| 8.9 | Docs-as-code sync | workflows, DB design, backlog, docs register |
| 8.10 | Final audit/release gate | CI results, release notes, rollback, go/no-go |

Agent-QA/DOCS không thêm feature scope hoặc tự thay behavior để làm test pass. Defect quay lại đúng feature owner; chỉ sửa test harness, fixtures, reports và docs thuộc ownership QA trừ paired fix có xác nhận.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Xác nhận exit gate/handoff 1A–7 và môi trường test deterministic.
2. Tạo E2E smoke login → open lab, giữ screenshot/trace khi fail.
3. Chạy lần lượt Auth, Automation, SQL, Quiz, Studio journeys; log defect theo owner/task.
4. Đo route bundle, lazy Monaco/PGlite, SQL cold init/p95/memory, workspace render.
5. Review raw refresh token/OAuth URL, worker capabilities, SQL guard bypass, entitlement leak và tampering.
6. Đồng bộ docs với code thực tế; không đánh dấu resolved nếu issue còn tồn tại.
7. Chạy full test/build/lint/E2E/diff audit, kiểm tra không còn `[/]`, lập go/no-go.

### 2.2. Release gates và verify

- Auth chỉ logout khi session invalid; multi-tab/background/network matrix pass.
- SQL không còn regex path, engine lazy, timeout/reset phục hồi và đạt budget/waiver.
- Quiz không double-submit; Studio semantic round-trip cho 3 type.
- P0/P1 security finding phải fix trước release; performance regression cần fix hoặc PM waiver.
- Docs, release notes và rollback plan khớp commit được release.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build
npm run lint

Set-Location ../MODULE_BE
npm test -- --runInBand
npm run build

Set-Location ..
# Chạy E2E bằng script đã chuẩn hóa tại Task 8.1.
git diff --check
rg -n "\[/\]" docs/13-lab-platform-upgrade-agent-execution-plan.md
```

Không tuyên bố pass nếu repo chưa có script hoặc command thất bại; ghi chính xác blocker và owner.

### 2.3. Handoff bắt buộc

- Commit/PR matrix đã test và environment/browser/version.
- Full command/result; link traces/screenshots/defects.
- Performance/security report và waiver refs nếu có.
- Docs/register/release notes/rollback đã cập nhật.
- Go/no-go, issue theo severity/owner và checklist master cuối cùng.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-QA/DOCS của study-web. Thực thi duy nhất Task 8 theo
docs/agent-guides/09-integration-qa-release.md và master checklist.

Chỉ bắt đầu integration khi Task 1A–7 có exit gate và handoff rõ ràng. Đọc AGENTS.md,
analysis, master plan và mọi handoff; chụp git status --short, giữ file dirty. Claim một
subtask [ ] -> [/], verify bằng bằng chứng thật rồi mới -> [x].

Thiết lập/chạy E2E Auth, Automation, SQL, Quiz, Studio; đo performance, review security và
đồng bộ docs-as-code. Không thêm feature scope, không thay behavior chỉ để test pass; gửi defect
về đúng owner hoặc dùng paired fix được xác nhận. P0/P1 phải fix; regression cần PM waiver.

Chạy full FE/BE test/build/lint, E2E và git diff --check. Không mark 8.10 nếu còn [/], script
placeholder, command fail, docs lệch code, release notes hoặc rollback thiếu. Handoff phải có
commit matrix, environment, traces/reports, issue/owner và quyết định go/no-go có căn cứ.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
