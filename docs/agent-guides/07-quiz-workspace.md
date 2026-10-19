---
title: "Runbook 07 — Quiz Workspace"
document_id: "DOC-15-R07"
version: "1.0"
status: "Ready for Assignment"
owner_role: "Agent-QUIZ"
task_scope: "Task 6"
updated: "2026-10-17"
---

# Runbook 07 — Quiz Workspace

## 1. Thông tin guide

**Mục tiêu:** cung cấp Assignment UX cuộn liên tục, question palette, warning câu chưa trả lời, grade-once và submission V1 có thể round-trip.

**Đọc bắt buộc:** [analysis](../12-lab-platform-upgrade-analysis.md), [master plan — Task 6](../13-lab-platform-upgrade-agent-execution-plan.md#task-6-quiz-assignment-workspace-và-question-palette), contract 2.6 và interface 3.4.

**Dependencies:** 2.6 và 3.4 đạt gate. **Branch:** `codex/quiz-assignment-workspace`.

### 1.1. File ownership và nhiệm vụ

| Subtask | Nhiệm vụ | File chính |
|---|---|---|
| 6.1 | Pure grading domain | `features/lab/quiz/quizGrading.ts`, tests |
| 6.2 | Assignment question list | `QuizAssignmentWorkspace.tsx`, `QuizQuestionCard.tsx`, tests |
| 6.3 | Question palette | `QuestionPaletteModal.tsx`, tests |
| 6.4 | Unanswered warning | workspace/dialog tests |
| 6.5 | Grade once/explanations | workspace, grading tests |
| 6.6 | Submission V1 | mapper/types; BE validation chỉ khi cần |
| 6.7 | Strategy handoff | exports, registration types, independent harness |

Không sửa `LabWorkspacePage.tsx`, SQL/Automation/Studio. Không tạo source of truth thứ hai cho answer state. Không lộ correct answer/explanation trước submit ngoài limitation payload đã được PM chấp nhận.

## 2. Hướng dẫn thực thi

### 2.1. Trình tự

1. Viết pure grading/validation cho empty, unanswered, correct, partial và invalid config.
2. Tạo list tất cả câu có radio/code/Markdown; answer state ổn định khi scroll/rerender.
3. Tạo palette derive trực tiếp từ answers; keyboard jump, smooth scroll và focus return.
4. Thêm warning với “Continue answering” tới câu đầu bỏ trống và “Submit anyway” theo policy.
5. Khoá answer sau submit; tính điểm một lần và hiện explanation từng câu.
6. Serialize versioned payload trong field hiện hữu, test history round-trip và malformed data.
7. Export component độc lập và handoff cho Shell.

### 2.2. Acceptance và verify

- Radio group dùng keyboard/screen reader; palette answered/unanswered/current luôn khớp answers.
- Warning chỉ xuất hiện khi cần; double-submit bị chặn.
- Score deterministic; reset chỉ qua explicit policy/action.
- Save/read history semantic round-trip; malformed payload không crash.

```powershell
Set-Location MODULE_FE
npm test -- --run
npm run build

Set-Location ..
git diff --check
```

### 2.3. Handoff bắt buộc

- Grading API/rules và invalid-config behavior.
- Public workspace/palette exports và shared props consumed.
- Submission V1 example, history round-trip và backend touch-point nếu có.
- Accessibility, double-submit, test/build result, risk và rollback.
- Yêu cầu Agent-SHELL tích hợp; không tự sửa page shell.

### 2.4. Prompt mẫu để giao Agent

```text
Bạn là Agent-QUIZ của study-web. Thực thi duy nhất Task 6 theo
docs/agent-guides/07-quiz-workspace.md và master checklist.

Chỉ bắt đầu khi Lab contract 2.6 và WorkspaceProps 3.4 đã freeze. Đọc AGENTS.md, analysis,
master plan và contract; chụp git status --short, giữ file dirty. Claim một subtask [ ] -> [/],
verify rồi -> [x].

Xây pure grading domain, Assignment list, QuestionPaletteModal, unanswered warning, grade-once
review và versioned submission round-trip. Answer state phải có một source of truth; không lộ
correct answer/explanation trước submit. Không sửa LabWorkspacePage.tsx hoặc SQL/Automation/Studio.

Chạy grading/unit/component/accessibility tests, double-submit/history round-trip và FE build.
Bàn giao public exports/test harness cho Agent-SHELL cùng command/result, payload example, risk
và rollback. Nếu submit policy hoặc contract chưa rõ, dừng và hỏi PM/Agent-CONTRACT, không tự đoán.
```

## 3. Tài liệu tham khảo

- [Runbook hub](README.md)
- [Master plan](../13-lab-platform-upgrade-agent-execution-plan.md)
- [Architecture analysis](../12-lab-platform-upgrade-analysis.md)
