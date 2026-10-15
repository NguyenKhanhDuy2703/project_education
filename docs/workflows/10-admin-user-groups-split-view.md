---
doc_type: workflow
title: Sequence Diagram - User Group Management Split View (Admin User Groups Split-View Flow)
project: study-web
version: "1.0"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: Admin Subsystem, User Groups Administration, Dual-Pane Split-View Layout, and Member Roster Management
date: 2026-10-14
source_file: "MODULE_ADMIN/src/pages/admin/AdminGroupsPage.tsx, MODULE_ADMIN/src/pages/admin/_components/AdminGroupsTab.tsx, MODULE_BE/src/modules/groups"
status: final
language: en
related_docs: [09-admin-users-and-entitlements.md, 12-upgrade-and-payment.md]
---

# Sequence Diagram: User Group Management Split View (Admin User Groups Split-View Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | User Group Management Split View Workflow |
| **Version** | v1.1 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | User Group administration workflow in `MODULE_ADMIN` at `/admin/groups`: Interactive Split-View layout featuring a left-hand Groups Directory (~35%) and a right-hand Member Roster (~65%), dynamic member addition/removal, and group-level subscription plan associations |
| **Date** | 2026-10-15 |
| **Source Reference** | `MODULE_ADMIN/src/pages/admin/AdminGroupsPage.tsx`, `MODULE_ADMIN/src/pages/admin/_components/AdminGroupsTab.tsx`, `MODULE_BE/src/modules/groups/groups.controller.ts`, `MODULE_BE/src/modules/groups/groups.service.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Split-View Dual-Pane Architecture**:
  - **Left Pane (~35%) — Groups Directory**:
    - Quick search by Group Name or Code.
    - "+ New Group" action to create university cohorts, classrooms, or B2B enterprise departments.
    - Group cards render: Title, Code, Member Count, assigned Plan Badge, and Edit/Delete controls.
    - Clicking a group card establishes it as the active selection.
  - **Right Pane (~65%) — Group Members**:
    - Displays detailed metadata for the selected group.
    - "+ Add Member" opens a candidate search modal to enroll learners into the active group.
    - Member table with Avatar, Name, Email, Role, Joined Date, and "Remove" action.
    - Integrated with `DataTablePagination` (10 members/page).
- **Architectural Benefit**: Enables administrators to oversee dozens of cohorts and hundreds of members without jarring page transitions.

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Administrator** | Actor | Selects groups, creates cohorts, manages member enrollment |
| **AdminGroupsPage** | Client UI | Coordinates Split-View state: `selectedGroupId`, loads groups and active member list |
| **AddMemberModal** | Client UI | Modal dialog for searching and multi-selecting unenrolled candidates |
| **Groups Controller & Service** | NestJS Backend | Handles Group CRUD, manages `user_group_members` associative relations, logs audit trails |
| **PostgreSQL Database** | Storage | Houses `user_groups`, `user_group_members`, and `users` |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant UI as AdminGroupsPage (/admin/groups)
    participant Left as Left Panel: Groups List (35%)
    participant Right as Right Panel: Members Table (65%)
    participant Modal as AddMemberModal
    participant BE as NestJS (GroupsModule)
    participant DB as PostgreSQL

    Note over Admin, DB: 1. Loading Groups & Activating First Entry
    Admin->>UI: Navigate to `/admin/groups`
    UI->>BE: GET /api/user-groups
    BE->>DB: SELECT g.*, COUNT(m.user_id) as member_count FROM user_groups g LEFT JOIN user_group_members m ... GROUP BY g.id
    DB-->>BE: Groups list with aggregate member counts
    BE-->>UI: 200 OK [ { id: "grp-1", name: "CS Cohort 2026", code: "CS_2026", memberCount: 45 }, ... ]
    UI->>Left: Render group cards and auto-select first group "grp-1"
    
    UI->>BE: GET /api/user-groups/grp-1/members?page=1&limit=10
    BE->>DB: SELECT u.* FROM users u JOIN user_group_members ug ON u.id = ug.user_id WHERE ug.group_id = 'grp-1' LIMIT 10
    DB-->>BE: First page of 10 members
    BE-->>UI: 200 OK { members: [...], totalCount: 45 }
    UI->>Right: Render member roster table

    Note over Admin, DB: 2. Selecting a Different Group
    Admin->>Left: Click on group card "Backend Bootcamp" (id: "grp-2")
    Left->>Left: Highlight card with active focus state
    UI->>Right: Render loading skeleton
    UI->>BE: GET /api/user-groups/grp-2/members?page=1&limit=10
    BE->>DB: Query members enrolled in grp-2
    DB-->>BE: Members array
    BE-->>UI: 200 OK
    UI->>Right: Instantly populate member table for grp-2

    Note over Admin, DB: 3. Enrolling a New Member
    Admin->>Right: Click "+ Add Member" button
    Right->>Modal: Open member enrollment dialog
    Admin->>Modal: Search "Alice" and select candidate user
    Admin->>Modal: Click "Add to Group"
    Modal->>BE: POST /api/user-groups/grp-2/members { userIds: ["usr-alice"] }
    BE->>DB: INSERT INTO user_group_members (group_id, user_id) VALUES ('grp-2', 'usr-alice')
    DB-->>BE: Association persisted
    BE-->>Modal: 201 Created
    Modal-->>UI: Close dialog & trigger refresh
    UI->>Right: Append new member to roster table
    UI->>Left: Increment memberCount on left card by +1
    Right-->>Admin: Toast "Added Alice to group successfully!"

    Note over Admin, DB: 4. Removing a Member from Group
    Admin->>Right: Click Trash icon on member row
    Right->>UI: Prompt confirmation dialog
    Admin->>UI: Confirm Removal
    UI->>BE: DELETE /api/user-groups/grp-2/members/usr-b
    BE->>DB: DELETE FROM user_group_members WHERE group_id = 'grp-2' AND user_id = 'usr-b'
    DB-->>BE: Association deleted
    BE-->>UI: 200 OK
    UI->>Right: Remove row from table
    UI->>Left: Decrement memberCount on left card by -1
    Right-->>Admin: Toast "Member removed from group"
```

---

### 2.4. Technical Specifications & Architecture Details

1. **Decoupled Architecture (Separate from Plans)**:
   - Dedicated route `/admin/groups` with independent layout, removing confusion between monetized plan definitions and learner cohort management.
2. **Bi-directional Local State Synchronization**:
   - Adding or removing members immediately updates the `memberCount` badge on the corresponding card on the left without re-fetching the entire groups list.
3. **Server-Side Pagination for Scalability**:
   - Server-side pagination (10 items/page) guarantees sub-50ms table rendering even for enterprise cohorts containing thousands of enrolled students.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **Adding Existing Group Member** | Database enforces `(group_id, user_id)` unique constraint | Candidate search filters out enrolled members beforehand |
| **Deleting a Non-Empty Group** | Prompts confirmation dialog | Upon admin confirmation, cascade deletes group and associations in `user_group_members` |
| **Group Has Zero Members** | API returns empty array `[]` | Right pane renders friendly Empty State: *"No members in this group yet. Click + Add Member to enroll learners."* |

---

## 3. References & Source Links

- **Frontend Codebase (MODULE_ADMIN)**:
  - Admin Groups Page: [AdminGroupsPage.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/pages/admin/AdminGroupsPage.tsx)
  - Admin Groups Tab Component: [AdminGroupsTab.tsx](file:///d:/Projects/study-web/MODULE_ADMIN/src/pages/admin/_components/AdminGroupsTab.tsx)
  - Groups Admin API Client: [groups.admin.api.ts](file:///d:/Projects/study-web/MODULE_ADMIN/src/features/admin/api/groups.admin.api.ts)
- **Backend Codebase (MODULE_BE)**:
  - Groups Controller: [groups.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/groups/groups.controller.ts)
  - Groups Service: [groups.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/groups/groups.service.ts)
- **Related Workflows**:
  - Admin Users Governance: [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md)
  - Subscription Plans & Payment: [12-upgrade-and-payment.md](file:///d:/Projects/study-web/docs/workflows/12-upgrade-and-payment.md)
