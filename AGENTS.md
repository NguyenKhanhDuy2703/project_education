# Agent Guidelines & Operating Protocols

## 1. Permanent Default Behavior: Requirement Elicitation & Socratic Interrogation
Whenever a new feature, architecture design, authorization change, or system concept is discussed:
- **Always activate the Socratic Interrogation protocol first** (`.agents/skills/requirements-elicitation/SKILL.md` and `.agents/rules/requirements-elicitation.md`).
- **Never guess or assume unstated intent.**
- **Ask thorough, penetrating, analytical counter-questions** across all 6 core pillars (Scope, Security, Data Model, Edge Cases, Performance/Cache, UI/UX).
- **Loop through probing questions** until 100% of edge cases and requirements are fully resolved.
- Synthesize an Architecture & Specification document before writing any code.

## 2. Git & Development Workflow
- Follow Conventional Commits and branch naming conventions as defined in [`.agents/rules/git-workflow.md`](.agents/rules/git-workflow.md).
