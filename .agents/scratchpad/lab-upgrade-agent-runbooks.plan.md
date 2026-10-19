# Lab Upgrade Agent Runbooks - Execution Plan & Working Memory

> **Status**: COMPLETE
> **Objective**: Produce a repository-native guide set that maps every agent role to its Markdown runbook, owned files, forbidden files, task IDs, verification commands, handoff format, and a ready-to-copy execution prompt.
> **Scope boundary**: Documentation only. Do not implement Auth, Lab, SQL, Quiz, Studio, or QA feature code.

### Task 1: Define runbook information architecture
- [x] **Subtask 1.1**: Create the runbook index and shared operating protocol (File: `docs/agent-guides/README.md`).
  - *Verify*: Index lists all 10 agent guides, execution waves, source-of-truth rule, prompt usage, and conflict-avoidance policy; all links resolve.

### Task 2: Create foundation and Auth runbooks
- [x] **Subtask 2.1**: Create PM/Architecture foundation guide (File: `docs/agent-guides/00-pm-architecture-foundation.md`).
  - *Verify*: Covers Task 0, decisions, file ownership, baseline gate, copy-ready prompt, and handoff contract.
- [x] **Subtask 2.2**: Create Backend Auth guide (File: `docs/agent-guides/01-auth-backend.md`).
  - *Verify*: Covers Task 1A, migration/security boundaries, tests, copy-ready prompt, and handoff contract.
- [x] **Subtask 2.3**: Create Frontend Auth guide (File: `docs/agent-guides/02-auth-frontend.md`).
  - *Verify*: Covers Task 1B, API dependency, browser/session boundaries, tests, copy-ready prompt, and handoff contract.

### Task 3: Create contract and workspace runbooks
- [x] **Subtask 3.1**: Create Lab Contract guide (File: `docs/agent-guides/03-lab-content-contract.md`).
  - *Verify*: Covers Task 2, codec/DTO/persistence ownership, backward compatibility, prompt, and handoff.
- [x] **Subtask 3.2**: Create Workspace Shell guide (File: `docs/agent-guides/04-workspace-shell.md`).
  - *Verify*: Covers Task 3, exclusive ownership of `LabWorkspacePage.tsx`, integration boundaries, prompt, and handoff.

### Task 4: Create practice strategy runbooks
- [x] **Subtask 4.1**: Create Automation guide (File: `docs/agent-guides/05-automation-workspace.md`).
  - *Verify*: Covers Task 4, matcher/worker/component boundaries, prompt, and handoff.
- [x] **Subtask 4.2**: Create In-browser SQL guide (File: `docs/agent-guides/06-in-browser-sql-workspace.md`).
  - *Verify*: Covers Task 5, PGlite/sql.js decision gate, performance/security budgets, prompt, and handoff.
- [x] **Subtask 4.3**: Create Quiz guide (File: `docs/agent-guides/07-quiz-workspace.md`).
  - *Verify*: Covers Task 6, grading/assignment/palette boundaries, prompt, and handoff.

### Task 5: Create Studio and QA runbooks
- [x] **Subtask 5.1**: Create Contributor Studio guide (File: `docs/agent-guides/08-contributor-studio.md`).
  - *Verify*: Covers Task 7, parser/preview/autosave/preflight boundaries, prompt, and handoff.
- [x] **Subtask 5.2**: Create Integration QA and Docs guide (File: `docs/agent-guides/09-integration-qa-release.md`).
  - *Verify*: Covers Task 8, release gates, no feature-scope expansion, prompt, and handoff.

### Task 6: Register and audit the guide set
- [x] **Subtask 6.1**: Register the runbook hub in project docs (File: `docs/README.md`).
  - *Verify*: DOC register contains version/date/author/status and repository-relative link to the runbook hub.
- [x] **Subtask 6.2**: Validate guide links, prompt blocks, task mappings, whitespace, and planned change scope (Files: `docs/agent-guides/*.md`, `docs/README.md`, this scratchpad).
  - *Verify*: Every guide links to master plan and analysis; every guide has one copy-ready prompt and handoff template; all relative links resolve; `git diff --check` passes for tracked changes.

