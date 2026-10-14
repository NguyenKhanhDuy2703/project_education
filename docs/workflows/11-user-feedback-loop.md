---
doc_type: workflow
title: Sequence Diagram - User Feedback Collection & Admin Resolution Loop (User Feedback Loop Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Feedback Subsystem, Learner In-App Feedback Widget, Admin Feedback Hub (/admin/feedback), KPI Analytics, and Triage Workflow
date: 2026-10-14
source_file: "MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx, MODULE_BE/src/modules/feedback"
status: final
language: en
related_docs: [01-auth-login-to-home.md, 09-admin-users-and-entitlements.md]
---

# Sequence Diagram: User Feedback Collection & Admin Resolution Loop (User Feedback Loop Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | User Feedback Collection & Admin Resolution Loop Workflow |
| **Version** | v1.0 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | End-to-end user feedback cycle: From in-app user submission of bug reports or suggestions, database persistence, to Administrator inspection, categorization (`bug`, `feature_request`, `content_lab`, `other`), contextual page URL navigation, and triage tracking at `/admin/feedback` |
| **Date** | 2026-10-14 |
| **Source Reference** | `MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx`, `MODULE_BE/src/modules/feedback/feedback.controller.ts`, `MODULE_BE/src/modules/feedback/feedback.service.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Feedback Collection (Learner Touchpoint)**:
  - Learner clicks the "Feedback" widget button in the footer or workspace toolbar.
  - Chooses category: `bug` (software issue), `feature_request` (new feature idea), `content_lab` (exercise discrepancy), `other` (general inquiry).
  - Enters detailed text; the client automatically attaches the active route pathname (`page_url`) and user ID.
  - Submits `POST /api/feedback` to persist in PostgreSQL.
- **Administration & Resolution (Admin Hub `/admin/feedback`)**:
  - High-level KPI summary cards: Total Feedbacks, Bugs, Feature Requests, and Content Lab issues.
  - Category filter tabs, keyword search bar, and standardized 10 items/page pagination.
  - Clicking any row opens the **Detail Inspection Modal**: Displays full feedback text, clickable issue origin URL, and triage state actions (`open`, `in_progress`, `resolved`).

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Learner / Guest** | Actor | Submits feedback forms, reports bugs or suggests improvements |
| **Feedback Widget / Modal** | Client UI | Modal collecting category, message, automatically capturing `window.location.pathname` |
| **Administrator** | Actor | Monitors `/admin/feedback`, inspects context, updates status |
| **AdminFeedbackPage** | Client UI | KPI metric cards, category filtering, search, pagination, and inspection modal |
| **Feedback Controller & Service** | NestJS Backend | Validates input, saves records, provides `@Roles('admin')` protected query endpoints |
| **PostgreSQL Database** | Storage | Houses `feedbacks` table (`id`, `userId`, `category`, `message`, `pageUrl`, `status`, `createdAt`) |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Learner / Student
    participant FWidget as Feedback Form (Client)
    actor Admin as Administrator
    participant AUI as Admin Feedback Hub (/admin/feedback)
    participant Modal as Detail Inspection Modal
    participant BE as NestJS (FeedbackModule)
    participant DB as PostgreSQL

    Note over User, DB: Phase 1: Learner Submits Feedback
    User->>FWidget: Click "Feedback" button in practice workspace
    FWidget-->>User: Open feedback dialog (Category, Message)
    User->>FWidget: Select Category = "content_lab", Enter: "Test case #2 in SQL lab has syntax error"
    FWidget->>BE: POST /api/feedback { category: "content_lab", message: "...", pageUrl: "/practice/lab-sql-02" }
    BE->>DB: INSERT INTO feedbacks (user_id, category, message, page_url, status) VALUES (...)
    DB-->>BE: Persisted successfully
    BE-->>FWidget: 201 Created { id: "fb-102" }
    FWidget-->>User: Toast: "Thank you for your feedback! Our team will review it shortly."

    Note over Admin, DB: Phase 2: Admin Evaluates & Triages Submissions
    Admin->>AUI: Navigate to `/admin/feedback`
    AUI->>BE: GET /api/feedback/admin
    BE->>DB: SELECT * FROM feedbacks ORDER BY created_at DESC
    DB-->>BE: All feedback records
    BE-->>AUI: 200 OK [ { id, category, message, user: { name, email }, pageUrl, status }, ... ]
    AUI->>AUI: Compute KPI metrics: Total: 28, Bug: 12, Feature: 8, Lab: 6, Other: 2
    AUI-->>Admin: Render KPI cards & 10 items/page paginated table

    Note over Admin, DB: Phase 3: Detail Inspection & State Transition
    Admin->>AUI: Select "Content Lab" tab to isolate exercise discrepancies
    AUI->>AUI: Filter list to matching 6 items
    Admin->>AUI: Click on row submitted by "John Doe"
    AUI->>Modal: Open Detail Inspection Modal
    Modal-->>Admin: Render full message + Clickable URL: `/practice/lab-sql-02`
    Admin->>Modal: Update status to "In Progress" and open link to verify
    Modal->>BE: PATCH /api/feedback/admin/:id { status: "in_progress" }
    BE->>DB: UPDATE feedbacks SET status = 'in_progress' WHERE id = :id
    DB-->>BE: Updated successfully
    BE-->>Modal: 200 OK
    Modal-->>Admin: Status badge updates to amber "In Progress"
```

---

### 2.4. Technical Specifications & Architecture Details

1. **High-Level KPI Metric Cards**:
   - The `/admin/feedback` interface surfaces four summary metrics:
     - Card 1: Total Received Submissions
     - Card 2: Software Bug Reports
     - Card 3: Feature Requests
     - Card 4: Lab & Content Suggestions
2. **Contextual Origin Tracking**:
   - The `page_url` attribute is automatically captured upon dialog open.
   - In the Admin modal, this URL renders as an active deep-link, enabling administrators to jump directly to the reported exercise without manual navigation.
3. **Client-Side Responsive Pagination**:
   - Integrated with `DataTablePagination`, ensuring sub-second response times across large feedback volumes.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Unauthenticated Guest Feedback** | Backend accepts `user_id = NULL` with valid contact email | Guests can report bugs without forced registration |
| **Short or Spammy Content** | Form enforces minimum 10-character threshold | Submit button remains disabled with guidance: *"Please provide at least 10 characters"* |
| **Unauthorized Access to Feedback API** | Guard `@Roles(UserRole.ADMIN)` blocks non-admin callers | Responds with 403 Forbidden |

---

## 3. References & Source Links

- **Frontend Codebase**:
  - Admin Feedback Page: [AdminFeedbackPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/AdminFeedbackPage.tsx)
  - Feedback Admin API: [feedback.admin.api.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/admin/api/feedback.admin.api.ts)
  - Pagination Component: [data-table-pagination.tsx](file:///d:/Projects/study-web/MODULE_FE/src/components/ui/data-table-pagination.tsx)
- **Backend Codebase**:
  - Feedback Controller: [feedback.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/feedback/feedback.controller.ts)
  - Feedback Service: [feedback.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/feedback/feedback.service.ts)
- **Related Workflows**:
  - Admin Users Governance: [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md)
  - User Group Management: [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md)
