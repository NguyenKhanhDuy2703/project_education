---
title: "Agent Runbook Hub — Lab Platform Upgrade"
document_id: "DOC-15"
version: "1.0"
status: "Ready for Assignment"
author: "OpenAI Codex"
updated: "2026-10-17"
source_of_truth: "../13-lab-platform-upgrade-agent-execution-plan.md"
---

# Agent Runbook Hub — Lab Platform Upgrade

## 1. Thông tin guide

Đây là điểm bắt đầu để PM phân công agent thực thi chương trình nâng cấp Auth, Lab Workspace và Contributor Studio. Bộ guide chia trách nhiệm theo **file ownership** để các agent có thể làm song song mà không cùng sửa page hoặc contract trung tâm.

Hai tài liệu bắt buộc đọc trước khi nhận việc:

- [Phân tích kiến trúc và vấn đề](../12-lab-platform-upgrade-analysis.md)
- [Master plan và checklist](../13-lab-platform-upgrade-agent-execution-plan.md)

Master plan là **nguồn trạng thái duy nhất**. Các guide bên dưới chỉ mô tả cách thực thi; không tạo checklist tiến độ thứ hai.

### 1.1. Vị trí và nhiệm vụ của từng file

| File | Agent / nhiệm vụ | Task | Wave | Điều kiện bắt đầu | Đầu ra chính |
|---|---|---:|---:|---|---|
| `00-pm-architecture-foundation.md` | PM/Architect: baseline, test harness, ADR và các gate | 0 | 0 | Không | Baseline, ADR Auth, quyết định SQL, Definition of Ready |
| `01-auth-backend.md` | Backend Auth: session, rotation, cookie, revoke | 1A | 1 | 0.3 và 0.4 đạt | Auth API an toàn và bộ integration test |
| `02-auth-frontend.md` | Frontend Auth: single-flight, cross-tab, proactive refresh | 1B | 1 | 0.2 và contract 1A.4 | Refresh coordinator và session UX |
| `03-lab-content-contract.md` | Full-stack contract: DTO, codec, persistence, compatibility | 2 | 1 | 0.2 và 0.3 đạt | Lab Content Contract V1 được freeze |
| `04-workspace-shell.md` | FE Architecture: theory pane, hooks, registry, page shell | 3 | 2–3 | 2.6 đạt | Shared shell; owner duy nhất của `LabWorkspacePage.tsx` |
| `05-automation-workspace.md` | FE Runtime: matchers, worker protocol, guided workspace | 4 | 2 | 2.6 và interface 3.4 | Strategy component Automation độc lập |
| `06-in-browser-sql-workspace.md` | FE SQL/WASM: PGlite worker, guard, diff, SQL workspace | 5 | 2 | 0.5, 2.6 và interface 3.4 | SQL thật trong browser; fallback chỉ qua ADR |
| `07-quiz-workspace.md` | FE Product/UI: grading, assignment list, palette | 6 | 2 | 2.6 và interface 3.4 | Quiz assignment strategy độc lập |
| `08-contributor-studio.md` | FE Authoring: Markdown grammar, parser, preview, autosave | 7 | 3 | 2.6 và presentation contracts | Studio Markdown-first; owner duy nhất của `LabStudioPage.tsx` |
| `09-integration-qa-release.md` | QA/Docs: E2E, performance, security, release audit | 8 | 4 | 1A–7 đạt gate | Báo cáo release và quyết định go/no-go |

### 1.2. Sơ đồ thứ tự phân công

```text
Task 0 ─────┬──> Task 1A ──> Task 1B contract integration ──┐
            └──> Task 2 ──> Task 3.4 interface ──┬──> Task 4 │
                                                ├──> Task 5 ├──> Task 8
                                                ├──> Task 6 │
                                                └──> Task 7 ┘
```

PM có thể giao song song Task 1A và Task 2 sau Wave 0. Task 4–6 chỉ bắt đầu phần component độc lập sau khi Task 3.4 công bố interface; chỉ Agent-SHELL tích hợp vào page shell.

## 2. Hướng dẫn thực thi

### 2.1. Cách dùng bộ guide để prompt agent

1. Chọn đúng file theo vai trò ở bảng 1.1.
2. Kiểm tra dependency và exit gate của task trước đó trong master plan.
3. Copy toàn bộ khối **Prompt mẫu để giao Agent** ở cuối file guide tương ứng.
4. Thay các placeholder như `<BASELINE_REF>` hoặc `<CONTRACT_REF>` bằng commit/PR thật.
5. Giao một agent đúng một task/PR; không giao hai owner cùng sửa file độc quyền.
6. Agent claim subtask bằng cách đổi `[ ]` thành `[/]` trong master plan, triển khai và verify, rồi mới đổi thành `[x]`.
7. PM review handoff theo đúng mẫu trong guide trước khi mở gate kế tiếp.

### 2.2. Giao thức chung bắt buộc

- Đọc `AGENTS.md`, analysis, master plan và guide vai trò trước khi sửa file.
- Chụp `git status --short`; giữ nguyên mọi thay đổi không thuộc task, không reset hoặc overwrite file dirty.
- Chỉ một subtask ở trạng thái `[/]` cho mỗi agent tại một thời điểm.
- Chỉ đánh dấu `[x]` sau khi command/criteria ở dòng `Verify` đã pass và ghi bằng chứng vào handoff/PR.
- Nếu dependency, ADR, contract hoặc interface chưa đạt gate: dừng, báo PM; không tự suy đoán contract.
- Không refactor ngoài scope, không đổi schema/API version ngoài task được giao.
- Dùng conventional commit và branch/PR đề xuất trong master plan; mỗi PR giữ một owner rõ ràng.

### 2.3. Chính sách tránh conflict

- Chỉ **Agent-SHELL** được sửa `MODULE_FE/src/pages/lab/LabWorkspacePage.tsx`.
- Chỉ **Agent-STUDIO** được sửa `MODULE_FE/src/pages/lab/LabStudioPage.tsx`.
- **Agent-CONTRACT** sở hữu shared Lab types, DTO, codec/normalizer và persistence mapper.
- Agent Automation/SQL/Quiz chỉ tạo component, adapter, test harness và export; không tự tích hợp page shell.
- Agent Auth không sửa Lab; Agent QA không thêm feature scope; Agent PM/Architect không triển khai feature.
- Khi cần sửa file do agent khác sở hữu, tạo handoff hoặc paired integration commit có owner xác nhận.

### 2.4. Mẫu handoff chung

```md
## Agent handoff
- Role / Task:
- Branch / commit / PR:
- Subtasks completed:
- Files changed:
- Verification commands and results:
- Contract/API/interface produced or consumed:
- Screenshots/reports/migrations:
- Known risks or open issues:
- Rollback notes:
- Requested next owner/action:
```

### 2.5. Quy tắc hoàn tất chương trình

Không coi initiative hoàn tất chỉ vì feature chạy thủ công. Task 8.10 chỉ được đánh dấu `[x]` khi test/build/E2E, security, performance, documentation, release notes và rollback plan đều đạt Definition of Done trong master plan.

## 3. Tài liệu tham khảo

- [DOC-13 — Phân tích nâng cấp Lab Platform](../12-lab-platform-upgrade-analysis.md)
- [DOC-14 — Kế hoạch phân công và master checklist](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Project agent instructions](../../AGENTS.md)
- Runbook working memory: `.agents/scratchpad/lab-upgrade-agent-runbooks.plan.md`
