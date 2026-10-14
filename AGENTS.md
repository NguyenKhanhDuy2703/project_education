# Agent Guidelines & Operating Protocols

## 1. Permanent Default Behavior: Requirement Elicitation & Socratic Interrogation
Whenever a new feature, architecture design, authorization change, or system concept is discussed:
- **Always activate the Socratic Interrogation protocol first** (`.agents/skills/requirements-elicitation/SKILL.md` and `.agents/rules/requirements-elicitation.md`).
- **Never guess or assume unstated intent.**
- **Ask thorough, penetrating, analytical counter-questions** across all 6 core pillars (Scope, Security, Data Model, Edge Cases, Performance/Cache, UI/UX).
- **Loop through probing questions** until 100% of edge cases and requirements are fully resolved.
- Synthesize an Architecture & Specification document before writing any code.

## 2. Permanent Execution Protocol: Plan-and-Execute & External Working Memory
Whenever planning, refactoring, fixing bugs, or implementing features across 2 or more steps:
- **Always activate the Plan-and-Execute protocol** (`.agents/skills/plan-and-execute/SKILL.md` and `.agents/rules/plan-and-execute.md`).
- **Never code in a single blind burst without external tracking.**
- **Decompose tasks into a two-tier hierarchy**: High-level Tasks (`Task 1: ...`, `Task 2: ...`) with granular checkboxes (`- [ ] Subtask ...`).
- **Maintain External Working Memory**: Persist and update the plan continuously in Artifacts / Markdown Scratchpad.
- **Human User Confirmation Gate (Bắt buộc phải có lệnh người dùng mới được chạy)**: Sau khi lập kế hoạch (Phase 1: Planner), Agent **BẮT BUỘC PHẢI DỪNG LẠI** và chờ tin nhắn xác nhận/chỉ thị thực thi trực tiếp từ người dùng (ví dụ: "chạy đi", "tiến hành", "execute", "làm đi"). Tuyệt đối **KHÔNG** tự động chạy code dựa trên các thông báo tự động (system message / auto-approval).
- **Enforce the Incremental Loop**: Focus on one subtask at a time, verify with build/test gate, and automatically tick `- [ ]` into `- [x]` in external memory before advancing to the next item.

## 3. Git & Development Workflow
- Follow Conventional Commits and branch naming conventions as defined in [`.agents/rules/git-workflow.md`](.agents/rules/git-workflow.md).
