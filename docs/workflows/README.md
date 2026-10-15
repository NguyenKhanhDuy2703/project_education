# study-web System Workflows & Sequences Hub

This directory contains the authoritative technical **Sequence Diagrams** and workflow specifications for each isolated subsystem of the **study-web** learning platform, adhering strictly to the **3-part structure (Information - Content - References)** defined by the `docs-as-code` specification.

### Tri-Modular Monorepo Architecture Overview

The system is decoupled into three independent runtime environments:
- **`MODULE_BE` (Backend API)**: NestJS, Prisma ORM, PostgreSQL database, JWT/Bcrypt authentication, and PBAC (Policy/Permission-Based Access Control) policy enforcement.
- **`MODULE_FE` (User & Contributor Client)**: React 19 + Vite, deployed on the primary user domain (`studyweb.dev`). Hosts the public catalog, practice web workers, learner progress tracking, and the **User Dashboard Contributor Hub** (`/user/dashboard`).
- **`MODULE_ADMIN` (Isolated Admin Web Application)**: Independent React 19 + Vite application, deployed on a dedicated administrative subdomain (`admin.studyweb.dev`). Restricted to verified Platform Administrators with local credential authentication, emergency CLI recovery, IAM group management, and quality control review queues.

---

## Granular Sequence Workflows Directory

| Workflow ID | Workflow Document | Scope & Technical Responsibilities | Associated Roles | Target Application | Markdown Document Link |
|---|---|---|---|---|---|
| **WF-01** | **Authentication & Session Flow** | Phone/Password login, Google OAuth for users, local Bcrypt credentials for Admin, dual-token issuance (15m Access Token in Redux / 7d HttpOnly Refresh Cookie), Admin Change Password modal, and CLI emergency password recovery | All Users, Admins | `MODULE_FE`, `MODULE_ADMIN`, `MODULE_BE` | [01-auth-login-to-home.md](file:///d:/Projects/study-web/docs/workflows/01-auth-login-to-home.md) |
| **WF-02** | **Catalog & Topic Discovery** | Catalog browsing, series catalog retrieval, reactive Topic Tag pill filtering, keyword search, roadmap curriculum view, and two-tier lab access gates | Learners, Guests | `MODULE_FE` | [02-catalog-topic-discovery.md](file:///d:/Projects/study-web/docs/workflows/02-catalog-topic-discovery.md) |
| **WF-03** | **Lab Practice & Web Worker Execution** | Two-pane workspace layout, Monaco Code Editor, in-browser background thread code execution (JavaScript / SQL), and 2-second safety Timeout Guard | Learners in Practice | `MODULE_FE` | [03-lab-practice-webworker.md](file:///d:/Projects/study-web/docs/workflows/03-lab-practice-webworker.md) |
| **WF-04** | **Lab Submission & Progress Tracking** | Submission lifecycle, append-only history audit logging in `lab_submissions`, single-state upsert in `user_progress`, and dashboard metric synchronization | Learners, System | `MODULE_FE`, `MODULE_BE` | [04-lab-submission-progress.md](file:///d:/Projects/study-web/docs/workflows/04-lab-submission-progress.md) |
| **WF-05** | **Create Series & Topic Tag Association** | Series creation modal in Contributor Hub, automatic SEO slug generation, curated topic tag selection, and reactive state synchronization | Contributors | `MODULE_FE` (Dashboard) | [05-create-series.md](file:///d:/Projects/study-web/docs/workflows/05-create-series.md) |
| **WF-06** | **Two-Step Lab Creation Studio** | Step 1 Markdown Theory authoring (synchronized split live preview) $\to$ Step 2 Exercise Setup (Starter, Solution, visual Test Cases) with mandatory pre-flight solution verification | Contributors | `MODULE_FE` (Studio) | [06-create-lab-studio.md](file:///d:/Projects/study-web/docs/workflows/06-create-lab-studio.md) |
| **WF-07** | **Content Review & Publish Lifecycle** | Content state machine (`draft` $\to$ `submitted` $\to$ `changes_requested` / `approved` $\to$ `published`), Admin Review Queue in standalone portal, and audit trails | Contributors, Admins | `MODULE_FE` $\to$ `MODULE_ADMIN` | [07-content-review-and-publish.md](file:///d:/Projects/study-web/docs/workflows/07-content-review-and-publish.md) |
| **WF-08** | **System-Wide Topic Tag Governance** | Centralized taxonomy curation (CRUD tags, hex color assignment, anti-pollution guards), and real-time `topic-tags-updated` event synchronization to Catalog and Studio | Administrators (Admin) | `MODULE_ADMIN` | [08-admin-topic-governance.md](file:///d:/Projects/study-web/docs/workflows/08-admin-topic-governance.md) |
| **WF-09** | **Admin User Governance & Entitlements** | Paginated user roster (10 users/page), role transitions (User, Pro, Contributor, Admin), immediate session revocation via account suspension, and direct feature entitlement overrides | Administrators (Admin) | `MODULE_ADMIN` | [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md) |
| **WF-10** | **User Group Management Split View** | Dual-pane split-view layout: Left group directory (~35%) and right member roster (~65%), dynamic member addition/removal, and independent pagination | Administrators (Admin) | `MODULE_ADMIN` | [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md) |
| **WF-11** | **User Feedback Collection & Resolution** | In-app feedback/bug submission with automatic URL context capture, triage dashboard with 4 KPI cards, category filters, and detail modal | Learners, Admins | `MODULE_FE` $\to$ `MODULE_ADMIN` | [11-user-feedback-loop.md](file:///d:/Projects/study-web/docs/workflows/11-user-feedback-loop.md) |
| **WF-12** | **PRO Upgrade & VNPAY Payment** | Paywall pricing modal (Monthly/Yearly), VNPAY gateway redirect, secure HMAC-SHA512 IPN webhook verification, and instant PRO entitlement activation | Learners, VNPAY Gateway | `MODULE_FE`, `MODULE_BE` | [12-upgrade-and-payment.md](file:///d:/Projects/study-web/docs/workflows/12-upgrade-and-payment.md) |
| **WF-13** | **Contributor Onboarding & Application Review** | Learner submission of Contributor application via User Dashboard modal, dedicated Admin Application Review Queue (`/admin/contributor-applications`), review feedback, and automated status activation | Learners, Admins | `MODULE_FE` $\to$ `MODULE_ADMIN` | [13-contributor-onboarding-and-application.md](file:///d:/Projects/study-web/docs/workflows/13-contributor-onboarding-and-application.md) |

---

## Architectural Cross-References

- **Overall Project Proposal**: [01-proposal.md](file:///d:/Projects/study-web/docs/01-proposal.md)
- **Product Backlog**: [03-product-backlog.md](file:///d:/Projects/study-web/docs/03-product-backlog.md)
- **System Architecture Design**: [04-architecture.md](file:///d:/Projects/study-web/docs/04-architecture.md)
- **Database Schema Design**: [05-database.md](file:///d:/Projects/study-web/docs/05-database.md)
- **Dynamic Authorization & Entitlements**: [07-dynamic-authorization-and-entitlements.md](file:///d:/Projects/study-web/docs/07-dynamic-authorization-and-entitlements.md)
- **Admin & Contributor Isolation Strategy**: [11-admin-contributor-separation-and-user-crud.md](file:///d:/Projects/study-web/docs/11-admin-contributor-separation-and-user-crud.md)
- **Admin Subdomain Deployment Setup**: [admin-subdomain-setup.md](file:///d:/Projects/study-web/docs/deployment/admin-subdomain-setup.md)
- **Main Documentation Hub**: [docs/README.md](file:///d:/Projects/study-web/docs/README.md)
