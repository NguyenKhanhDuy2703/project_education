# Git Branch Separation & Push Plan (Monorepo Triad)

> **Status**: IN PROGRESS  
> **Source Base**: `dev`  
> **Target Remote**: `origin` (`https://github.com/NguyenKhanhDuy2703/project_education.git`)  
> **Monorepo Scope Isolation Standard**: `.agents/rules/git-workflow.md`

---

## Checklist

### Task 1: Backend Branch (`feat/be-curriculum-cleanup-and-sql-scaffolds`)
- [x] Subtask 1.1: Create branch `feat/be-curriculum-cleanup-and-sql-scaffolds` from `dev`, stage `MODULE_BE/`, and commit with Conventional Commit.
  - *Files*: `MODULE_BE/README.md`, `MODULE_BE/prisma/seed.ts`, `MODULE_BE/scripts/sync-curriculum-and-sql.ts`
  - *Verify*: `git log -1` verifies commit only contains `MODULE_BE/`
- [x] Subtask 1.2: Run backend verification gate.
  - *Verify*: `npm run build` in `MODULE_BE` exits with code 0

### Task 2: Frontend Branch (`feat/fe-sql-sandbox-setup-and-resilience`)
- [x] Subtask 2.1: Return to `dev`, create branch `feat/fe-sql-sandbox-setup-and-resilience`, stage `MODULE_FE/`, and commit.
  - *Files*: `MODULE_FE/README.md`, `MODULE_FE/src/features/lab/`, `MODULE_FE/src/test/`, `MODULE_FE/vite.config.ts`
  - *Verify*: `git log -1` verifies commit only contains `MODULE_FE/`
- [x] Subtask 2.2: Run frontend verification gate.
  - *Verify*: `npm run build` in `MODULE_FE` exits with code 0

### Task 3: Docs & Documentation Branch (`feat/docs-readme-video-preview-showcase-and-english`)
- [/] Subtask 3.1: Return to `dev`, create branch `feat/docs-readme-video-preview-showcase-and-english`, stage `README.md`, `README.vi.md`, `MODULE_ADMIN/README.md`, `LICENSE`, `docs/assets/`, `.agents/`, and commit.
  - *Files*: `README.md`, `README.vi.md`, `MODULE_ADMIN/README.md`, `LICENSE`, `docs/assets/`, `.agents/`
  - *Verify*: `git log -1` verifies commit only contains docs, assets, and plans
- [ ] Subtask 3.2: Verify no uncommitted working tree changes remain.
  - *Verify*: `git status` shows clean working tree

### Task 4: Push to Remote & Monorepo State Verification
- [ ] Subtask 4.1: Push `feat/be-curriculum-cleanup-and-sql-scaffolds` to `origin`.
  - *Verify*: `git push -u origin feat/be-curriculum-cleanup-and-sql-scaffolds` succeeds
- [ ] Subtask 4.2: Push `feat/fe-sql-sandbox-setup-and-resilience` to `origin`.
  - *Verify*: `git push -u origin feat/fe-sql-sandbox-setup-and-resilience` succeeds
- [ ] Subtask 4.3: Push `feat/docs-readme-video-preview-showcase-and-english` to `origin`.
  - *Verify*: `git push -u origin feat/docs-readme-video-preview-showcase-and-english` succeeds
- [ ] Subtask 4.4: Checkout back to `dev` and report PR links and status.
  - *Verify*: On branch `dev` and working directory clean
