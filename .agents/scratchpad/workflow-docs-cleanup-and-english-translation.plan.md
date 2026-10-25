# Plan: Workflow Documentation Cleanup, Sequential Ordering & Full English Translation

> **Status**: COMPLETED — checklist 22/22 closed

**Target Directory**: `d:\Projects\study-web\docs\workflows\`  
**Date**: 2026-10-14  
**Author**: Antigravity (Pair Programming Assistant)  
**Standard**: `docs-as-code` (3-part structure: Info, Content, References) & Plan-and-Execute Protocol

---

## High-Level Objective
1. **Clean up redundant / duplicate legacy files**: Delete the 7 legacy files that caused duplicate numbering (`01-`, `02-`, `03-`, `05-`, `06-`, `07-`, `08-`) and obsolete documentation.
2. **Standardize sequential numbering**: Ensure the remaining 12 canonical workflows are cleanly ordered `01` to `12`, matching the project's official workflow catalog.
3. **Translate completely to English**:
   - YAML frontmatter: `language: en`, English metadata (`title`, `scope`, `status`, etc.).
   - Section 1 (Document Information): English table properties and descriptions.
   - Section 2 (Core Content): English TL;DR, Roles & Responsibilities, Mermaid diagrams (nodes, actors, step notes, conditionals), and technical architecture writeups.
   - Section 3 (References): Clean cross-links to related active docs and source code.
4. **Update Central Index (`README.md`)**: Provide a full English index table mapping WF-01 through WF-12.

---

## Two-Tier Task Breakdown

### Task 1: Clean up redundant / duplicate legacy files
- [x] **Subtask 1.1**: Remove legacy `docs/workflows/01-auth-and-session.md` (superseded by `01-auth-login-to-home.md`)
  - *File*: `docs/workflows/01-auth-and-session.md`
  - *Verify*: File deleted, git status reflects removal.
- [x] **Subtask 1.2**: Remove legacy `docs/workflows/02-lab-access-rbac.md` (superseded by `02-catalog-topic-discovery.md` and dynamic authorization specs)
  - *File*: `docs/workflows/02-lab-access-rbac.md`
  - *Verify*: File deleted.
- [x] **Subtask 1.3**: Remove legacy `docs/workflows/03-webworker-execution.md` (superseded by `03-lab-practice-webworker.md`)
  - *File*: `docs/workflows/03-webworker-execution.md`
  - *Verify*: File deleted.
- [x] **Subtask 1.4**: Remove legacy `docs/workflows/05-tester-bug-simulation.md` (legacy prototype file)
  - *File*: `docs/workflows/05-tester-bug-simulation.md`
  - *Verify*: File deleted.
- [x] **Subtask 1.5**: Remove legacy `docs/workflows/06-fe-current-state.md` (legacy snapshot from Oct 2)
  - *File*: `docs/workflows/06-fe-current-state.md`
  - *Verify*: File deleted.
- [x] **Subtask 1.6**: Remove legacy `docs/workflows/07-upgrade-and-payment.md` (superseded by `12-upgrade-and-payment.md`)
  - *File*: `docs/workflows/07-upgrade-and-payment.md`
  - *Verify*: File deleted.
- [x] **Subtask 1.7**: Remove legacy `docs/workflows/08-admin-operations.md` (superseded by granular workflows 07, 08, 09, 10)
  - *File*: `docs/workflows/08-admin-operations.md`
  - *Verify*: File deleted.
- [x] **Subtask 1.8**: Verify directory integrity
  - *File*: `docs/workflows/`
  - *Verify*: Directory contains exactly 12 numbered files (`01` through `12`) + `README.md`.

---

### Task 2: Translate & Refine Core User & Learner Workflows (WF-01 to WF-04) into English
- [x] **Subtask 2.1**: Translate `01-auth-login-to-home.md`
  - *File*: `docs/workflows/01-auth-login-to-home.md`
  - *Content*: Full English frontmatter (`language: en`), summary, roles table, Mermaid sequence diagram (auth flow, token issue, silent refresh, role-based redirect), and technical specifications.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 2.2**: Translate `02-catalog-topic-discovery.md`
  - *File*: `docs/workflows/02-catalog-topic-discovery.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (catalog loading, topic tags query, optimistic filtering, lab paywall check), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 2.3**: Translate `03-lab-practice-webworker.md`
  - *File*: `docs/workflows/03-lab-practice-webworker.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (split-pane workspace, Monaco Editor, Web Worker sandboxed execution, 2s timeout guard), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 2.4**: Translate & Update `04-lab-submission-progress.md`
  - *File*: `docs/workflows/04-lab-submission-progress.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (submission cycle, dual-table storage: `lab_submissions` history + `user_progress` upsert), fix legacy reference from `03-webworker-execution.md` to `03-lab-practice-webworker.md`.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.

---

### Task 3: Translate & Refine Contributor & Studio Workflows (WF-05 to WF-07) into English
- [x] **Subtask 3.1**: Translate `05-create-series.md`
  - *File*: `docs/workflows/05-create-series.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (quick modal, slug generation, topic tag assignment, optimistic Redux update), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 3.2**: Translate `06-create-lab-studio.md`
  - *File*: `docs/workflows/06-create-lab-studio.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (two-step studio: Step 1 Markdown theory live preview, Step 2 interactive test case configuration and mandatory solution trial run), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 3.3**: Translate `07-content-review-and-publish.md`
  - *File*: `docs/workflows/07-content-review-and-publish.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (lifecycle state transitions: draft -> submitted -> changes_requested / approved -> published, audit logging, review queue), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.

---

### Task 4: Translate & Refine Admin & Governance Workflows (WF-08 to WF-10) into English
- [x] **Subtask 4.1**: Translate `08-admin-topic-governance.md`
  - *File*: `docs/workflows/08-admin-topic-governance.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (admin centralized topic tag CRUD, color hex coding, broadcast event for real-time catalog synchronization), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 4.2**: Translate `09-admin-users-and-entitlements.md`
  - *File*: `docs/workflows/09-admin-users-and-entitlements.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (10 items/page user table, role changes, immediate account suspension with session revocation, standalone feature entitlements override), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 4.3**: Translate `10-admin-user-groups-split-view.md`
  - *File*: `docs/workflows/10-admin-user-groups-split-view.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (split view layout: 35% left folder tree + 65% right member roster, dynamic member addition/removal, independent pagination), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.

---

### Task 5: Translate & Refine Feedback, Monetization & Hub Index (WF-11, WF-12, README) into English
- [x] **Subtask 5.1**: Translate `11-user-feedback-loop.md`
  - *File*: `docs/workflows/11-user-feedback-loop.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (feedback submission modal with auto-captured URL context, `/admin/feedback` dashboard with 4 KPI statistic cards, status triage modal), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 5.2**: Translate `12-upgrade-and-payment.md`
  - *File*: `docs/workflows/12-upgrade-and-payment.md`
  - *Content*: Full English frontmatter, summary, roles table, Mermaid sequence diagram (pricing modal, VNPAY redirect, secure HMAC-SHA512 IPN webhook verification, immediate PRO badge & entitlement activation), and technical specs.
  - *Verify*: No Vietnamese text remains; Mermaid syntax valid; links intact.
- [x] **Subtask 5.3**: Translate & Update `docs/workflows/README.md`
  - *File*: `docs/workflows/README.md`
  - *Content*: Full English introduction, complete table of all 12 workflows (WF-01 to WF-12) with English descriptions, roles, and Markdown file links, plus architecture cross-references.
  - *Verify*: All 12 links resolve to active files, no broken links.
- [x] **Subtask 5.4**: Final Verification & Cross-Document Link Check
  - *Files*: All files in `docs/workflows/`
  - *Verify*: Run check script or regex search to confirm 0 Vietnamese words remaining in headers/metadata, all links valid, sequential numbering strictly from 01 to 12.
