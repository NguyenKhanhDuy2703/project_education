---
doc_type: workflow
title: Sequence Diagram - Content Review Queue & Publishing Lifecycle (Content Review & Publish Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Content Management Subsystem, Admin Review Queue, Content State Machine, and Public Catalog Publishing
date: 2026-10-14
source_file: "MODULE_FE/src/pages/admin/AdminReviewPage.tsx, MODULE_BE/src/modules/review, MODULE_FE/src/pages/contributor/ContributorContentPage.tsx"
status: final
language: en
related_docs: [05-create-series.md, 06-create-lab-studio.md, 02-catalog-topic-discovery.md]
---

# Sequence Diagram: Content Review Queue & Publishing Lifecycle (Content Review & Publish Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | Content Review Queue & Publishing Lifecycle Workflow |
| **Version** | v1.0 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | End-to-end lifecycle for Labs and Series from Contributor draft creation (`draft`), submission (`submitted`), Admin quality assessment in the Review Queue, actionable feedback requests (`changes_requested`), approval (`approved`), to public publication (`published`) on the learner Catalog |
| **Date** | 2026-10-14 |
| **Source Reference** | `MODULE_FE/src/pages/admin/AdminReviewPage.tsx`, `MODULE_BE/src/modules/review/review.service.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Content Lifecycle State Machine**:
  - `draft`: Author's private working copy; hidden from the catalog; visible only to the creator.
  - `submitted`: Author submits for formal platform review; edit capabilities locked; enqueued in the **Admin Review Queue**.
  - `changes_requested`: Admin rejects current iteration with specific constructive commentary; unlocks editor for author revisions.
  - `approved`: Content meets pedagogical and technical quality benchmarks.
  - `published`: Content made available publicly on the Catalog for all platform learners.
- **Participating Actors**:
  - Contributor (Author): Drafts labs, triggers review submission, addresses revision requests.
  - Admin (Curator / Reviewer): Inspects Markdown theory, validates test case specifications, runs pre-flight solution checks, attaches review notes, and decides between Request Changes, Approve, or Publish.

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Contributor** | Actor | Submits content (`submit`), receives review commentary, updates and re-submits |
| **Admin** | Actor | Inspects `/admin/review` queue, evaluates code quality, executes publishing |
| **Review Queue UI** | Client UI | Renders paginated submission table, status filters, and detailed inspection modal |
| **ReviewService & Controller** | NestJS Backend | Enforces state machine transitions, validates admin authorization, records audit events |
| **Audit Log System** | Audit Ledger | Logs who reviewed, timestamp, action type (`CONTENT_APPROVE`, `CONTENT_PUBLISH`), and notes |
| **PostgreSQL Database** | Storage | Houses `labs`, `series`, and audit records |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Contributor as Contributor (Author)
    participant CUI as Contributor Content Page
    actor Admin as Administrator
    participant AUI as Admin Review Queue (/admin/review)
    participant BE as NestJS Backend (ReviewModule)
    participant DB as PostgreSQL
    participant Catalog as Public Catalog Hub

    Note over Contributor, Catalog: 1. Contributor Submits Content for Review
    Contributor->>CUI: Click "Submit for Review" on authored Lab
    CUI->>BE: POST /api/contributor/labs/:id/submit
    BE->>DB: UPDATE labs SET status = 'submitted', submitted_at = NOW() WHERE id = :id
    DB-->>BE: Updated successfully
    BE-->>CUI: 200 OK (Content enqueued for review)
    CUI-->>Contributor: Status badge updates to amber "In Review"

    Note over Admin, Catalog: 2. Admin Reviews Submissions in Queue
    Admin->>AUI: Open `/admin/review`
    AUI->>BE: GET /api/admin/review-queue?page=1&limit=10&status=submitted
    BE->>DB: SELECT * FROM labs WHERE status = 'submitted' ORDER BY submitted_at ASC
    DB-->>BE: First page of pending submissions (10 items)
    BE-->>AUI: 200 OK (Render table with pagination controls)
    Admin->>AUI: Click on "SQL Window Functions" to inspect
    AUI-->>Admin: Render Theory, Instructions, Starter/Solution Code, and Test Cases

    alt Scenario A: Admin Requests Revisions (Changes Requested)
        Admin->>AUI: Enter notes: "Missing boundary test case for empty PARTITION BY"
        Admin->>AUI: Click "Request Changes" button
        AUI->>BE: POST /api/admin/review-queue/:id/request-changes { note: "..." }
        BE->>DB: UPDATE labs SET status = 'changes_requested', review_note = :note
        BE-->>AUI: 200 OK
        AUI-->>Admin: Remove item from pending review queue
        Note over Contributor: Contributor notified; editor unlocked to apply requested fixes
    else Scenario B: Admin Approves & Publishes
        Admin->>AUI: Click "Run Solution Test Runner" (Final pre-flight check)
        AUI-->>Admin: 100% Tests Passed verified
        Admin->>AUI: Click "Approve & Publish" button
        AUI->>BE: POST /api/admin/review-queue/:id/publish
        BE->>DB: UPDATE labs SET status = 'published', published_at = NOW() WHERE id = :id
        DB-->>BE: Published status persisted
        BE-->>AUI: 200 OK
        AUI-->>Admin: Toast: "Content published successfully to live catalog!"
        
        Note over Catalog: 3. Instant Platform-Wide Availability
        BE->>Catalog: Trigger catalog cache invalidation
        Catalog-->>Contributor: Lab renders with green "Published" badge in Catalog
    end
```

---

### 2.4. Technical Specifications & Architecture Details

1. **State Machine Enforcement**:
   - Valid lifecycle transitions:
     - `draft` $\to$ `submitted`
     - `submitted` $\to$ `changes_requested` OR `approved` / `published`
     - `changes_requested` $\to$ `submitted` (upon author re-submission)
     - `published` $\to$ `archived` (administrative deprecation)
   - Illegal state bypass attempts (e.g. attempting `draft` $\to$ `published` from a non-admin account) are blocked with `400 Bad Request`.
2. **Comprehensive Audit Trail**:
   - Every review decision (approval, change request, publish) is recorded in `audit_logs` tracking `actor_id`, `actor_role`, `action`, `resource_id`, and client IP.
3. **Queue Pagination (10 Items / Page)**:
   - `/admin/review` incorporates a standardized 10-item pagination model, guaranteeing swift rendering even as submissions scale.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Contributor Edits While `submitted`** | Backend rejects write mutations | Editor renders in Read-Only mode with option to *"Withdraw Submission"* |
| **Concurrent Admin Reviews** | Optimistic Concurrency Control on status field | Second admin receives alert *"This submission has already been reviewed by another admin"* |
| **Lab Deleted While in Queue** | Backend checks resource existence | Drops from queue with notification *"Resource no longer available"* |

---

## 3. References & Source Links

- **Frontend Codebase**:
  - Admin Review Page: [AdminReviewPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/AdminReviewPage.tsx)
  - Admin Review Queue Component: [AdminReviewQueue.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/admin/_components/AdminReviewQueue.tsx)
  - Contributor Content: [ContributorContentPage.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/contributor/ContributorContentPage.tsx)
- **Backend Codebase**:
  - Review Controller: [review.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/review/review.controller.ts)
  - Review Service: [review.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/review/review.service.ts)
- **Related Workflows**:
  - Two-Step Lab Studio: [06-create-lab-studio.md](file:///d:/Projects/study-web/docs/workflows/06-create-lab-studio.md)
  - Catalog Discovery: [02-catalog-topic-discovery.md](file:///d:/Projects/study-web/docs/workflows/02-catalog-topic-discovery.md)
  - Admin Topic Governance: [08-admin-topic-governance.md](file:///d:/Projects/study-web/docs/workflows/08-admin-topic-governance.md)
