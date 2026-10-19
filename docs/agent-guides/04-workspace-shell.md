---
title: "Runbook 04 — Workspace Shell"
document_id: "DOC-15-R04"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-SHELL"
task_scope: "Task 3"
updated: "2026-10-17"
---

# Runbook 04 — Workspace Shell

## 1. Thông tin guide

**Mục tiêu:** tách page monolith thành data/navigation/submission hooks, `LabTheoryPane`, strategy registry và shared responsive shell.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 3](../13-lab-platform-upgrade-agent-execution-plan.md#task-3-shared-theory-pane-và-workspace-strategy-shell), contract snapshot Task 2.6.

**Dependencies:** 2.6 đã `[x]`. **Branch:** `codex/lab-workspace-strategy-shell`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 3.1 | Characterization baseline | tests quanh `LabWorkspacePage.tsx` |
| 3.2 | Data/navigation/submission hooks | `useLabWorkspaceData.ts`, `useLabNavigation.ts`, `useLabSubmission.ts` |
| 3.3 | Shared theory pane | `pages/lab/_components/LabTheoryPane.tsx`, tests |
| 3.4 | Strategy registry/shared props | `workspaceRegistry.ts`, `WorkspaceProps`, legacy adapters |
| 3.5 | Rút page thành shell | `MODULE_FE/src/pages/lab/LabWorkspacePage.tsx` |
| 3.6 | Responsive/a11y audit | shell, theory pane, styles/tests |

Agent-SHELL là **owner duy nhất** được sửa `LabWorkspacePage.tsx`. Agent không viết matcher, SQL evaluator/diff hoặc quiz grading. Strategy internals thuộc Agent-AUTO/SQL/QUIZ; tích hợp bằng public exports và shared props đã freeze.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Viết characterization tests cho load/error/403, tabs, navigation, submission, PRO và ba sandbox route.
2. Tách hooks mà không đổi query keys/behavior; xác nhận đổi lab reset state và không duplicate fetch.
3. Tạo `LabTheoryPane` với contextual child slot, locked solution và history states.
4. Công bố `WorkspaceProps` + exhaustive registry; review interface với ba strategy agent.
5. Tích hợp từng strategy qua export/handoff; chỉ Shell sửa page.
6. Rút page về orchestration/layout, kiểm tra responsive/a11y và baseline parity.

### 2.2. Acceptance và verify

- Characterization tests vẫn pass sau extraction; unsupported sandbox có fallback rõ.
- `LabWorkspacePage.tsx` không chứa matcher, SQL evaluator/diff hoặc quiz grading; mục tiêu dưới 350 dòng hoặc có justification.
- Screenshots 375/768/1440; keyboard tabs/focus restore/screen-reader labels; không horizontal overflow ngoài data table.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ..
rg -n "matcher|sql.*diff|correctIndex|gradeQuiz" MODULE_FE/src/pages/lab/LabWorkspacePage.tsx
git diff --check
```

Review kết quả `rg` theo ngữ cảnh; chỉ orchestration/import hợp lệ được giữ.

### 2.3. Handoff bắt buộc

- `WorkspaceProps`/registry contract và version/ref để strategy agents consume.
- Characterization/extraction/integration test results.
- Danh sách strategy exports đã tích hợp và paired commit nếu có.
- Screenshot/a11y report, page line count, risk và rollback.
- Exit gate Task 3 và blocker còn lại.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-SHELL của study-web và là owner duy nhất của
MODULE_FE/src/pages/lab/LabWorkspacePage.tsx. Thực thi Task 3 theo
docs/agent-guides/04-workspace-shell.md và master checklist.

Chỉ bắt đầu khi Lab contract Task 2.6 đã freeze. Đọc AGENTS.md, analysis, master plan và
contract snapshot; chụp git status --short, giữ file dirty. Claim một subtask [ ] -> [/],
verify xong mới -> [x]. Viết characterization tests trước khi extraction.

Tách shared hooks, LabTheoryPane, WorkspaceProps và exhaustive registry; page cuối chỉ orchestration/layout.
Không triển khai matcher, SQL engine/diff hoặc quiz grading. Agent strategy không được sửa page;
hãy tích hợp public exports từ handoff của họ hoặc paired commit có owner xác nhận.

Chạy FE tests/build, responsive 375/768/1440, a11y và source audit. Nếu Task 2.6 hoặc strategy
interface chưa được duyệt, dừng phần phụ thuộc và báo PM. Handoff theo runbook với interface ref,
test/result, screenshots, page line count, risk và rollback.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
