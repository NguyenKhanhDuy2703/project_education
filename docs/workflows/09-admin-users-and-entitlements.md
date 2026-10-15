---
doc_type: workflow
title: Sequence Diagram - Admin User Governance & Entitlement Overrides (Admin Users & Entitlements Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Admin Subsystem, User Management, Role Allocation, Session Revocation, and Feature Entitlement Overrides
date: 2026-10-14
source_file: "MODULE_ADMIN/src/pages/admin/AdminUsersPage.tsx, MODULE_ADMIN/src/pages/admin/_components/AdminUsersTab.tsx, MODULE_BE/src/modules/users"
status: final
language: en
related_docs: [01-auth-login-to-home.md, 10-admin-user-groups-split-view.md, 07-content-review-and-publish.md, 13-contributor-onboarding-and-application.md]
---

# Sequence Diagram: Admin User Governance & Entitlement Overrides (Admin Users & Entitlements Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | Admin User Governance & Entitlement Overrides Workflow |
| **Version** | v1.1 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | Comprehensive user administration workflow in `MODULE_ADMIN` (`/admin/users`): Multi-attribute user lookup, 10 items/page pagination, role promotions (`user`, `user_pro`, `contributor`, `admin`), account suspension with immediate session revocation, and fine-grained Direct Feature Overrides with expiration limits |
| **Date** | 2026-10-15 |
| **Source Reference** | `MODULE_ADMIN/src/pages/admin/AdminUsersPage.tsx`, `MODULE_ADMIN/src/pages/admin/_components/AdminUsersTab.tsx`, `MODULE_BE/src/modules/users/users.controller.ts`, `MODULE_BE/src/modules/users/users.service.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Input**: Administrator opens `/admin` and navigates to the Users tab.
- **Display & Querying**:
  - Fetches the user directory with query filters (Name, Phone, Email), Role filters (`user`, `user_pro`, `contributor`, `admin`), and Status filters (`active`, `suspended`).
  - Standardized 10 users/page pagination (`DataTablePagination`).
- **Core Operations**:
  1. **Change Role**: Promotes a learner to `contributor` (enabling authoring tools) or designates an `admin`.
  2. **Suspend Account**: Revokes access for policy violations; terminates active refresh tokens for immediate session eviction.
  3. **Direct Feature Overrides**: Grants specific advanced features (e.g. `FEATURE_AI_MENTOR`, `FEATURE_EXPORT_PDF`) to targeted individuals with optional expiration limits, bypassing blanket subscription requirements.

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Administrator** | Actor | Performs user lookups, manages roles, issues overrides, or suspends accounts |
| **Admin Users View** | Client UI | Renders user list, pagination controls, role change dropdowns, and override dialogs |
| **Users Controller & Service** | NestJS Backend | Enforces admin authorization, handles database mutations |
| **Audit Log System** | Audit Ledger | Records administrative events: `USER_ROLE_CHANGE`, `USER_SUSPEND`, `USER_OVERRIDE` |
| **PostgreSQL Database** | Storage | Houses `users`, `user_entitlements`, and `audit_logs` |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant UI as Admin Users View (/admin)
    participant Modal as UserDetails & Override Dialog
    participant BE as NestJS Backend (UsersModule)
    participant Audit as AuditLog Service
    participant DB as PostgreSQL

    Note over Admin, DB: 1. Loading User Directory (10 Items / Page)
    Admin->>UI: Access Users tab (or switch to Page 2)
    UI->>BE: GET /api/users?page=2&limit=10&role=all&search=
    BE->>DB: SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 10
    DB-->>BE: 10 user records + total metadata
    BE-->>UI: 200 OK { data: [...], meta: { page: 2, totalPages: 15, totalItems: 148 } }
    UI-->>Admin: Render responsive table with pagination controls

    Note over Admin, DB: 2. Role Promotion to Contributor
    Admin->>UI: Click action menu on user "John Doe", select "Change Role"
    UI->>UI: Open Select Dialog with new role = "contributor"
    Admin->>UI: Click "Save Changes"
    UI->>BE: PATCH /api/users/:id/role { role: "contributor" }
    BE->>DB: UPDATE users SET role = 'contributor' WHERE id = :id
    BE->>Audit: Ghi log: Admin A changed role of User B to 'contributor'
    DB-->>BE: Updated successfully
    BE-->>UI: 200 OK { id, role: "contributor" }
    UI-->>Admin: Badge updates to purple "Contributor" with success toast

    Note over Admin, DB: 3. Granting Direct Feature Overrides
    Admin->>UI: Click "Entitlements" button on user row
    UI->>Modal: Open Feature Overrides configuration modal
    Admin->>Modal: Check "FEATURE_SQL_LABS", Expiry: 2026-12-31
    Admin->>Modal: Click "Confirm Override"
    Modal->>BE: POST /api/users/:id/entitlements/override { featureKey: "FEATURE_SQL_LABS", expiresAt: "2026-12-31" }
    BE->>DB: INSERT INTO user_entitlements (user_id, feature_key, expires_at) VALUES (...) ON CONFLICT DO UPDATE
    BE->>Audit: Log: Admin A granted override FEATURE_SQL_LABS to User B
    DB-->>BE: Record upserted
    BE-->>Modal: 200 OK
    Modal-->>Admin: Toast: "Entitlement override granted successfully!"

    Note over Admin, DB: 4. Account Suspension & Session Invalidation
    Admin->>UI: Click "Suspend User" on violating account
    UI->>BE: POST /api/users/:id/suspend { reason: "Policy violation" }
    BE->>DB: UPDATE users SET status = 'suspended', refresh_token_hash = NULL WHERE id = :id
    BE->>Audit: Log: Admin A suspended User B
    DB-->>BE: Session revoked successfully
    BE-->>UI: 200 OK
    UI-->>Admin: Badge updates to red "Suspended"
```

---

### 2.4. Technical Specifications & Architecture Details

1. **Dual-Tier Authorization Model (Role-Based vs Direct-Entitlement)**:
   - **Tier 1 (Base Roles)**: Governs access to primary portal applications (`/admin/*`, `/contributor/*`).
   - **Tier 2 (Feature Overrides)**: The `user_entitlements` table enables enabling/disabling individual modular capabilities (e.g. granting access to an advanced SQL lab series for a 30-day trial).
2. **Instant Session Invalidation**:
   - Suspending a user immediately clears `refresh_token_hash = NULL` in PostgreSQL.
   - Upon the 15-minute expiration of the active Access Token, the client cannot refresh and is immediately logged out.
3. **High-Performance Pagination**:
   - Implements `DataTablePagination` with discrete page indicators (`[1] [2] ... [10]`), allowing direct random-access navigation without over-fetching large datasets.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Admin Self-Suspension Attempt** | Backend rejects with `400 Bad Request: Cannot suspend self` | UI renders error: *"You cannot suspend your own administrative account"* |
| **Demoting Last Remaining Admin** | Backend enforces minimum count (count ≥ 1) | Mutation rejected: *"System requires at least one active Administrator"* |
| **Override with Past Expiration Date** | Form validates expiration date `> now()` | Highlights date picker in red with validation message |

---

## 3. References & Source Links

- **Frontend Codebase (MODULE_ADMIN)**:
  - Users Page: [AdminUsersPage.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/pages/admin/AdminUsersPage.tsx)
  - Users Table Component: [AdminUsersTab.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/pages/admin/_components/AdminUsersTab.tsx)
  - Entitlements Modal: [UserEntitlementsModal.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/pages/admin/_components/UserEntitlementsModal.tsx)
  - Pagination Component: [data-table-pagination.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/components/ui/data-table-pagination.tsx)
- **Backend Codebase (MODULE_BE)**:
  - Users Controller: [users.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/users/users.controller.ts)
  - Users Service: [users.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/users/users.service.ts)
  - Database Schema: [schema.prisma](file:///d:/Projects/study-web/MODULE_BE/prisma/schema.prisma)
- **Related Workflows**:
  - Authentication & Session: [01-auth-login-to-home.md](file:///d:/Projects/study-web/docs/workflows/01-auth-login-to-home.md)
  - Split-View Group Management: [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md)
  - Contributor Onboarding: [13-contributor-onboarding-and-application.md](file:///d:/Projects/study-web/docs/workflows/13-contributor-onboarding-and-application.md)
