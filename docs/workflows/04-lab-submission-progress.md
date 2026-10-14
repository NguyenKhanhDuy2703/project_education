---
doc_type: workflow
title: Sequence Diagram - Lab Submission & Progress Tracking (Submission & Progress Flow)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: User practice lifecycle (Workspace -> Practice -> Submit) and Dual-Table Persistence Subsystem (History Logging & Single-State Upsert)
date: 2026-10-14
source_file: "MODULE_BE/src/modules/labs, MODULE_FE/src/pages/dashboard"
status: final
language: en
related_docs: [../01-proposal.md, ../05-database.md, 03-lab-practice-webworker.md]
---

# Sequence Diagram: Lab Submission & Progress Tracking (Submission & Progress Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | Lab Submission & Progress Tracking Workflow |
| **Version** | v1.1 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | End-to-end user lifecycle: Working in workspace, running in-browser tests, submitting solutions, persisting audit logs in `lab_submissions`, upserting singular progress in `user_progress`, and synchronizing learner dashboard stats |
| **Date** | 2026-10-14 |
| **Source Reference** | Lean dual-table database design in `docs/05-database.md` (`lab_submissions` and `user_progress` tables) and `MODULE_FE/src/pages/dashboard/DashboardPage.tsx` |

---

## 2. Core Content

### 2.1. User Practice Business Flow

The following flowchart outlines the core user journey within the interactive workspace: Open Workspace $\to$ Practice Code $\to$ Submit Solution:

```mermaid
flowchart TD
    Start([1. Open Lab Workspace]) --> ViewWorkspace[Learner observes workspace layout:]
    ViewWorkspace --> ReadPane[Left Column: Read instructions, goals & step-by-step guidance]
    ViewWorkspace --> CodePane[Right Column: Inspect initial starter code in Monaco Editor]

    %% --- Phase 2: Practice & Trial Run ---
    CodePane --> TypingCode[2. Practice: Learner writes code to fulfill lab criteria]
    TypingCode --> ClickRun[Click 'Run Code' button]
    ClickRun --> RunFeedback{Test run output on console}

    %% Debugging loop
    RunFeedback -->|Failing test cases / Syntax error| ViewFailDetails[Review failing assertions & stack trace]
    ViewFailDetails --> FixCode[Learner modifies code in Monaco Editor]
    FixCode --> ClickRun

    %% Success state
    RunFeedback -->|100% Tests Passed| PassState[Console shows green: 100% Passed]
    
    %% --- Phase 3: Submission ---
    PassState --> ClickSubmit[3. Click 'Submit Solution' button]
    ClickSubmit --> SubmitProcessing[Backend records submission & upserts progress]
    SubmitProcessing --> ShowCompletionModal[Modal: 'Lab Successfully Completed! 🎉']
    ShowCompletionModal --> NextAction{Learner selects next action}
    NextAction -->|Click 'Next Lab'| GoNextLab([Advance to next lab in Series roadmap])
    NextAction -->|Click 'Review Solution'| StayReview([Remain in workspace to review solution])
```

#### User Interface Touchpoints:
1. **Workspace Initialization**:
   - Left Pane: Comprehensive Markdown theory, learning objectives, and test acceptance criteria.
   - Right Pane: Monaco Editor pre-loaded with template Starter Code.
2. **Practice & Trial Run Loop**:
   - Learners compose code and trigger **"Run Code"** for immediate client-side test validation inside a Web Worker.
   - If tests fail: Console provides actionable test diffs (Input / Expected / Actual) for immediate debugging.
   - Upon 100% pass rate: UI highlights green and enables the **"Submit Solution"** action button.
3. **Submission & Next Steps**:
   - Clicking **"Submit Solution"**: Persists submission history, upserts completion status, and updates progress counters.
   - Completion celebration modal offers **"Next Lab"** button to ensure seamless learning continuity.

---

### 2.2. PRO Entitlement Privilege: Solution Guide Access Flow

For **User PRO** accounts, the system unlocks access to the official Solution Guide directly within the workspace, while standard users receive an upgrade paywall prompt:

```mermaid
flowchart TD
    Start([Learner inside Lab Workspace]) --> ClickSolutionBtn{Learner clicks 'View Solution Guide' button}

    %% --- Tier Check ---
    ClickSolutionBtn --> CheckTier{Check account entitlement tier}

    %% --- Standard User ---
    CheckTier -->|Standard Learner - Non-PRO| ShowUpgradePrompt[Popup: 'Unlock Expert Solution Guides with PRO']
    ShowUpgradePrompt --> PromptAction{User action on popup}
    PromptAction -->|Click 'View PRO Plans'| GoPricing[Redirect to Pricing / Upgrade page]
    PromptAction -->|Click 'Close / Dismiss'| BackToWorkspace[Dismiss popup -> Continue independent solving]

    %% --- PRO User ---
    CheckTier -->|PRO Learner - Entitled| OpenSolutionPane[Open 'Official Solution & Architecture Guide']
    
    OpenSolutionPane --> SolutionUI[PRO Learner views full solution package:]
    SolutionUI --> Sec1[1. Clean reference implementation adhering to best practices]
    SolutionUI --> Sec2[2. Detailed step-by-step breakdown: Architectural reasoning]
    SolutionUI --> Sec3[3. 'Copy to Editor' button for hands-on experimentation]

    Sec3 --> ProAction{PRO Learner next action}
    ProAction -->|Inspect & run tests| RunTest[Click 'Run Code' to verify]
    RunTest --> Submit[Click 'Submit Solution' to complete]
```

#### UI Touchpoints for Solution Guide:
1. **Solution Guide Button 💡**: Located on the editor toolbar; Standard users see `🔒 Pro`, PRO users see `🔓 Solution`.
2. **Standard User Paywall**: Explains pedagogical benefits of reviewing reference solutions without resetting unfinished code in the editor.
3. **PRO Solution Drawer**: Slide-over panel presenting the clean reference implementation, line-by-line technical commentary, and quick copy actions.

---

### 2.3. Technical Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Learner / Student
    participant FE as Lab Workspace (React)
    participant BE as Backend Lab Service (NestJS)
    participant DB as PostgreSQL Database
    participant Dash as Learner Dashboard

    User->>FE: Click "Submit Solution" button
    FE->>BE: POST /api/labs/:id/submit { submittedCode, status, timeMs }
    BE->>BE: Validate JWT & extract authenticated userId
    
    Note over BE, DB: Step 1: Always append submission history to lab_submissions
    BE->>DB: INSERT INTO lab_submissions (userId, labId, submittedCode, status, timeMs)
    DB-->>BE: Submission record created successfully

    Note over BE, DB: Step 2: Update singular completion state in user_progress
    alt Solution Passed (status: passed)
        BE->>DB: INSERT INTO user_progress (userId, labId, isCompleted, completedAt)<br/>VALUES ($1, $2, true, NOW())<br/>ON CONFLICT (userId, labId) DO UPDATE SET isCompleted = true, updatedAt = NOW()
        DB-->>BE: Progress record upserted
        BE-->>FE: 200 OK { success: true, isCompleted: true }
        FE-->>User: Display congratulations modal and enable "Next Lab"
    else Solution Failed (status: failed)
        BE-->>FE: 200 OK { success: true, isCompleted: false, message: "Draft saved" }
        FE-->>User: Confirm code saved with encouragement to retry
    end

    Note over User, Dash: Step 3: Synchronize statistics on Dashboard
    User->>Dash: Navigate to Personal Dashboard
    Dash->>BE: GET /api/users/me/dashboard-stats
    BE->>DB: SELECT COUNT(*) FROM user_progress WHERE userId = $1 AND isCompleted = true
    DB-->>BE: Return completed lab count
    BE-->>Dash: 200 OK { totalCompleted, streakDays, seriesProgress }
    Dash-->>User: Render progress meters, completion percentages, and earned badges
```

---

### 2.4. Technical Specifications & Architecture Details

1. **Dual-Table Storage Strategy**:
   * **`lab_submissions` (Append-Only Audit Log)**: Every submission generates a discrete record. Stores historical code revisions, execution times, and submission progression.
   * **`user_progress` (Singular Upsert State)**: Exactly one row per `(userId, labId)` pair using PostgreSQL `ON CONFLICT (userId, labId) DO UPDATE`.
   * 👉 **Performance Benefit**: The Dashboard query for completed labs executes a blazing-fast index scan over the compact `user_progress` table, avoiding expensive `COUNT(DISTINCT labId)` operations over multi-million row submission logs.

2. **Security & Validation Integrity**:
   * For Web Worker labs: Test assertions execute client-side, but the backend performs sanity checks on payload syntax, character lengths, and AST signatures before granting `passed` status.
   * Authentication Gate: Submissions are tied to verified JWT credentials. Guest sessions store temporary progress in `localStorage` until account registration.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Guest User Submits Solution** | Backend rejects unauthenticated requests | Prompts quick login/registration modal, preserving written code in memory |
| **Network Timeout During Submission** | Axios timeout with automatic retry | Displays warning badge with "Retry Submission" button; code remains safe in editor |
| **Simultaneous Submissions** | Handled via PostgreSQL atomic upsert transaction | Idempotent response; latest submission recorded without state corruption |

---

## 3. References & Source Links

- **Codebase References**:
  - Learner Dashboard: [DashboardPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/dashboard/DashboardPage.tsx)
  - Prisma Schema: [schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **System Documentation**:
  - Database Design: [05-database.md](file:///d:/Projects/study-web/docs/05-database.md)
  - Web Worker Sandbox Execution: [03-lab-practice-webworker.md](file:///d:/Projects/study-web/docs/workflows/03-lab-practice-webworker.md)
