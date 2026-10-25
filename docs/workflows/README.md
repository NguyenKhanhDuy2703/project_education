# study-web System Workflows & Sequences Hub

This directory contains the authoritative technical **Sequence Diagrams** and workflow specifications for each isolated subsystem of the **study-web** learning platform, adhering strictly to the **3-part structure (Information - Content - References)** defined by the `docs-as-code` specification.

## Documentation truth labels

| Label | Meaning |
|---|---|
| `IMPLEMENTED` | Route, UI, API, authorization, and data behavior are present in the current repository. |
| `PARTIAL` | A useful subset exists, but one or more steps are read-only, client-only, or missing persistence/API support. |
| `PLACEHOLDER` | UI communicates the intended journey but does not call a real backend capability. |
| `EXTERNAL` | Completion depends on a payment provider, deployed domain, credentials, or another system outside this repository. |

Every detailed feature flow should state: actor and trigger; preconditions; happy path; alternatives and errors; authorization boundary; API and persistent side effects; loading, empty, success, and failure UI states; observability/audit behavior; and exact source evidence. Claims not supported by current code must be marked `PARTIAL`, `PLACEHOLDER`, or `EXTERNAL`.

## Master feature-flow coverage matrix

| Feature family | Truth status | Canonical workflow |
|---|---|---|
| Registration, login, Google OAuth, refresh, logout, profile, theme, locale, password flows | `IMPLEMENTED` + explicit partials | [WF-15](15-account-lifecycle-profile-and-preferences.md) |
| Public landing, catalog, topic filters, series detail, roadmaps, legal and fallback navigation | `IMPLEMENTED` | [WF-02](02-catalog-topic-discovery.md) |
| Pricing, effective access, upgrade and payment boundary | `PARTIAL` / `EXTERNAL` | [WF-12](12-upgrade-and-payment.md) |
| Learner overview, submissions, profile, saved library, contributor route transitions | `IMPLEMENTED`; saved library `PLACEHOLDER` | [WF-16](16-learner-dashboard-and-library.md) |
| Shared lab shell, strategy routing, theory, quiz, SQL, Automation V1/V2/V3 | `IMPLEMENTED`; SQL asset gate open | [WF-17](17-learning-unit-strategies.md) |
| Attempt persistence, progress lifecycle, completion and dashboard synchronization | `IMPLEMENTED` | [WF-04](04-lab-submission-progress.md) |
| Contributor application and admin review | `IMPLEMENTED` | [WF-13](13-contributor-onboarding-and-application.md) |
| Contributor series creation and topic association | `IMPLEMENTED` | [WF-05](05-create-series.md) |
| Contributor two-step lab studio and preflight | `IMPLEMENTED` | [WF-06](06-create-lab-studio.md) |
| Content review, change requests, approval, publish/unpublish, ownership transfer | `IMPLEMENTED` | [WF-07](07-content-review-and-publish.md) |
| Feedback submission, admin triage and deletion | `IMPLEMENTED` | [WF-11](11-user-feedback-loop.md) |
| Admin authentication and protected portal entry | `IMPLEMENTED`; deployment checks `EXTERNAL` | [WF-01](01-auth-login-to-home.md) |
| Admin dashboard, content hierarchy, lab authoring and SQL preflight | `IMPLEMENTED` | [WF-18](18-admin-content-plans-and-audit.md) |
| Admin topic-tag taxonomy | `PARTIAL` — browser-local only | [WF-08](08-admin-topic-governance.md) |
| Admin users, role/status and individual entitlements | `IMPLEMENTED` | [WF-09](09-admin-users-and-entitlements.md) |
| Admin user groups, membership and plan assignment | `IMPLEMENTED` | [WF-10](10-admin-user-groups-split-view.md) |
| Admin plans, feature registry, effective access and audit browser | `IMPLEMENTED` with bounded audit scope | [WF-18](18-admin-content-plans-and-audit.md) |
| Client sandbox architecture for Automation V3 | `IMPLEMENTED` behind feature flag | [WF-14](14-automation-v3-client-sandbox-flow.md) |

### Tri-Modular Monorepo Architecture Overview

The system is decoupled into three independent runtime environments:
- **`MODULE_BE` (Backend API)**: NestJS, Prisma ORM, PostgreSQL database, JWT/Bcrypt authentication, and PBAC (Policy/Permission-Based Access Control) policy enforcement.
- **`MODULE_FE` (User & Contributor Client)**: React 19 + Vite, intended for the primary user domain (`studyit.dev`). Hosts the public catalog, practice web workers, learner progress tracking, and the **User Dashboard Contributor Hub** (`/user/dashboard`).
- **`MODULE_ADMIN` (Isolated Admin Web Application)**: Independent React 19 + Vite application, intended for the dedicated administrative subdomain (`admin.studyit.dev`). Restricted to verified Platform Administrators with local credential authentication, emergency CLI recovery, IAM group management, and quality control review queues. Deployment verification remains a manual release gate.

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
| **WF-08** | **Browser-Local Topic Tag Governance** | CRUD/reset taxonomy in Admin local storage with same-origin event synchronization; no backend or cross-domain persistence | Administrators (Admin) | `MODULE_ADMIN`, `MODULE_FE` | [08-admin-topic-governance.md](08-admin-topic-governance.md) |
| **WF-09** | **Admin User Governance & Entitlements** | Paginated user roster (10 users/page), role transitions (User, Pro, Contributor, Admin), immediate session revocation via account suspension, and direct feature entitlement overrides | Administrators (Admin) | `MODULE_ADMIN` | [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md) |
| **WF-10** | **User Group Management Split View** | Dual-pane split-view layout: Left group directory (~35%) and right member roster (~65%), dynamic member addition/removal, and independent pagination | Administrators (Admin) | `MODULE_ADMIN` | [10-admin-user-groups-split-view.md](file:///d:/Projects/study-web/docs/workflows/10-admin-user-groups-split-view.md) |
| **WF-11** | **User Feedback Collection & Resolution** | In-app feedback/bug submission with automatic URL context capture, triage dashboard with 4 KPI cards, category filters, and detail modal | Learners, Admins | `MODULE_FE` $\to$ `MODULE_ADMIN` | [11-user-feedback-loop.md](file:///d:/Projects/study-web/docs/workflows/11-user-feedback-loop.md) |
| **WF-12** | **PRO Access, Pricing & Payment Boundary** | PRO paywall and pricing UI, manual email/admin activation, effective entitlement enforcement, and explicitly unimplemented automated payment gateway | Learners, Admins | `MODULE_FE`, `MODULE_ADMIN`, `MODULE_BE` | [12-upgrade-and-payment.md](12-upgrade-and-payment.md) |
| **WF-13** | **Contributor Onboarding & Application Review** | Learner submission of Contributor application via User Dashboard modal, dedicated Admin Application Review Queue (`/admin/contributor-applications`), review feedback, and automated status activation | Learners, Admins | `MODULE_FE` $\to$ `MODULE_ADMIN` | [13-contributor-onboarding-and-application.md](file:///d:/Projects/study-web/docs/workflows/13-contributor-onboarding-and-application.md) |
| **WF-14** | **Automation V3 Client Sandbox & Low-Code Execution** | Visual block palette insertion, Playwright AST code compilation, in-RAM iframe sandbox execution, real-time DOM highlight ring, 2s safety timeout guard, versioned base64 submission envelope, and zero-browser backend declarative plan validation | Learners, Platform System | `MODULE_FE`, `MODULE_BE` | [14-automation-v3-client-sandbox-flow.md](file:///d:/Projects/study-web/docs/workflows/14-automation-v3-client-sandbox-flow.md) |
| **WF-15** | **Account Lifecycle, Profile & Preferences** | Registration/login truth boundaries, Google OAuth, refresh rotation, logout, password/profile gaps, theme and English-only locale | Guests, Users | `MODULE_FE`, `MODULE_BE` | [15-account-lifecycle-profile-and-preferences.md](15-account-lifecycle-profile-and-preferences.md) |
| **WF-16** | **Learner Dashboard & Library** | Server-derived progress KPIs, submission history, saved-series placeholder, profile and contributor route transitions | Learners, Contributors | `MODULE_FE`, `MODULE_BE` | [16-learner-dashboard-and-library.md](16-learner-dashboard-and-library.md) |
| **WF-17** | **Learning Unit Strategy Flows** | Shared workspace plus theory, quiz, SQL, Automation V1/V2/V3, fallback, authoritative grading and progress | Learners, Platform System | `MODULE_FE`, `MODULE_BE` | [17-learning-unit-strategies.md](17-learning-unit-strategies.md) |
| **WF-18** | **Admin Content, Plans, Entitlements & Audit** | Content hierarchy/studio, SQL preflight, plan-feature mapping, direct access overrides, and bounded audit trail | Administrators | `MODULE_ADMIN`, `MODULE_BE` | [18-admin-content-plans-and-audit.md](18-admin-content-plans-and-audit.md) |

---

## Architectural Cross-References

- **Overall Project Proposal**: [01-proposal.md](file:///d:/Projects/study-web/docs/01-proposal.md)
- **Product Backlog**: [03-product-backlog.md](file:///d:/Projects/study-web/docs/03-product-backlog.md)
- **Current Lab Platform Architecture Analysis**: [12-lab-platform-upgrade-analysis.md](../12-lab-platform-upgrade-analysis.md)
- **Database Schema Design**: [05-database.md](file:///d:/Projects/study-web/docs/05-database.md)
- **Dynamic Authorization & Entitlements**: [07-dynamic-authorization-and-entitlements.md](file:///d:/Projects/study-web/docs/07-dynamic-authorization-and-entitlements.md)
- **Admin & Contributor Isolation Strategy**: [11-admin-contributor-separation-and-user-crud.md](file:///d:/Projects/study-web/docs/11-admin-contributor-separation-and-user-crud.md)
- **Admin Subdomain Deployment Setup**: [admin-subdomain-setup.md](file:///d:/Projects/study-web/docs/deployment/admin-subdomain-setup.md)
- **Main Documentation Hub**: [docs/README.md](file:///d:/Projects/study-web/docs/README.md)
