# Full Feature Flow Documentation — Execution Plan

> **Status**: COMPLETE — verified 2026-10-24
> **Goal**: Document every implemented user, contributor, administrator, and platform feature as traceable end-to-end flows grounded in the current routes, controllers, services, guards, persistence, and UI states.

### Task 1: Inventory and coverage map

- [x] **Subtask 1.1 — Inventory feature surfaces and existing workflow coverage**
  - **Files**: `MODULE_FE/src/routes/index.tsx`, `MODULE_ADMIN/src/routes/index.tsx`, `MODULE_BE/src/modules/**/*`, `docs/workflows/*.md`.
  - **Verify**: every routed page and backend controller domain maps to a documented feature family or an explicitly identified implementation gap.
  - **Evidence**: audited 21 learner/contributor routes, 11 admin routes, and controller domains for auth, users, series, labs, review, contributor applications, feedback, groups, entitlements, and audit logs. Existing WF-01–WF-14 cover the core journeys; uncovered families are account/preferences, learner dashboard/library, strategy-specific learning units, and admin content/plans/audit.

- [x] **Subtask 1.2 — Define canonical feature-flow template and truth labels**
  - **Files**: `docs/workflows/README.md`, new feature-flow catalog.
  - **Verify**: template covers actor, trigger, preconditions, happy path, alternatives/errors, authorization, API/data effects, UI states, observability, and source evidence; unsupported claims are labeled.
  - **Evidence**: the workflow hub now defines the required per-feature template and `IMPLEMENTED`, `PARTIAL`, `PLACEHOLDER`, and `EXTERNAL` truth labels. New documents use code-backed evidence and explicitly mark simulated or absent behavior.

### Task 2: Write missing full-flow documents

- [x] **Subtask 2.1 — Account lifecycle, profile, preferences, and session recovery**
  - **Files**: new `docs/workflows/15-account-lifecycle-profile-and-preferences.md` plus auth/profile source references.
  - **Verify**: register/login/Google callback/refresh/logout/change-password/profile/theme/language/forgot-password implementation status are covered without inventing APIs.
  - **Evidence**: WF-15 documents all requested branches and identifies registration response mismatch, simulated password reset, read-only profile, and OAuth refresh-token URL exposure as explicit gaps.

- [x] **Subtask 2.2 — Learner dashboard, saved series, submissions, and progress**
  - **Files**: new `docs/workflows/16-learner-dashboard-and-library.md` plus dashboard/lab source references.
  - **Verify**: overview stats, saved-series state, submission history, contributor routing, and loading/empty/error states are covered.
  - **Evidence**: WF-16 covers server-derived KPIs, deduplicated completion semantics, client filtering/sorting, contributor route guards/redirects, and truthfully labels saved series as a non-persistent placeholder.

- [x] **Subtask 2.3 — Learning-unit strategy flows**
  - **Files**: new `docs/workflows/17-learning-unit-strategies.md` plus workspace/strategy/backend grading references.
  - **Verify**: THEORY, QUIZ, SQL, AUTOMATION V1/V2/V3, and fallback routing describe client execution versus authoritative backend behavior.
  - **Evidence**: WF-17 maps every registered strategy and fallback, shared shell gates/layouts, explicit theory lifecycle, quiz/SQL/server grading, legacy automation compatibility, and V3 feature-flag/submission validation.

- [x] **Subtask 2.4 — Admin content authoring, plans, entitlements, and audit logs**
  - **Files**: new `docs/workflows/18-admin-content-plans-and-audit.md` plus Admin and backend source references.
  - **Verify**: admin content CRUD/studio, plan-feature management, user overrides/subscriptions, and audit-log browsing are covered with permission boundaries.
  - **Evidence**: WF-18 covers admin-only guards, hierarchical content CRUD, local-draft and SQL-preflight gates, plan/feature mutations, backend effective-access resolution, direct overrides, and the actual scope/limitations of audit logging.

### Task 3: Integrate and cross-check

- [x] **Subtask 3.1 — Publish master feature-flow coverage matrix**
  - **Files**: `docs/workflows/README.md`.
  - **Verify**: all learner, contributor, admin, and platform feature families appear exactly once in the matrix with links and implementation status.
  - **Evidence**: the workflow hub contains an 18-row feature-family matrix with canonical workflow and truth status, plus WF-15–WF-18 directory entries; the root document register is updated from 14 to 18 workflows.

- [x] **Subtask 3.2 — Cross-check old workflows against current code**
  - **Files**: existing `docs/workflows/01`–`14`, code references.
  - **Verify**: obvious stale routes, domains, or unsupported behaviors are corrected or marked as planned/manual rather than stated as implemented.
  - **Evidence**: rewrote WF-02, WF-08, and WF-12 to remove nonexistent catalog/topic/payment APIs; corrected `/practice` to `/labs`, SQL worker path, admin domain, missing architecture reference, and release-readiness register status. Repository search reports no stale route/module patterns and all workflow file-URI targets resolve.

- [x] **Subtask 3.3 — Validate documentation integrity and close plan**
  - **Files**: `docs/workflows/**/*.md`, this plan.
  - **Verify**: relative Markdown links resolve, removed-doc references stay absent, all new flow docs use the required three-part structure, `git diff --check` passes, and this plan has no open checkbox.
  - **Evidence**: all workflow relative links resolve; new/rewritten WF-02, WF-08, WF-12 and WF-15–WF-18 contain required front matter plus Document Information, Content, and References; stale route/module/reference search is clean; `git diff --check` exits 0. The skill-referenced `validate_docs.py` and `references/cross-check.md` are absent from this checkout, so equivalent repository-based checks were executed directly. No application code, database state, commit, or remote was modified by this documentation pass.
