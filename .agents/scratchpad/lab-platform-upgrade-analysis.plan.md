# Lab Platform Upgrade Analysis - Execution Plan & Working Memory

> **Status**: COMPLETE
> **Primary objective**: Validate the supplied Auth, Lab Workspace, three lab strategies, and Contributor Studio problem statement against the current repository, then publish an evidence-based architecture analysis in `docs/` without modifying application code.
> **Execution intent**: Confirmed by the user's explicit request to write the analysis into repository documentation.

---

### Task 1: Establish the current-state evidence baseline
- [x] **Subtask 1.1**: Inspect Auth/session implementation and tests (Files: `MODULE_BE/src/modules/auth/auth.service.ts`, `MODULE_BE/src/modules/users/users.service.ts`, `MODULE_FE/src/services/api.client.ts`, auth hooks/store, relevant tests/scripts).
  - *Verify*: Record concrete current behavior, line-level evidence, and whether the claimed token-rotation race is reproducible or structurally plausible.
- [x] **Subtask 1.2**: Inspect the Lab workspace, runner, types, and submission flow (Files: `MODULE_FE/src/pages/lab/LabWorkspacePage.tsx`, `MODULE_FE/src/features/lab/**`, `MODULE_FE/src/types/lab.types.ts`, relevant backend lab files).
  - *Verify*: Map actual responsibilities, size/complexity, existing support for `js_worker`, `sql_worker`, and `quizlet`, and mismatches with the proposed strategy architecture.
- [x] **Subtask 1.3**: Inspect Contributor Studio and persistence contract (Files: `MODULE_FE/src/pages/lab/LabStudioPage.tsx`, `MODULE_FE/src/pages/lab/_components/*Builder.tsx`, `MODULE_BE/src/modules/labs/**`, `MODULE_BE/prisma/schema.prisma`).
  - *Verify*: Document the current authoring flow, schema constraints, autosave/preview behavior, and feasibility of Markdown-first mapping without schema changes.

### Task 2: Produce the architecture/problem analysis
- [x] **Subtask 2.1**: Write the structured analysis document (File: `docs/12-lab-platform-upgrade-analysis.md`).
  - *Verify*: Document follows the mandatory three-part docs-as-code structure; distinguishes verified facts, hypotheses, risks, decisions, and open questions; includes recommended target architecture and phased acceptance criteria.
- [x] **Subtask 2.2**: Cross-check analysis against existing Auth, Lab Worker, Studio, backlog, and database documentation (Files: `docs/workflows/01-auth-login-to-home.md`, `docs/workflows/03-lab-practice-webworker.md`, `docs/workflows/06-create-lab-studio.md`, `docs/03-product-backlog.md`, `docs/05-database.md`).
  - *Verify*: Conflicts and stale documentation are explicitly listed under Open Issues; no source discrepancy is silently resolved.

### Task 3: Register and audit the documentation change
- [x] **Subtask 3.1**: Add the analysis to the documentation register (File: `docs/README.md`).
  - *Verify*: Register entry includes version, date, author, status, and repository-relative link.
- [x] **Subtask 3.2**: Validate formatting, references, and change scope (Files: `docs/12-lab-platform-upgrade-analysis.md`, `docs/README.md`, this scratchpad).
  - *Verify*: Markdown/link checks pass; `git diff --check` passes; diff contains only the planned documentation and working-memory files.

