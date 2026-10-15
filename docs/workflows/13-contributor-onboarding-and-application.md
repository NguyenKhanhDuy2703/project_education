---
doc_type: workflow
title: Sequence Diagram - Contributor Onboarding & Application Review Lifecycle (Contributor Onboarding Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Contributor Onboarding Subsystem, User Application Submission, Admin Review Queue, State Machine Transitions, and Dynamic Permission Activation
date: 2026-10-15
source_file: "MODULE_FE/src/features/contributor, MODULE_ADMIN/src/pages/admin/AdminContributorApplicationsPage.tsx, MODULE_BE/src/modules/contributor-application"
status: final
language: en
related_docs: [01-auth-login-to-home.md, 06-create-lab-studio.md, 07-content-review-and-publish.md, 09-admin-users-and-entitlements.md]
---

# Sequence Diagram: Contributor Onboarding & Application Review Lifecycle (Contributor Onboarding Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | Contributor Onboarding & Application Review Lifecycle Workflow |
| **Version** | v1.0 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | Complete end-to-end lifecycle for learners applying to become content contributors: Application submission via User Dashboard in `MODULE_FE`, persistence in PostgreSQL, triage & evaluation in `MODULE_ADMIN` (`/admin/contributor-applications`), state machine transitions (`PENDING` $\to$ `APPROVED` / `REJECTED`), and automatic activation of Contributor Studio entitlements |
| **Date** | 2026-10-15 |
| **Source Reference** | `MODULE_FE/src/features/contributor/components/ContributorApplyModal.tsx`, `MODULE_ADMIN/src/pages/admin/AdminContributorApplicationsPage.tsx`, `MODULE_BE/src/modules/contributor-application/contributor-application.controller.ts`, `MODULE_BE/src/modules/contributor-application/contributor-application.service.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Problem Solved**: Open and unrestricted content creation leads to low-quality lab authoring and catalog clutter. The Contributor Onboarding process introduces a gated qualification system ensuring only verified, capable educators author practice labs.
- **Phase 1 — Learner Application (`MODULE_FE`)**:
  - Authenticated learner opens User Dashboard (`/user/dashboard`) and clicks **"Trở thành Contributor"** (Become a Contributor).
  - Modal form collects: Brief Bio/Introduction, Portfolio / GitHub / LinkedIn URL, and Motivation statement.
  - Submits `POST /api/v1/contributor-applications`. Application state initialized to `PENDING`.
- **Phase 2 — Administrative Review (`MODULE_ADMIN`)**:
  - Administrator accesses `/admin/contributor-applications` on the dedicated administrative portal.
  - Views a paginated queue of applicants with filter pills (`ALL`, `PENDING`, `APPROVED`, `REJECTED`).
  - Evaluates profile qualifications, external portfolio links, and motivation.
  - Executes review decision via `PATCH /api/v1/contributor-applications/:id/review` with optional reviewer commentary.
- **Phase 3 — Permission Activation & Transition**:
  - **APPROVED**: Database updates user record (`isContributor = true`, `contributorStatus = 'APPROVED'`). Next session or token refresh unlocks the **Contributor Hub & Lab Studio** in the learner's dashboard.
  - **REJECTED**: Application recorded as `REJECTED` with feedback reasons visible to the applicant for future re-application.

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Learner (Applicant)** | Actor | Fills out application credentials, links portfolio, and submits for contributor consideration |
| **Platform Administrator** | Actor | Evaluates submissions in `MODULE_ADMIN`, validates portfolios, and issues Approval or Rejection |
| **Apply Modal (`ContributorApplyModal`)** | Client UI (`MODULE_FE`) | Validates URL formatting, checks character length constraints, and renders submission status |
| **Admin Application Queue** | Client UI (`MODULE_ADMIN`) | `AdminContributorApplicationsPage`: Renders applicants table, status badges, and decision dialogs |
| **ContributorApplicationService** | NestJS Backend | Enforces single active application constraint, persists records, and transitions user role flags |
| **ContributorGuard** | Backend Guard | Protects lab and series creation endpoints (`POST /api/v1/labs`, `POST /api/v1/series`) against non-contributors |
| **PostgreSQL Database** | Storage | Houses `contributor_applications` table with relation to `users` |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner (Applicant)
    participant FE as Learner Portal (MODULE_FE)
    participant BE as NestJS Backend (ContributorModule)
    actor Admin as System Administrator
    participant AdminUI as Admin Portal (MODULE_ADMIN)
    participant DB as PostgreSQL (contributor_applications)

    Note over Learner, DB: Phase 1: Application Submission
    Learner->>FE: Enters User Dashboard (/user/dashboard)
    FE->>BE: GET /api/v1/contributor-applications/me
    BE->>DB: Query existing application for user
    DB-->>BE: Null (No prior active application)
    BE-->>FE: 200 OK { application: null }
    FE-->>Learner: Display "Đăng ký Contributor" action banner

    Learner->>FE: Clicks button & fills ContributorApplyModal (Bio, Portfolio URL, Motivation)
    FE->>FE: Validate URL format (http/https) and field lengths (>= 20 chars)
    FE->>BE: POST /api/v1/contributor-applications { bio, portfolioUrl, motivation }
    BE->>DB: INSERT INTO contributor_applications (userId, bio, portfolioUrl, motivation, status='PENDING')
    DB-->>BE: Record created
    BE-->>FE: 201 Created { id, status: "PENDING", createdAt }
    FE-->>Learner: Show success alert: "Đơn đăng ký của bạn đang được duyệt"

    Note over Admin, DB: Phase 2: Administrator Triage & Review
    Admin->>AdminUI: Navigates to /admin/contributor-applications
    AdminUI->>BE: GET /api/v1/contributor-applications?status=PENDING
    BE->>DB: SELECT * FROM contributor_applications WHERE status='PENDING' JOIN users
    DB-->>BE: List of pending applications
    BE-->>AdminUI: 200 OK { items: [...] }
    AdminUI-->>Admin: Render table with applicant info, portfolio links, and action buttons

    Admin->>AdminUI: Clicks "Duyệt đơn" (Approve) or "Từ chối" (Reject)
    AdminUI->>AdminUI: Open review modal, enters optional reviewer notes
    AdminUI->>BE: PATCH /api/v1/contributor-applications/:id/review { status: "APPROVED", reviewNote: "Strong React & SQL background" }
    
    alt Decision is APPROVED
        BE->>DB: UPDATE contributor_applications SET status='APPROVED', reviewNote=$note, reviewedAt=NOW() WHERE id=$id
        BE->>DB: UPDATE users SET isContributor=true, contributorStatus='APPROVED' WHERE id=application.userId
        DB-->>BE: Updated successfully
        BE-->>AdminUI: 200 OK { message: "Application approved successfully" }
        AdminUI-->>Admin: Show success toast, update row status badge to Green (APPROVED)
    else Decision is REJECTED
        BE->>DB: UPDATE contributor_applications SET status='REJECTED', reviewNote=$note, reviewedAt=NOW() WHERE id=$id
        BE->>DB: UPDATE users SET isContributor=false, contributorStatus='REJECTED' WHERE id=application.userId
        DB-->>BE: Updated successfully
        BE-->>AdminUI: 200 OK { message: "Application rejected" }
        AdminUI-->>Admin: Show toast, update row badge to Red (REJECTED)
    end

    Note over Learner, DB: Phase 3: Contributor Studio Access Activation
    Learner->>FE: Refreshes User Dashboard (/user/dashboard)
    FE->>BE: GET /api/v1/auth/me
    BE-->>FE: 200 OK { user: { ..., isContributor: true, contributorStatus: 'APPROVED' } }
    FE->>FE: Redux updates user state with isContributor = true
    FE-->>Learner: Unlocks "Contributor Studio" tab in Sidebar and Lab Authoring tools
```

---

### 2.4. Technical Specifications & Architecture Details

1. **Database Schema (`contributor_applications`)**:
   ```prisma
   enum ContributorApplicationStatus {
     PENDING
     APPROVED
     REJECTED
   }

   model ContributorApplication {
     id           String                       @id @default(uuid())
     userId       String
     user         User                         @relation(fields: [userId], references: [id], onDelete: Cascade)
     bio          String                       @db.Text
     portfolioUrl String?
     motivation   String                       @db.Text
     status       ContributorApplicationStatus @default(PENDING)
     reviewNote   String?                      @db.Text
     reviewedAt   DateTime?
     reviewedById String?
     createdAt    DateTime                     @default(now())
     updatedAt    DateTime                     @updatedAt

     @@index([userId])
     @@index([status])
     @@map("contributor_applications")
   }
   ```
2. **Access Control Guard (`ContributorGuard`)**:
   - Implemented at `MODULE_BE/src/common/guards/contributor.guard.ts`.
   - Protects authoring endpoints by checking `req.user.isContributor === true || req.user.role === 'admin'`.
   - Rejects unauthorized authoring attempts with `403 Forbidden: "Chỉ tài khoản Contributor đã được phê duyệt mới có quyền tạo nội dung"`.
3. **Frontend Permission Gate**:
   - `MODULE_FE/src/features/auth/permissions.ts` defines capability `canAccessContributorStudio = (user) => Boolean(user?.isContributor || user?.role === 'admin')`.
   - Sidebar renders the Contributor Hub navlink with badge indicators (`Pending`, `Approved`, `Apply Now`).

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Multiple Simultaneous Submissions** | Backend queries existing applications with status `PENDING` | Form rejects secondary submission: *"Bạn đã có một đơn ứng tuyển đang chờ phê duyệt"* |
| **Invalid Portfolio URL Format** | Client & DTO validate `@IsUrl()` | Highlights field in red: *"Vui lòng nhập đường dẫn URL hợp lệ (ví dụ: https://github.com/...)"* |
| **Re-application After Rejection** | User allowed to submit a new application | Form re-opens with reminder to review previous admin feedback notes |
| **Contributor Rights Revocation** | Admin demotes user via `/admin/users` tab | Immediate revocation of `isContributor = false`; ongoing drafts locked |

---

## 3. References & Source Links

- **Frontend Codebase**:
  - Contributor Apply Modal: [ContributorApplyModal.tsx](file:///d:/Projects/study-web/MODULE_FE/src/features/contributor/components/ContributorApplyModal.tsx)
  - Contributor Application API: [contributor-application.api.ts](file:///d:/Projects/study-web/MODULE_FE/src/features/contributor/api/contributor-application.api.ts)
  - Admin Review Queue Page: [AdminContributorApplicationsPage.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/pages/admin/AdminContributorApplicationsPage.tsx)
  - User Dashboard Overview: [DashboardOverviewView.tsx](file:///d:/Projects/study-web/MODULE_FE/src/pages/dashboard/views/DashboardOverviewView.tsx)
- **Backend Codebase**:
  - Contributor Application Controller: [contributor-application.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/contributor-application/contributor-application.controller.ts)
  - Contributor Application Service: [contributor-application.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/contributor-application/contributor-application.service.ts)
  - Contributor Guard: [contributor.guard.ts](file:///d:/Projects/study-web/MODULE_BE/src/common/guards/contributor.guard.ts)
  - Prisma Schema: [schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **Related Workflows**:
  - Authentication & Session: [01-auth-login-to-home.md](file:///d:/Projects/study-web/docs/workflows/01-auth-login-to-home.md)
  - Two-Step Lab Studio: [06-create-lab-studio.md](file:///d:/Projects/study-web/docs/workflows/06-create-lab-studio.md)
  - Content Review Queue: [07-content-review-and-publish.md](file:///d:/Projects/study-web/docs/workflows/07-content-review-and-publish.md)
  - Admin User Governance: [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md)
