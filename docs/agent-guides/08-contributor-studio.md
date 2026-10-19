---
title: "Runbook 08 — Contributor Studio"
document_id: "DOC-15-R08"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-STUDIO"
task_scope: "Task 7"
updated: "2026-10-17"
---

# Runbook 08 — Contributor Studio

## 1. Thông tin guide

**Mục tiêu:** chuyển Contributor Studio sang authoring Markdown-first với grammar V1, parser/serializer hai chiều, smart toolbar, learner preview, autosave và preflight publish gate.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 7](../13-lab-platform-upgrade-agent-execution-plan.md#task-7-contributor-studio--markdown-first-smart-toolbar-và-student-preview), contract 2.6 và presentation contracts Task 3–6.

**Dependencies:** 2.6 đã freeze; presentational APIs cần dùng đã handoff. **Branch:** `codex/markdown-first-lab-studio`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 7.1 | Markdown grammar V1 | `docs/specs/lab-markdown-v1.md` |
| 7.2 | Parser/serializer | `features/lab/utils/lab-markdown-parser.ts`, fixtures/tests |
| 7.3 | Smart toolbar | `SmartLabToolbar.tsx`, `MarkdownEditorWithPreview.tsx` |
| 7.4 | Student preview | preview adapter/component, reused presentation components |
| 7.5 | Autosave draft | `LabStudioPage.tsx`, draft utility/tests |
| 7.6 | Preflight publish gate | `LabStudioPage.tsx`, builders/adapters/tests |
| 7.7 | Hybrid authoring flow | `MODULE_FE/src/pages/lab/LabStudioPage.tsx`, layout tests |
| 7.8 | API/review lifecycle | Studio integration tests, API/contract fixtures |

Agent-STUDIO là **owner duy nhất** của `LabStudioPage.tsx`. Không fork learner components khi có presentational API dùng lại được. Không đổi frozen contract ngoài version review; preview không submit API, tự chạy solution hoặc lộ PRO solution.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Đặc tả context/starter/solution/tests/schema/seed/expected/quiz blocks và duplicate/missing/unknown/escaping rules.
2. Implement parser có line diagnostics và serializer; bảo toàn prose/unknown safe content.
3. Tạo toolbar insert tại cursor, singleton guard, keyboard label và undo compatibility.
4. Adapter sang learner presentational components để preview parity cho ba type.
5. Gia cố local draft: debounce, versioned lab/user key, corrupt/quota recovery; chỉ clear sau server save.
6. Invalidate preflight khi relevant input đổi; khóa publish đến latest run pass.
7. Hợp nhất metadata/theory/editor/preview thành hybrid flow responsive, giữ đầy đủ field.
8. Chạy create → reload → edit → preflight → review lifecycle cho ba type.

### 2.2. Acceptance và verify

- `parse(serialize(dto))` semantic-equal cho JS/SQL/Quiz; malformed block có line diagnostics.
- Preview và learner view parity, không API side effect hoặc solution leak.
- Draft restore/discard, corrupt/quota và edit/new collision có test.
- Edit-after-pass làm invalid preflight; không bypass bằng step navigation.
- Screenshots 375/768/1440 và validation summary focus đúng lỗi.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ..
git diff --check
```

### 2.3. Handoff bắt buộc

- Grammar spec approval ref và parser/serializer API.
- Round-trip fixtures cho 3 type, diagnostics examples.
- Preview parity screenshots, autosave/preflight evidence.
- API lifecycle result, responsive/a11y result, risk và rollback.
- Contract change request riêng nếu phát hiện gap; không sửa âm thầm.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-STUDIO của study-web và là owner duy nhất của
MODULE_FE/src/pages/lab/LabStudioPage.tsx. Thực thi Task 7 theo
docs/agent-guides/08-contributor-studio.md và master checklist.

Chỉ bắt đầu khi Lab contract 2.6 đã freeze và presentation contracts cần dùng đã handoff.
Đọc AGENTS.md, analysis, master plan và contract; chụp git status --short, giữ file dirty.
Claim một subtask [ ] -> [/], verify rồi -> [x].

Đặc tả grammar V1, implement parser/serializer round-trip, Smart Toolbar, learner preview,
autosave, preflight gate và hybrid authoring flow. Reuse presentational components; preview không
submit API, không tự chạy solution, không lộ PRO solution. Không đổi frozen contract âm thầm.

Chạy parser/round-trip, toolbar, preview parity, draft/preflight, API lifecycle tests và FE build;
chụp 375/768/1440. Nếu contract thiếu, lập change request cho PM/Agent-CONTRACT. Handoff theo
runbook với spec ref, fixtures, screenshots, command/result, risk và rollback.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
