---
title: "Runbook 05 — Automation Workspace"
document_id: "DOC-15-R05"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-AUTO"
task_scope: "Task 4"
updated: "2026-10-17"
---

# Runbook 05 — Automation Workspace

## 1. Thông tin guide

**Mục tiêu:** xây matcher core, versioned worker protocol, capability limits và Automation workspace có thể render/test độc lập.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 4](../13-lab-platform-upgrade-agent-execution-plan.md#task-4-automation-test-guided-workspace), Lab contract 2.6 và `WorkspaceProps` 3.4.

**Dependencies:** 2.6 và interface 3.4 đã sẵn sàng. **Branch:** `codex/automation-guided-workspace`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 4.1 | Matcher core | `MODULE_FE/src/features/lab/runtime/matchers/**` |
| 4.2 | Version worker protocol | `lab-runner.worker.ts`, `useLabWorker.ts`, protocol types |
| 4.3 | Runtime capability policy | worker bootstrap/policy tests |
| 4.4 | Testing cheat sheet | `TestingCheatSheet.tsx`, fixtures/tests |
| 4.5 | Guided workspace | `AutomationTestWorkspace.tsx`, tests |
| 4.6 | Strategy handoff | exports, addon factory, independent harness |

Không sửa `LabWorkspacePage.tsx`, SQL/Quiz/Studio. Chỉ thay shared contract qua review với Agent-CONTRACT/SHELL. Không hiển thị solution trong cheat sheet hoặc runtime output.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Viết pure matcher tests cho `toBe`, `toEqual`, `toBeDefined`, `toContain` và failure messages.
2. Version protocol output gồm step id, matcher, pass/fail, expected, actual, diff, duration, logs.
3. Đặt timeout, reset, log/output limits và policy cho network/unneeded APIs.
4. Tạo accessible cheat sheet theo scenario/config.
5. Tạo workspace với Monaco, guided steps, granular results, retry/reset/submission mapping.
6. Export component/addon factory và chứng minh render độc lập trước handoff cho Shell.

### 2.2. Acceptance và verify

- Matchers xử lý primitives/arrays/objects/undefined/circular hoặc unsupported values có diagnostics.
- Infinite loop terminate; log flood bị giới hạn; reset không leak logs/test cases.
- Login-response sample có cả pass/fail/diff/retry/reset; payload theo contract.
- Component harness không phụ thuộc page monolith.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ..
git diff --check
```

### 2.3. Handoff bắt buộc

- Matcher/protocol version và supported capabilities.
- Public component props, exports và contextual addon factory.
- Independent harness/test results; timeout/log/network policy evidence.
- Submission mapping, known limitations, risk và rollback.
- Yêu cầu Agent-SHELL tích hợp; không tự sửa page shell.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-AUTO của study-web. Thực thi duy nhất Task 4 theo
docs/agent-guides/05-automation-workspace.md và master checklist.

Chỉ bắt đầu khi contract 2.6 và WorkspaceProps/interface 3.4 đã được công bố. Đọc AGENTS.md,
analysis, master plan và hai contract; chụp git status --short, giữ file dirty. Claim từng
subtask [ ] -> [/], verify rồi -> [x].

Xây matcher core, versioned worker protocol, runtime policy, TestingCheatSheet và
AutomationTestWorkspace độc lập. Không sửa LabWorkspacePage.tsx; không sửa SQL/Quiz/Studio;
không đổi shared contract nếu chưa có review. Runtime phải timeout/reset được, giới hạn logs
và không lộ solution.

Chạy unit/component/protocol tests và FE build. Bàn giao public exports + addon factory cho
Agent-SHELL cùng test harness, command/result, capability policy, risk và rollback. Nếu interface
3.4 chưa ổn định, dừng integration và báo PM thay vì tự tạo contract khác.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
