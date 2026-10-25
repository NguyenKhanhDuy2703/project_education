---
doc_type: workflow
title: Sequence Diagram - Automation V3 Client Sandbox & Low-Code Execution Flow
project: study-web
version: "3.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Automation V3 Workspace, Low-Code Block Builder, Web Worker AST Compiler, Iframe Fixture Sandbox, and Server-Side Declarative Grading
date: 2026-10-22
source_file: "MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx, MODULE_FE/src/features/lab/runtime/v3, MODULE_BE/src/modules/labs/automation-v3-validator.ts"
status: final
language: en
related_docs: [03-lab-practice-webworker.md, 04-lab-submission-progress.md, ../specs/lab-content-contract-v3.md, ../adr/003-client-automation-v3-sandbox-runner.md]
---

# Sequence Diagram: Automation V3 Client Sandbox & Low-Code Execution Flow

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | Automation V3 Client Sandbox & Low-Code Execution Flow |
| **Version** | v3.0 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | Complete client-side low-code test automation lifecycle: Visual step palette insertion, Playwright AST code generation, deterministic sandboxed iframe DOM execution, visual highlight rings, 2s safety disarm, versioned Base64 submission payload encoding, and backend declarative plan validation |
| **Date** | 2026-10-22 |
| **Source Reference** | `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx`, `MODULE_FE/src/features/lab/components/v3/MiniAppPreview.tsx`, `MODULE_FE/src/features/lab/runtime/v3/playwrightCompiler.ts`, `MODULE_BE/src/modules/labs/automation-v3-validator.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Input**: Learner accesses an Automation V3 lab (`/labs/:labId`). The UI renders a 3-pane layout on desktop (or responsive tabs on mobile $\le 768$px) containing the Lab Guide, Block Palette/Visual Step Plan Editor, and Mini-App Preview.
- **Authoring & Code Generation**:
  - The learner adds, edits, or reorders declarative blocks (`Locator`, `Action`, `Assertion`, `Data`).
  - An AST compiler automatically generates clean, standalone Playwright TypeScript code adhering to web-first best practices (`page.getByRole()`, `expect(locator).toBeVisible()`).
- **Client Execution (0 Server Browser RAM)**:
  - On clicking **"Run Test"**, execution occurs entirely in client RAM.
  - The fixture runs inside a sandboxed `<iframe>` loaded with an isolated internal versioned web mini-app.
  - A Web Worker validates the plan, dispatches action commands over `postMessage`, highlights DOM elements in real time with a visual ring, and steps through assertions.
  - A strict **2000ms Timeout Guard** disarms infinite execution. Outbound network requests (`fetch`, XHR, WebSocket) are strictly prohibited via CSP.
- **Server Validation & Progress Authority**:
  - Upon submission, the client encodes a versioned Base64 envelope containing `exerciseRevision`, `stepPlan`, `answers`, `generatedPlaywrightCode`, `resultSummary`, and `durationMs`.
  - The backend (`MODULE_BE`) **does not launch any browser or Playwright process**. Instead, it executes deterministic declarative plan validation against a private `gradingKey` (checking required steps, forbidden patterns, and step integrity).
  - Valid submissions record an authoritative `passed` audit record in `lab_submissions` and upsert completion metrics in `user_progress`.

---

### 2.2. Roles & Responsibilities

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Learner** | Actor | Selects/edits blocks, views generated Playwright `.spec.ts`, runs trial runs, and submits solutions |
| **Workspace Shell (`AutomationV3Workspace`)** | Client UI | 3-pane layout coordinator (Palette, Step Editor, Code Viewer, Mini-App Preview, and Step Timeline) |
| **Syntax Palette & Step Editor** | Client UI | Allowlist-governed block picker with category grouping (`navigation`, `locator`, `action`, `assertion`, `data`) |
| **AST Compiler (`playwrightCompiler`)** | Client Engine | Compiles declarative steps into idiomatic Playwright TypeScript specs with unique test titles and AAA structure |
| **Iframe Sandbox (`MiniAppPreview`)** | Client Sandbox | Renders isolated local fixture application, dispatches DOM events, highlights active selectors, and reports step outcomes |
| **Timeout Guard (2s)** | Safety Guard | Terminates runner if execution exceeds 2000ms, caps steps at 50, and caps console logs at 100 lines |
| **Submission Codec (`automationV3SubmissionCodec`)** | Client Serialization | Packages step plan, generated code, and diagnostic execution telemetry into a tamper-evident Base64 payload |
| **Backend Validator (`AutomationV3Validator`)** | Server Security | Validates version, revision, step allowlists, and scores against hidden `gradingKey` without browser execution |
| **Database (`Prisma / PostgreSQL`)** | Data Store | Records immutable submission audit log and updates user completion state |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner
    participant UI as AutomationV3Workspace (FE)
    participant Editor as VisualStepPlanEditor
    participant Compiler as Playwright AST Compiler
    participant Sandbox as MiniAppPreview (Iframe Sandbox)
    participant Guard as Timeout Guard (2000ms)
    participant Codec as Submission Codec
    participant API as Labs API (NestJS BE)
    participant Validator as AutomationV3Validator
    participant DB as PostgreSQL (Prisma)

    Note over Learner, DB: Phase 1: Workspace Initialization
    Learner->>UI: Navigate to `/labs/:labId`
    UI->>UI: Check Feature Flag: AUTOMATION_V3_ENABLED
    UI->>Editor: Load starterPlan and allowedBlocks from V3 contract
    UI->>Sandbox: Mount isolated fixture iframe (e.g., `#fixture/ecommerce-checkout`)
    Sandbox-->>UI: Fixture ready (initial DOM state established)
    UI-->>Learner: Render 3-pane workspace (Palette | Editor / Code | Fixture Preview)

    Note over Learner, DB: Phase 2: Low-Code Authoring & AST Compilation
    Learner->>Editor: Add/Reorder blocks (e.g. click Button 'Checkout', assert toBeVisible)
    Editor->>Compiler: compilePlanToPlaywright(steps, metadata)
    Compiler-->>Editor: Updated `generatedPlaywrightCode` (.spec.ts)
    Editor-->>Learner: Live update Code tab and Step Timeline

    Note over Learner, DB: Phase 3: Client Trial Execution (In-RAM Sandbox)
    Learner->>UI: Click "Run Test"
    UI->>Guard: Start countdown (setTimeout 2000ms)
    UI->>Sandbox: postMessage({ type: 'RUN_SCENARIO', steps })

    loop For each step in Plan (Max 50 steps)
        Sandbox->>Sandbox: Locate target DOM element
        Sandbox->>UI: postMessage({ type: 'STEP_ACTIVE', index, selector })
        UI->>Sandbox: Apply DOM highlight ring & sync timeline highlight
        Sandbox->>Sandbox: Execute action / assert condition
        Sandbox-->>UI: postMessage({ type: 'STEP_RESULT', index, status: 'passed' })
    end

    alt Execution Completed Successfully (< 2000ms)
        Sandbox-->>UI: postMessage({ type: 'ALL_STEPS_COMPLETED', summary })
        UI->>Guard: clearTimeout(timeoutId) (Disarm guard)
        UI-->>Learner: Display Success Bar ("All steps passed! Ready to submit.")
    else Step Assertion Failed
        Sandbox-->>UI: postMessage({ type: 'STEP_FAILED', index, expected, actual, hint })
        UI->>Guard: clearTimeout(timeoutId)
        UI-->>Learner: Highlight failed step in red, show actionable diff & hint
    else Execution Exceeded 2000ms
        Guard-->>UI: Timeout Triggered!
        UI->>Sandbox: Reset iframe to initial state
        UI-->>Learner: Display "Time Limit Exceeded (2s)" error banner
    end

    Note over Learner, DB: Phase 4: Authoritative Submission & Verification
    Learner->>UI: Click "Submit Lab"
    UI->>Codec: encodeAutomationV3Submission({ exerciseRevision, steps, generatedCode, ... })
    Codec-->>UI: Base64 versioned submission payload
    UI->>API: POST `/api/v1/labs/:labId/submissions` { submittedCode: base64Payload }

    API->>Validator: validateAndGradeV3Submission(payload, lab.content.gradingKey)
    alt Revision Mismatch or Forged Payload
        Validator-->>API: Throw BadRequestException("Revision mismatch / unauthorized step")
        API-->>UI: 400 Bad Request
        UI-->>Learner: Show validation error notification
    else Declarative Plan Matches All Grading Keys
        Validator-->>API: Return { status: 'passed', score: 100, passedChecks: 5 }
        API->>DB: INSERT into lab_submissions (status: 'passed', submitted_code)
        API->>DB: UPSERT user_progress (status: 'passed', completed_at: NOW())
        API-->>UI: 200 OK { status: 'passed', streak, progress }
        UI-->>Learner: Render Completion Modal with XP & Next Lab navigation
    end
```

---

### 2.4. Safety, Resource Limits & Boundary Constraints

1. **Client RAM & Process Protection**:
   - Max 50 steps per execution plan.
   - Max 100 log lines per trial run.
   - 2000ms hard timeout guard with automatic iframe reset.
   - Zero external network requests: Any invocation of `fetch`, `XMLHttpRequest`, or `WebSocket` inside the runner is trapped and rejected by security guards.

2. **Server Zero-Browser Invariant**:
   - The backend server **never launches headless Chromium, Firefox, or WebKit** during learner submissions.
   - All evaluation on the backend is purely declarative (structural AST inspection, step type validation, parameter matching, and private grading key verification).
   - This prevents denial-of-service (DoS) via resource exhaustion and eliminates expensive cloud browser container costs.

3. **Tamper Resistance & Grading Key Isolation**:
   - `gradingKey` containing hidden verification checks and required steps is stripped by `labContentCodec` before lab metadata is sent to learners.
   - Submissions reporting client-side `status: 'passed'` are untrusted; the server computes the authoritative grade using the private `gradingKey`.

---

## 3. Architectural Cross-References

- **Parent Workspace Sequence**: [03-lab-practice-webworker.md](file:///d:/Projects/study-web/docs/workflows/03-lab-practice-webworker.md)
- **Submission & Progress Tracking**: [04-lab-submission-progress.md](file:///d:/Projects/study-web/docs/workflows/04-lab-submission-progress.md)
- **Content Contract V3**: [lab-content-contract-v3.md](file:///d:/Projects/study-web/docs/specs/lab-content-contract-v3.md)
- **Architecture Decision Record**: [003-client-automation-v3-sandbox-runner.md](file:///d:/Projects/study-web/docs/adr/003-client-automation-v3-sandbox-runner.md)
- **System Documentation Hub**: [docs/README.md](file:///d:/Projects/study-web/docs/README.md)
