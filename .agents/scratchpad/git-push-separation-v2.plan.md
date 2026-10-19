# Git Push & Branch Separation Plan (V2)

> **Status**: ⏸️ WAITING FOR HUMAN CONFIRMATION (Planning Phase Complete)  
> **Repository**: `study-web`  
> **Source Base**: `dev` (up to date with `origin/dev`)  
> **Compliance**: Monorepo Scope Isolation (`MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`, `docs`), Conventional Commits, Path-Filter CI/CD Optimization  

---

## 1. Core Principles & Isolation Strategy

1. **Strict Monorepo Scope Isolation**:
   - `MODULE_BE` changes must NEVER be mixed with `MODULE_FE` or `MODULE_ADMIN`.
   - The CI/CD pipeline uses `dorny/paths-filter` to trigger dedicated test/build workers (`_be-test-worker.yml`, `_fe-test-worker.yml`, `_promote-worker.yml`). Monolithic commits trigger redundant or conflicting builds.
2. **Branch Naming Standard**:
   - Format: `<type>/<scope>-<short-description>` created from `dev`.
## 2. Granular Execution Checklist

### Task 1: Housekeeping & Git Ignore
- [x] **Subtask 1.1**: Add Python bytecode patterns (`**/__pycache__/`, `*.py[cod]`) to `.gitignore` and remove untracked `__pycache__` artifacts.
  - *Verify*: `git status` no longer lists `__pycache__`.

### Task 2: Backend Branch (`feat/be-auth-session-and-sql-grading`)
- [x] **Subtask 2.1**: Create branch `feat/be-auth-session-and-sql-grading` from `dev`, stage all `MODULE_BE/` files, and commit with `feat(be): implement auth session token rotation and authoritative sql grading worker`.
  - *Verify*: `git log -1` verifies clean commit scoped exclusively to `MODULE_BE/`.
- [x] **Subtask 2.2**: Run Backend verification gate (`npm test` and `npm run build` in `MODULE_BE`).
  - *Verify*: 13/13 tests pass, build produces zero errors.

### Task 3: Frontend Branch (`feat/fe-pglite-sql-workspace-and-cloze`)
- [x] **Subtask 3.1**: Return to `dev`, create branch `feat/fe-pglite-sql-workspace-and-cloze` from `dev`, stage all `MODULE_FE/` files, and commit with `feat(fe): modularize lab workspace, integrate pglite sql engine, and add smart cloze v2`.
  - *Verify*: `git log -1` verifies clean commit scoped exclusively to `MODULE_FE/`.
- [x] **Subtask 3.2**: Run Frontend verification gate (`npm test -- --run` and `npm run build` in `MODULE_FE`).
  - *Verify*: 182/182 tests pass, build produces zero errors.

### Task 4: Admin Branch (`feat/admin-modernization-login-and-review-queue`)
- [x] **Subtask 4.1**: Return to `dev`, create branch `feat/admin-modernization-login-and-review-queue` from `dev`, stage all `MODULE_ADMIN/` files, and commit with `feat(admin): modernize enterprise login, add v2 envelope inspection to review queue, and set up vitest`.
  - *Verify*: `git log -1` verifies clean commit scoped exclusively to `MODULE_ADMIN/`.
- [x] **Subtask 4.2**: Run Admin verification gate (`npm test` and `npm run build` in `MODULE_ADMIN`).
  - *Verify*: 40/40 tests pass, build produces zero errors.

### Task 5: Docs & Infrastructure Branch (`feat/docs-lab-platform-upgrade-and-runbooks`)
- [/] **Subtask 5.1**: Return to `dev`, create branch `feat/docs-lab-platform-upgrade-and-runbooks` from `dev`, stage `docs/`, `AGENTS.md`, `.agents/`, `.github/`, `.gitignore`, and commit with `docs: document lab platform upgrade, adrs, formal specs, and multi-agent runbooks`.
  - *Verify*: `git log -1` verifies clean commit scoped exclusively to docs and governance.

### Task 6: Push All Branches to Remote `origin`
- [ ] **Subtask 6.1**: Push `feat/be-auth-session-and-sql-grading` to `origin`.
- [ ] **Subtask 6.2**: Push `feat/fe-pglite-sql-workspace-and-cloze` to `origin`.
- [ ] **Subtask 6.3**: Push `feat/admin-modernization-login-and-review-queue` to `origin`.
- [ ] **Subtask 6.4**: Push `feat/docs-lab-platform-upgrade-and-runbooks` to `origin`.
  - *Verify*: All 4 branches pushed to remote with tracking up to date.

### Task 7: Return to `dev` & Monorepo State Verification
- [ ] **Subtask 7.1**: Checkout `dev` and inspect git status and branch summary.
  - *Verify*: `git branch -v` shows all 4 branches created cleanly.

---

## 2. Multi-Branch Division Structure

### Branch 1: Backend Architecture & Grading Authority
- **Branch Name**: `feat/be-auth-session-and-sql-grading`
- **Scope**: `MODULE_BE/`
- **Conventional Commit**: `feat(be): implement auth session token rotation and authoritative sql grading worker`
- **Verification Gate**:
  - `npm test` in `MODULE_BE` (13/13 passed)
  - `npm run build` in `MODULE_BE` (0 errors)
- **Included Files**:
  - `MODULE_BE/package.json`, `MODULE_BE/package-lock.json`
  - `MODULE_BE/prisma/schema.prisma`, `MODULE_BE/prisma/seed.ts`
  - `MODULE_BE/prisma/migrations/20261018180000_add_auth_sessions/`
  - `MODULE_BE/src/modules/auth/` (`auth-session.service.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.module.ts`)
  - `MODULE_BE/src/modules/labs/` (`domain/`, `dto/`, `sql-grading.service.ts`, `sql-grading.worker.ts`, `labs.service.ts`, `labs.controller.ts`, `labs.module.ts`)
  - `MODULE_BE/src/modules/review/` (`review.service.ts`, `review.module.ts`)
  - `MODULE_BE/test/` (All 6 test suites)

### Branch 2: Frontend Lab Platform & PGlite Engine
- **Branch Name**: `feat/fe-pglite-sql-workspace-and-cloze`
- **Scope**: `MODULE_FE/`
- **Conventional Commit**: `feat(fe): modularize lab workspace, integrate pglite sql engine, and add smart cloze v2`
- **Verification Gate**:
  - `npm test -- --run` in `MODULE_FE` (182/182 passed)
  - `npm run build` in `MODULE_FE` (0 errors)
- **Included Files**:
  - `MODULE_FE/package.json`, `MODULE_FE/package-lock.json`, `MODULE_FE/vite.config.ts`
  - `MODULE_FE/src/features/auth/` (`components/SessionExpiredModal.tsx`, `services/`, `utils/`, `hooks/`, `api/`)
  - `MODULE_FE/src/features/lab/` (`components/`, `domain/`, `hooks/`, `quiz/`, `runtime/`, `sql-engine/`, `strategies/`, `utils/`, `workers/`, `api/`)
  - `MODULE_FE/src/pages/` (`lab/`, `HomePage.tsx`)
  - `MODULE_FE/src/services/` (`api.client.ts`, `topicTags.service.ts`, `formatBadge.service.ts`)
  - `MODULE_FE/src/stores/slices/auth.slice.ts`, `MODULE_FE/src/types/lab.types.ts`
  - `MODULE_FE/src/test/` (All 37 test suites)

### Branch 3: Admin Portal Modernization
- **Branch Name**: `feat/admin-modernization-login-and-review-queue`
- **Scope**: `MODULE_ADMIN/`
- **Conventional Commit**: `feat(admin): modernize enterprise login, add v2 envelope inspection to review queue, and set up vitest`
- **Verification Gate**:
  - `npm test` in `MODULE_ADMIN` (40/40 passed)
  - `npm run build` in `MODULE_ADMIN` (0 errors)
- **Included Files**:
  - `MODULE_ADMIN/package.json`, `MODULE_ADMIN/package-lock.json`, `MODULE_ADMIN/vite.config.ts`
  - `MODULE_ADMIN/src/pages/auth/AdminLoginPage.tsx`
  - `MODULE_ADMIN/src/pages/admin/` (`AdminReviewQueue.tsx`, `AdminTopicTagsModal.tsx`, `AdminContentPage.tsx`, `AdminContributorApplicationsPage.tsx`, `AdminLabStudioPage.tsx`, all exercise builders)
  - `MODULE_ADMIN/src/components/domain/ChangePasswordModal.tsx`
  - `MODULE_ADMIN/src/features/` (`admin/api/review.admin.api.ts`, `lab/api/lab.api.ts`, `lab/hooks/useLabWorker.ts`)
  - `MODULE_ADMIN/src/services/topicTags.service.ts`, `MODULE_ADMIN/src/types/lab.types.ts`
  - `MODULE_ADMIN/src/test/` (All 5 test suites)

### Branch 4: Docs-as-Code & Platform Specifications
- **Branch Name**: `docs/platform-upgrade-adrs-and-agent-runbooks`
- **Scope**: `docs/`, `AGENTS.md`, `.agents/`, `.github/`, `.gitignore`
- **Conventional Commit**: `docs: document lab platform upgrade, adrs, formal specs, and multi-agent runbooks`
- **Verification Gate**: Git status clean, no broken cross-references
- **Included Files**:
  - `docs/` (`README.md`, `12-*.md`, `13-*.md`, `admin/`, `adr/`, `agent-guides/`, `curriculum/`, `reports/`, `specs/`, `workflows/`)
  - `AGENTS.md`, `.agents/rules/`, `.agents/skills/`
  - `.github/pull_request_template.md`
  - `.agents/scratchpad/*.plan.md`
  - `.gitignore` (add `**/__pycache__/` and `*.py[cod]`, remove untracked python bytecode)

---

## 3. Step-by-Step Execution Sequence (When Confirmed)

1. **Step 1: Housekeeping**:
   - Add `**/__pycache__/` to `.gitignore` and delete `.agents/skills/ui-ux-pro-max/scripts/__pycache__/`.
2. **Step 2: Create & Commit Branch 1 (`MODULE_BE`)**:
   - `git checkout -b feat/be-auth-session-and-sql-grading dev`
   - `git add MODULE_BE/`
   - `git commit -m "feat(be): implement auth session token rotation and authoritative sql grading worker"`
   - `git checkout dev`
3. **Step 3: Create & Commit Branch 2 (`MODULE_FE`)**:
   - `git checkout -b feat/fe-pglite-sql-workspace-and-cloze dev`
   - `git add MODULE_FE/`
   - `git commit -m "feat(fe): modularize lab workspace, integrate pglite sql engine, and add smart cloze v2"`
   - `git checkout dev`
4. **Step 4: Create & Commit Branch 3 (`MODULE_ADMIN`)**:
   - `git checkout -b feat/admin-modernization-login-and-review-queue dev`
   - `git add MODULE_ADMIN/`
   - `git commit -m "feat(admin): modernize enterprise login, add v2 envelope inspection to review queue, and set up vitest"`
   - `git checkout dev`
5. **Step 5: Create & Commit Branch 4 (`docs`)**:
   - `git checkout -b docs/platform-upgrade-adrs-and-agent-runbooks dev`
   - `git add docs/ AGENTS.md .agents/ .github/ .gitignore`
   - `git commit -m "docs: document lab platform upgrade, adrs, formal specs, and multi-agent runbooks"`
   - `git checkout dev`
6. **Step 6: Push Branches to Remote**:
   - Push each branch individually:
     - `git push -u origin feat/be-auth-session-and-sql-grading`
     - `git push -u origin feat/fe-pglite-sql-workspace-and-cloze`
     - `git push -u origin feat/admin-modernization-login-and-review-queue`
     - `git push -u origin docs/platform-upgrade-adrs-and-agent-runbooks`
   - Each branch automatically triggers its isolated CI/CD worker without conflicts.
