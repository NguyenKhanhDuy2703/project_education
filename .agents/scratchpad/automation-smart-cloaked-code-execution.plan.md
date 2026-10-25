# Automation Testing Smart Cloaked Code - Execution Plan & Working Memory

> **Status**: COMPLETED — implementation checklist 7/7 closed
> **Goal**: Implement Phase A of Smart Cloaked Code (Automation V2) vertical slice, fixing the boilerplate overexposure, submission race condition, and status bug while preserving 100% legacy V1 compatibility.

---

### Task 1: Content Contract & Codec (Automation V2 / Smart Cloze)
- [x] **Subtask 1.1**: Define Automation V2 types (`AutomationExerciseV2`, `BlankDefinition`, `TemplateSegment`, etc.) in `MODULE_FE/src/types/lab.types.ts` with backward compatibility. (File: `MODULE_FE/src/types/lab.types.ts`)
  - *Verify*: `npm test -- --run` type check passes.
- [x] **Subtask 1.2**: Update `labContentCodec.ts` (FE and BE) & DTOs to normalize and serialize Automation V2 smart cloze envelopes alongside V1. (Files: `MODULE_FE/src/features/lab/domain/labContentCodec.ts`, `MODULE_BE/src/modules/labs/domain/labContentCodec.ts`, `MODULE_BE/src/modules/labs/dto/lab-contract-v1.dto.ts`)
  - *Verify*: Unit tests in `MODULE_FE/src/test/lab-codec.test.ts` pass with V2 roundtrip.

### Task 2: Code Assembly & Blank Validation Engine
- [x] **Subtask 2.1**: Implement template code assembly engine (`assembleClozeCode`) and validation utilities (`validateBlankAnswers`). (File: `MODULE_FE/src/features/lab/runtime/cloze/clozeEngine.ts`)
  - *Verify*: Pure unit tests in `MODULE_FE/src/test/cloze-engine.test.ts` pass.

### Task 3: Smart Cloze Learner Workspace Component & Defect Fixes
- [x] **Subtask 3.1**: Build `SmartClozeEditor` component rendering locked code, collapsible managed blocks, and accessible inline form controls for blanks. (File: `MODULE_FE/src/features/lab/components/SmartClozeEditor.tsx`)
  - *Verify*: Component unit tests in `MODULE_FE/src/test/smart-cloze-editor.test.tsx` pass.
- [x] **Subtask 3.2**: Enhance `AutomationTestWorkspace.tsx` to conditionally render `SmartClozeEditor` when in `smart_cloze` mode, fix the submission race condition, and fix the `status: passed ? 'passed' : 'passed'` bug. (File: `MODULE_FE/src/features/lab/strategies/AutomationTestWorkspace.tsx`)
  - *Verify*: Component tests in `MODULE_FE/src/test/automation-test-workspace.test.tsx` pass.

### Task 4: End-to-End Verification & Characterization
- [x] **Subtask 4.1**: Write E2E / flow tests for Smart Cloaked Code (complete 4 blanks scenario, validation errors, reset, passing execution, submission payload). (File: `MODULE_FE/src/test/smart-cloze-flow.test.ts`)
  - *Verify*: `npm test -- --run` passes across all test files (both new and legacy).
- [x] **Subtask 4.2**: Full build audit (FE `npm run build` and BE `npm test` & `npm run build`). (Files: `MODULE_FE`, `MODULE_BE`)
  - *Verify*: Both FE and BE builds pass cleanly with 0 errors.
