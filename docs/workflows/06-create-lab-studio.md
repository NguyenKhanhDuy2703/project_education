---
doc_type: workflow
title: Sequence Diagram - Two-Step Lab Creation Studio (Practice Lab Studio Creation Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Contributor Studio Subsystem, Two-Step Lab Authoring (Markdown Theory + Exercise Setup), Solution Test Runner & Verification Gate
date: 2026-10-14
source_file: "MODULE_FE/src/pages/contributor/ContributorCreatePage.tsx, MODULE_BE/src/modules/labs"
status: final
language: en
related_docs: [03-lab-practice-webworker.md, 05-create-series.md, 07-content-review-and-publish.md]
---

# Sequence Diagram: Two-Step Lab Creation Studio (Practice Lab Studio Creation Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | Two-Step Lab Creation Studio Workflow |
| **Version** | v1.0 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | Authoring workflow for Contributors and Instructors in the Two-Step Studio: Step 1 (Theory authoring via synchronized Split-View Markdown Editor & Live Preview) and Step 2 (Interactive Exercise Builder for JS/SQL/Quizlet, automated Test Case composition, and mandatory Pre-flight Solution Runner verification before publishing) |
| **Date** | 2026-10-14 |
| **Source Reference** | `MODULE_FE/src/pages/contributor/ContributorCreatePage.tsx`, `MODULE_BE/src/modules/labs/labs.controller.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Step 1 — Theory & Guidelines**:
  - Left Sidebar (~280px): Global properties (Parent Series assignment, Lab Title, estimated duration, Sandbox type [JS / SQL / Quizlet], PRO access flag) and validation checklist.
  - Right Split Screen: Markdown raw source editor on the left with a synchronized live-rendered HTML preview on the right.
  - Format-specific smart templates pre-populate boilerplate instructions.
- **Step 2 — Exercise Setup & Pre-flight Testing**:
  - Collapsible Theory reference pane retained for ongoing context.
  - Tailored builder configurations:
    - **JS / SQL**: Starter Code (skeleton provided to students), Solution Code (clean reference implementation), and Test Case cards (Description, Input assertions, Expected Output).
    - **Quizlet**: Multiple-choice question authoring with answer options (A/B/C/D) and correct answer designation.
  - **Mandatory Pre-flight Solution Test Runner**: The author is required to execute the reference Solution Code against all defined test assertions. The **"Submit for Review"** / **"Publish"** actions remain disabled until 100% of test cases pass, eliminating defective exercises.

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Contributor / Instructor** | Actor | Authors theory, defines starter and solution code, sets test cases, and executes verification runs |
| **Step 1: Theory Studio** | Client UI | Split-view Markdown Editor with synchronized live preview and length checks |
| **Step 2: Exercise Studio** | Client UI | Configures Starter Code, Solution Code, and visual test case assertion cards |
| **Solution Test Runner** | Client Engine | Dispatches Solution Code and Test Cases to the Web Worker Sandbox for client-side evaluation |
| **Labs Controller & Service** | NestJS Backend | Persists drafts, validates test case schemas, and handles review submission workflows |
| **PostgreSQL Database** | Storage | Houses `labs`, `test_cases`, and `lab_solutions` tables |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Contributor as Contributor / Author
    participant Studio1 as Step 1: Theory Studio
    participant Studio2 as Step 2: Exercise Studio
    participant Runner as Solution Test Runner (Worker)
    participant BE as NestJS Backend (LabsModule)
    participant DB as PostgreSQL

    Note over Contributor, DB: Phase 1: Markdown Theory & Instruction Authoring
    Contributor->>Studio1: Select Parent Series & Sandbox Type (e.g. SQL)
    Studio1->>Studio1: Pre-populate Smart Template (Theory, Syntax, Example Prompt)
    Contributor->>Studio1: Composes instructional content in Markdown editor
    Studio1-->>Contributor: Live preview updates continuously in real-time
    Studio1->>Studio1: Validate checklist (Title ✓, Series ✓, Length ≥ 100 chars ✓)
    Contributor->>Studio1: Click "Next: Exercise Setup →"

    Note over Contributor, DB: Phase 2: Exercise Configuration & Test Cases
    Studio1->>Studio2: Transition to Step 2 (Retain collapsed theory pane for reference)
    Contributor->>Studio2: Provide Starter Code (Initial skeleton query for students)
    Contributor->>Studio2: Provide Solution Code (Complete authoritative reference implementation)
    loop Add Test Cases
        Contributor->>Studio2: Click "+ Add Test Case"
        Contributor->>Studio2: Enter: Case Name, Simulated Input, Expected Output
    end

    Note over Contributor, DB: Phase 3: Mandatory Pre-flight Solution Verification
    Contributor->>Studio2: Click "Run Solution with Tests"
    Studio2->>Runner: Transmit SolutionCode + Test Cases payload
    Runner->>Runner: Execute test suite inside Web Worker Sandbox
    
    alt At Least One Assertion Fails or Syntax Exception
        Runner-->>Studio2: Test Failure: ✗ Case #3 Failed (Expected: 5 rows, Got: 4 rows)
        Studio2-->>Contributor: Highlight failure details; keep Submit/Publish buttons disabled
        Note over Contributor, Studio2: Author reviews stack trace and refines Test or Solution
    else All Test Cases Pass (100% Passed)
        Runner-->>Studio2: Success: ✓ 4/4 Tests Passed (Execution time: 38ms)
        Studio2-->>Contributor: Render green verification confirmation
        Studio2->>Studio2: Unlock "Submit for Review" / "Publish" buttons
    end

    Note over Contributor, DB: Phase 4: Persistence & Submission
    Contributor->>Studio2: Click "Submit for Review" (or "Save Draft")
    Studio2->>BE: POST /api/labs/studio { theoryMarkdown, starterCode, solutionCode, testCases, ... }
    BE->>DB: INSERT INTO labs + INSERT INTO test_cases
    DB-->>BE: Persisted records successfully
    BE-->>Studio2: 200 OK { labId: "lab-sql-new", status: "submitted" }
    Studio2-->>Contributor: Display success toast and redirect to My Content overview
```

---

### 2.4. Technical Specifications & Architecture Details

1. **Resolution of the "Blind Authoring" Problem**:
   - Legacy workflow lacked live testing or discrete test case fields.
   - The two-step studio formalizes test cases into an array of structured objects: `testCases: Array<{ id, name, input, expectedOutput, isHidden }>`, enabling visual row editing.
2. **Mandatory Pre-flight Verification Gate**:
   - The UI enforces `solutionVerified === true`.
   - The "Submit for Review" button remains disabled with a clarifying tooltip: *"You must successfully verify your solution against all test cases before submitting."*
3. **Automatic Local Draft Preservation**:
   - While editing, the client automatically backs up the working document into `localStorage` every 30 seconds to prevent data loss.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Solution Runtime Exceeds 2 Seconds** | Worker Timeout Guard triggers | Flags Time Limit Exceeded on Solution, advising query/algorithm optimization |
| **Empty or Malformed Test Case Input** | Form validation highlights card | Red border on input card with alert *"Please provide an input value for this assertion"* |
| **Unsaved Navigation (Tab Switch / Back)** | Triggers browser `beforeunload` event | Displays modal: *"You have unsaved changes. Are you sure you want to exit?"* |

---

## 3. References & Source Links

- **Frontend Codebase**:
  - Contributor Create Lab Page: [ContributorCreatePage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/contributor/ContributorCreatePage.tsx)
  - Markdown Editor with Preview: [MarkdownEditorWithPreview.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/_components/MarkdownEditorWithPreview.tsx)
  - JS Worker Builder: [JsWorkerExerciseBuilder.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/_components/JsWorkerExerciseBuilder.tsx)
- **Backend Codebase**:
  - Labs Controller: [labs.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/labs/labs.controller.ts)
- **Related Workflows**:
  - Series Creation: [05-create-series.md](file:///d:/Projects/study-web/docs/workflows/05-create-series.md)
  - Content Review & Publishing: [07-content-review-and-publish.md](file:///d:/Projects/study-web/docs/workflows/07-content-review-and-publish.md)
  - Web Worker Sandbox Execution: [03-lab-practice-webworker.md](file:///d:/Projects/study-web/docs/workflows/03-lab-practice-webworker.md)
