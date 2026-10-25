# Fix `sampleDataSql` Type Error - Execution Plan & Working Memory

> **Status**: COMPLETE — verified 2026-10-25
> **Goal**: Remove the invalid legacy-property access from the V3 curriculum preflight while preserving V3's canonical `seedSql` contract.

### Task 1: Confirm contract boundary
- [x] **Subtask 1.1**: Trace `sampleDataSql`, `seedSql`, and the inferred V3 SQL config type (Files: `MODULE_BE/test/v3-curriculum-preflight.spec.ts`, `MODULE_BE/prisma/v3-curriculum-data.ts`)
  - *Verify*: Confirm whether V3 data supports the legacy alias.
  - *Evidence*: Every V3 SQL lab declares canonical `seedSql`; `sampleDataSql` appears only in the failing preflight fallback and is not part of the inferred V3 config.

### Task 2: Surgical fix and verification
- [x] **Subtask 2.1**: Update the V3 preflight assertion to validate `seedSql` only (File: `MODULE_BE/test/v3-curriculum-preflight.spec.ts`)
  - *Verify*: Focused TypeScript check and V3 preflight test pass.
  - *Evidence*: Standalone TypeScript check passes with Node types; focused V3 preflight passes 6/6.
- [x] **Subtask 2.2**: Run Backend build/regression and audit diff (Files: `MODULE_BE/**`)
  - *Verify*: Backend build/tests pass and diff contains only the intended fix plus this plan.
  - *Evidence*: Backend tests pass 56/56, Nest build passes, and `git diff --check` passes; product diff is one assertion line.
