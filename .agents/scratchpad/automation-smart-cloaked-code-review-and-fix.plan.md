# Automation Testing Smart Cloaked Code - Review & Fix Plan

> **Status**: IN_PROGRESS
> **Goal**: Review the prior attempt with skepticism, fix all 10 identified defects (string injection/unterminated literals, line numbering bug, type loss, editor staleness bypass, BE config erasure, solution leakage, missing aria-live, seed upgrade), and verify end-to-end.

---

### Task 1: Fix Cloze Engine & Assembly Vulnerabilities & Edge Cases
- [x] **Subtask 1.1**: Fix string quoting, code injection, and unterminated literal syntax crashes in `formatBlankValue`. (File: `MODULE_FE/src/features/lab/runtime/cloze/clozeEngine.ts`)
  - *Verify*: `npm test -- --run src/test/cloze-engine.test.ts` passes.
- [x] **Subtask 1.2**: Enhance `validateBlankAnswers` for `min`/`max` string length vs numeric checks, HTTP methods, and property path syntax rules. (File: `MODULE_FE/src/features/lab/runtime/cloze/clozeEngine.ts`)
  - *Verify*: `npm test -- --run src/test/cloze-engine.test.ts` passes.

### Task 2: Fix Smart Cloze Editor UI, Line Numbering, Accessibility & Type Integrity
- [x] **Subtask 2.1**: Fix line numbering bug (skipping lines due to managed folds in mixed array) and duplicate HTML `id` / React keys for multi-occurrence blanks. (File: `MODULE_FE/src/features/lab/components/SmartClozeEditor.tsx`)
  - *Verify*: `npm test -- --run src/test/smart-cloze-editor.test.tsx` passes.
- [x] **Subtask 2.2**: Ensure type-aware value coercion (`number`, `boolean`) on blank change so answers retain declared types end-to-end; add active blank reset affordance and `aria-live` test results announcements. (Files: `MODULE_FE/src/features/lab/components/SmartClozeEditor.tsx`, `MODULE_FE/src/features/lab/strategies/AutomationTestWorkspace.tsx`)
  - *Verify*: `npm test -- --run src/test/automation-test-workspace.test.tsx` passes.

### Task 3: Fix Workspace Staleness & Submission Race Across All Modes
- [x] **Subtask 3.1**: Enforce run staleness tracking for both Smart Cloze and Monaco editors (prevent submitting `passed` after code edits without re-running). (File: `MODULE_FE/src/features/lab/strategies/AutomationTestWorkspace.tsx`)
  - *Verify*: `npm test -- --run src/test/automation-test-workspace.test.tsx` passes.

### Task 4: Fix Backend Lab Service Config Loss & Solution Leakage Prevention
- [x] **Subtask 4.1**: Fix `findOne` in `LabsService` so `config` (including V2 `AutomationExerciseV2`, `publicTemplate`, `blanks`) is returned and not wiped by `config.summary`. (File: `MODULE_BE/src/modules/labs/labs.service.ts`)
  - *Verify*: `npm test` passes in `MODULE_BE`.
- [x] **Subtask 4.2**: Strip author-only grading rules (`gradingRules`, `hiddenChecks`) in `findOne` for non-admin/non-author learners to prevent DevTools solution leakage. (File: `MODULE_BE/src/modules/labs/labs.service.ts`)
  - *Verify*: `npm test` passes in `MODULE_BE`.
- [x] **Subtask 4.3**: Support `raw.config` directly in FE `normalizeLabDetail` in `labContentCodec.ts`. (File: `MODULE_FE/src/features/lab/domain/labContentCodec.ts`)
  - *Verify*: `npm test -- --run src/test/lab-codec.test.ts` passes.

### Task 5: Upgrade Seed Lab & Add Comprehensive Characterization Tests
- [x] **Subtask 5.1**: Upgrade the seeded automation lab `api-automation-test-status-schema` in `MODULE_BE/prisma/seed.ts` to V2 Smart Cloze contract with collapsed mocks, clean blanks, and non-leaked grading rules. (File: `MODULE_BE/prisma/seed.ts`)
  - *Verify*: Type check and seed compatibility tests pass.
- [x] **Subtask 5.2**: Add unit and integration tests covering all 10 identified edge cases (code injection prevention, unterminated string literals, line numbering with folds, type preservation, staleness tracking, backend config preservation, solution leakage prevention). (Files: `MODULE_FE/src/test/cloze-engine.test.ts`, `MODULE_FE/src/test/smart-cloze-editor.test.tsx`, `MODULE_FE/src/test/automation-test-workspace.test.tsx`, `MODULE_FE/src/test/smart-cloze-flow.test.ts`)
  - *Verify*: `npm test -- --run` in FE & BE passes with 100% green.

### Task 6: Full Verification & Final Report Delivery
- [x] **Subtask 6.1**: Run full test suites in FE and BE, run production builds (`npm run build` in FE & BE). (Files: all)
  - *Verify*: 100% green tests & zero build errors.
- [ ] **Subtask 6.2**: Issue final report via `send_message` according to instructions. (File: N/A)
  - *Verify*: Single comprehensive final message sent to parent.
