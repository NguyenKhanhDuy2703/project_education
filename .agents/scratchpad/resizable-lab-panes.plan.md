# Resizable Lab Panes Implementation Plan (Theory, Code & Results)

> **Status**: IN PROGRESS  
> **Source Base**: `feat/docs-readme-video-preview-showcase-and-english`  
> **Goal**: Integrate `shadcn` resizable (`react-resizable-panels`) to allow users to freely resize:
> 1. Khối Lý thuyết (Theory pane) — Horizontal resize
> 2. Khối Code (Monaco Editor pane) — Vertical resize
> 3. Khối Kết quả (Results / Diff / Schema pane) — Vertical resize

---

## Checklist

### Task 1: Horizontal Resizable Split in `LabWorkspacePage.tsx` & `LabTheoryPane.tsx`
- [x] Subtask 1.1: Refactor `LabTheoryPane.tsx` to support full width/height when mounted inside a `ResizablePanel` without hardcoded `md:w-[45%]`.
  - *File*: `MODULE_FE/src/pages/lab/_components/LabTheoryPane.tsx`
  - *Verify*: `npm run build` in `MODULE_FE` passes
- [x] Subtask 1.2: Integrate `ResizablePanelGroup`, `ResizablePanel`, and `ResizableHandle` in `LabWorkspacePage.tsx` for horizontal resizing between Theory and Strategy Workspace.
  - *File*: `MODULE_FE/src/pages/lab/LabWorkspacePage.tsx`
  - *Verify*: Layout renders cleanly with drag handle between columns

### Task 2: Vertical Resizable Split in `SqlPracticeWorkspace.tsx`
- [x] Subtask 2.1: Replace fixed `h-64` bottom panel in `SqlPracticeWorkspace.tsx` with vertical `ResizablePanelGroup`.
  - *File*: `MODULE_FE/src/features/lab/strategies/SqlPracticeWorkspace.tsx`
  - *Verify*: Code editor and Result/Diff panel resize vertically with handle

### Task 3: Vertical Resizable Split in `AutomationTestWorkspace.tsx`
- [x] Subtask 3.1: Replace fixed `h-64` bottom panel in `AutomationTestWorkspace.tsx` with vertical `ResizablePanelGroup`.
  - *File*: `MODULE_FE/src/features/lab/strategies/AutomationTestWorkspace.tsx`
  - *Verify*: Code/Cloze editor and Test Results panel resize vertically with handle

### Task 4: Automated Verification & Live UI Testing
- [x] Subtask 4.1: Run `npm run build` and `npm run test` in `MODULE_FE`.
  - *Verify*: Production build succeeds and tests pass (38/38 suites, 186/186 tests)
- [x] Subtask 4.2: Verify resizing functionality via automated test suite.
  - *Verify*: Panels dynamically resize, `data-orientation` and `aria-orientation` attributes verified
- [ ] Subtask 4.3: Commit and push changes to remote repository.
  - *Verify*: `git push` succeeds and working tree is clean
