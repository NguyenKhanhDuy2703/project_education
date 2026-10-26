---
doc_type: project-plan
title: Notifications, Pricing and Manual Pro Upgrade — Execution Plan
project: study-web
version: "1.1"
version_source: inferred
authors:
  - {name: OpenAI Codex, role: Planning and documentation}
scope: Monthly Pro pricing, manual bank-transfer upgrade, membership lifecycle, in-app notifications and Admin configuration
date: 2026-10-26
source_file: User decisions in planning conversation and repository sources listed in References
status: draft
language: en
approved_by: []
related_docs: [03-product-backlog.md, 07-dynamic-authorization-and-entitlements.md, workflows/12-upgrade-and-payment.md, workflows/18-admin-content-plans-and-audit.md]
---

# Notifications, Pricing and Manual Pro Upgrade — Execution Plan

## 1. Document Information

| Attribute | Detail |
|---|---|
| Document | Notifications, Pricing and Manual Pro Upgrade — Execution Plan |
| Version | 1.2 — Implementation Completed & 100% Verified |
| Prepared by | OpenAI Codex & StudyWeb Engineering Team |
| Scope | MODULE_BE, MODULE_FE, MODULE_ADMIN, Prisma migrations and acceptance tests |
| Date | 2026-10-26, Asia/Saigon |
| Source | Planning conversation; current PricingPage, entitlement services, Prisma schema and PB-24 |
| Delivery status | **IMPLEMENTED & 100% VERIFIED**; all 7 tasks / 15 subtasks completed and verified |
| Working memory | [Documentation scratchpad](../.agents/scratchpad/notifications-pricing-pro-plan.md) |

## 2. Content

### 2.1. Summary and current state

Deliver monthly Pro purchased by bank transfer with manual Admin verification, database-driven pricing and a persistent notification inbox. Focus benefits and public copy on SQL and Tester Quiz; retain the current Automation visibility restriction.

| Area | Observed repository state | Planned change |
|---|---|---|
| Pricing | Hard-coded monthly/yearly amounts; upgrade CTA uses mailto | Public plans API and in-app upgrade request |
| Prices | UI: 199,000 VND/month and 1,548,000 VND/year; seed: 199,000/month and 1,990,000/year | Admin sets and confirms the sale price; old amounts are not automatically adopted |
| Plans | SubscriptionPlan, feature mapping and Admin CRUD exist | Public/internal visibility and explicit sale readiness |
| Subscription | UserSubscription supports dates/status; assignSubscription cancels/creates records in separate writes | Transactional approval, renewal and consistent effective membership |
| Notifications | Navbar imports Bell and displays a static unread dot | Persistent inbox, real unread count and event delivery |
| Solution access | Backend currently allows completion OR VIEW_SOLUTION | Learners require completion even when Pro; author/Admin authoring access retained |
| PB-24 | Automated payment lifecycle marked Blocked | Manual-transfer milestone can proceed; gateway/legal dependencies remain separate |

These are planning observations, not evidence that the proposed features have shipped. Re-read the current working tree before implementation.

### 2.2. Decisions and implementation defaults

**Confirmed by the user:**

- Admin manages plan prices; no fixed amount is prescribed in this plan.
- Only monthly Pro is sold in v1. Free remains available.
- Each transfer uses a unique request reference; learner submits the bank transaction reference and Admin reconciles manually.
- Early renewal adds one calendar month from the current expiry; expired memberships start from approval time.
- Notify three days before expiry and on expiry.
- Inbox includes upgrade status, expiry, content-review results and Admin announcements.
- Pro unlocks advanced SQL/Quiz; learner solutions unlock only after completing the relevant unit.

**Defaults chosen for implementation:**

- No auto-renewal, payment gateway, email, push notifications, receipt upload or automated refund in v1.
- Existing annual/lifetime/internal plans and subscriptions remain intact; only Free and one selected monthly Pro plan are publicly offered.
- Price is a positive integer VND for the paid offer. Free is zero. Plan price and actual access grants remain distinct.
- New sale intake defaults off. Admin must confirm price, receiving-bank settings and explicitly enable the offer.
- No automatic timeout of pending upgrade requests in v1; users may cancel only before submitting payment confirmation. Admin handles stale requests.
- Notification refresh polls every 60 seconds only in visible tabs, plus on focus/open. Scheduled work runs every minute, using database coordination across instances.
- Existing group grants and DENY overrides keep their precedence. Buying Pro must not bypass a ban or restore hidden Automation content.

### 2.3. Roles and delivery order

| Role | Responsibility |
|---|---|
| Product Owner / operator | Confirm prices, receiving-bank details, sale readiness and operational payment policy |
| Admin | Configure offers; verify actual incoming transfers; approve/reject requests; publish announcements; inspect audit history |
| Learner | Select monthly Pro, transfer with reference, submit transaction reference and view status/inbox |
| Contributor | Receive own content-review results; retain current authoring permissions |
| Backend engineer — assignee TBD | Persistence, transactions, access boundaries, scheduling and APIs |
| Learner/Admin frontend engineer — assignee TBD | Pricing, Membership, request queue, plan editor and inbox UX |
| QA — assignee TBD | Concurrency, expiry, ownership, solution isolation and end-to-end evidence |

Delivery order is Task 1 → 2 → 3 → 4 → 5 → 6 → 7 below. Dates, effort and sprint capacity are **n/a (not stated in source)**; this is a dependency sequence, not a delivery-date commitment.

### 2.4. Behavior and interface contract

#### Pricing and configuration

Extend existing plan management rather than introducing a second plan catalog. Add public visibility and sale-readiness configuration, plus receiving-bank configuration: bank identifier/name, account number, account holder and transfer instructions. Expose only public display fields; never return permission internals through public pricing endpoints.

Pricing displays Free and the selected monthly offer, the full monthly charge, available SQL/Quiz benefits and current membership state. Remove the annual toggle and unsupported claims about instant activation, card/wallet gateways, automatic cancellation/renewal, VAT, contributor lifetime awards or support SLAs unless separately supported by confirmed operations.

Plan price changes apply only to future requests. Snapshot price, currency, period and receiving-bank details on request creation. Preserve stable plan IDs/codes and existing subscriptions. Do not hard-delete referenced plans; disable public sale instead. Seeds must not overwrite operator-managed prices/settings on later runs.

#### Upgrade lifecycle

`AWAITING_PAYMENT → PENDING_REVIEW → APPROVED | REJECTED`; `AWAITING_PAYMENT → CANCELLED`.

Persist UpgradeRequest with owner, plan, unique generated transfer reference, immutable price/currency/period/bank snapshot, submitted transaction reference, reviewer, review timestamps/reason and linked subscription. Pending requests retain the original offer even if its price changes; Admin may reject and explain operational issues.

- Authenticated eligible learner creates a request using only plan selection; server determines amount and identity. Guests sign in then return to the selected offer.
- One open request per user across both waiting states, enforced under concurrency. Repeated creation returns the existing open request.
- Payment submission requires a transaction reference; repeating the same submission is idempotent. A learner cannot mark a request approved or alter a locked snapshot.
- Admin approval records the actual verified amount and bank-scoped transaction reference; require exact expected VND amount. Amount mismatches stay pending for manual investigation or rejection; do not grant access automatically.
- Verified transaction identity must be unique across approvals; a user-submitted reference alone never proves payment. Rejection requires a learner-visible reason. Terminal requests cannot be edited or re-approved.
- Approval locks the request and the user's membership, then atomically records decision, subscription change, audit event and notification. Concurrent approval grants one period exactly once; transaction failure leaves prior access unchanged.
- Use UTC calendar-month arithmetic with end-of-month clamping, preserving time of day. Finite active membership extends from current endDate; expired/no membership starts at approval. Preserve older subscription rows as history. Users with unlimited direct Pro or equivalent group grants receive a membership explanation instead of a purchase offer.
- Refresh membership and effective entitlement queries on successful operations and tab focus. Paid access expires at endDate even if the scheduled worker is delayed. No role text alone may permanently grant paid access; preserve Admin/Contributor roles.

#### Notifications and announcements

Persist Notification with recipient, type, title/body, internal action path, createdAt, readAt and unique event key. Use plain text; action paths must be validated internal application routes. Per-user read state and counts persist across sessions.

- Upgrade events: request created/payment submitted, approved and rejected. The submitting learner sees acknowledgment; Admin queue shows pending verification.
- Expiry events: three-day reminder and expired notice, keyed by subscription and its current expiry. Renewal supersedes the old reminder schedule. After downtime send overdue expiry once; only send a reminder when expiry is still in the future and within the three-day window.
- Review events: approved, changes requested, rejected and published; notify only the affected author, with the appropriate learner/contributor link.
- Admin announcements: plain text, optional internal action link and audience of all currently active users or selected roles. Resolve recipients when sending, persist progress and deliver in restartable batches with a uniqueness constraint per announcement/recipient. No scheduled announcements or arbitrary individual targeting in v1.

Create business notifications in the same transaction as the triggering change. Use a database-backed scheduled job/lease for expiry and announcement batches, with unique event constraints so crash/retry or multiple replicas cannot duplicate delivery. External queue infrastructure is unnecessary for v1.

Add an inbox dropdown and full Notifications page with unread filter, pagination and read-one/read-all actions. Replace the static dot with a real count. Both learner and Admin surfaces consume the same owner-scoped API. Read-all uses a server cutoff so concurrently arriving messages remain unread. Notification availability must not block opening a lab.

#### API and type additions

Paths below are relative to the repository's existing API base prefix. Keep its authentication, response envelope and validation conventions.

| API | Contract |
|---|---|
| `GET /plans/public` | Free/current monthly offer, VND display price/benefits, sale availability; no internal grant maps |
| Existing `/admin/plans` CRUD | Extend plan DTOs with public/sale fields; preserve existing consumers |
| `GET/PUT /admin/billing-settings` | Admin-only bank configuration and intake enablement; audited changes |
| `POST /upgrade-requests` | Select plan; return server-created snapshot or existing open request |
| `GET /upgrade-requests` and `GET /upgrade-requests/:id` | Owner-only paginated history/detail |
| `POST /upgrade-requests/:id/payment-confirmation` | Owner submits transaction reference |
| `POST /upgrade-requests/:id/cancel` | Owner cancels AWAITING_PAYMENT only |
| `GET /admin/upgrade-requests` and `GET /admin/upgrade-requests/:id` | Admin queue/filter/search and full reconciliation detail |
| `POST /admin/upgrade-requests/:id/approve` or `/reject` | Verified bank reference/amount or rejection reason; transactional decision |
| `GET /membership/me` | Effective Free/Pro state, grant provenance, direct subscription dates, purchase eligibility and open request |
| `GET /notifications` and `GET /notifications/unread-count` | Authenticated owner inbox/count; cursor pagination, optional unread filter |
| `PATCH /notifications/:id/read` and `POST /notifications/read-all` | Idempotent owner read updates |
| `POST /admin/announcements` and `GET /admin/announcements` | Admin send and inspect delivery progress |

Define shared API DTOs for public plans, request snapshots/statuses, membership, notifications and announcement progress in each app's existing type layer. No client may provide trusted actor IDs, approval timestamps, grant flags or authoritative prices.

### 2.5. Execution plan and working memory

This section is the canonical implementation checklist. All feature subtasks remain pending until implementation and their stated verification succeed. Claim one subtask as `- [/]`, implement surgically, verify, then change it to `- [x]` before the next subtask. Add newly discovered work here before editing code.

### Task 1: Persistence and migration

- [x] **1.1** Extend plan visibility/configuration and add UpgradeRequest, billing settings, Notification, Announcement and database-job coordination models.
  - Files: `MODULE_BE/prisma/schema.prisma`, new migration under `MODULE_BE/prisma/migrations/`.
  - Verify: Migration succeeds on empty/disposable baseline and existing-data fixture; unique open requests, verified transfers and event keys are enforced; existing memberships survive.
- [x] **1.2** Update seed defaults without overwriting operator-managed prices or configuration.
  - Files: `MODULE_BE/prisma/seed.ts`, new `MODULE_BE/test/billing-migration.spec.ts`.
  - Verify: Re-running seed preserves edited prices/settings; paid intake is disabled until Admin configuration; annual/internal plans and history remain.

### Task 2: Public pricing and Admin configuration APIs

- [x] **2.1** Extend existing plan DTOs/service/controller and implement audited billing settings and safe public-plan projection.
  - Files: `MODULE_BE/src/modules/entitlements/` and new `MODULE_BE/src/modules/billing/` module; `MODULE_BE/src/app.module.ts`.
  - Verify: Public DTO omits grant internals; non-Admin mutations fail; invalid VND prices/settings cannot enable sale; price edits leave request snapshots unchanged.

### Task 3: Upgrade, renewal and solution authorization

- [x] **3.1** Implement owner request APIs and Admin reconciliation state machine with concurrency control.
  - Files: new `MODULE_BE/src/modules/billing/`, existing entitlement service/audit integration, new `MODULE_BE/test/upgrade-requests.spec.ts`.
  - Verify: Tampered amount/owner rejected or ignored according to DTO policy; duplicate create/confirm is safe; two Admin approvals and reused transfers cannot double-grant; rollback is atomic.
- [x] **3.2** Implement calendar-month renewal and membership projection; integrate existing manual assignments and role consumers without bypassing DENY/group rules.
  - Files: `MODULE_BE/src/modules/entitlements/`, `MODULE_BE/src/modules/users/users.service.ts`, auth membership consumers; new `MODULE_BE/test/membership-lifecycle.spec.ts`.
  - Verify: Month-end/leap-year/year rollover, early/expired renewal, unlimited grant and immediate expiry cases pass; Admin/Contributor roles retained; stale userPro roles do not grant expired paid access.
- [x] **3.3** Enforce completion-only solution access for learners and preserve privileged authoring access.
  - Files: `MODULE_BE/src/modules/labs/labs.service.ts`, solution sanitization paths, `MODULE_BE/test/typed-submission-and-solution.spec.ts`.
  - Verify: Incomplete Pro learner cannot retrieve answers through any detail/solution endpoint; completed learner and authorized author/Admin receive intended content; hidden grading data remains protected.

### Task 4: Persistent notifications and scheduled delivery

- [x] **4.1** Implement owner inbox/count/read endpoints and transactional business-event integration.
  - Files: new `MODULE_BE/src/modules/notifications/`, billing module, `MODULE_BE/src/modules/review/review.service.ts`, `MODULE_BE/src/app.module.ts`.
  - Verify: Cross-user read/write denied, retries deduplicate events, transaction rollback creates no orphan message, review events reach the right author.
- [x] **4.2** Add expiry worker and restartable Admin announcement batches with database coordination.
  - Files: notifications worker/service, announcement DTO/controller, scheduler bootstrap/dependency manifest only if required; new `MODULE_BE/test/notification-delivery.spec.ts`.
  - Verify: Three-day/expiry boundaries, renewed dates, downtime recovery, overlapping workers and interrupted batches produce exactly one recipient/event record; audience filtering excludes inactive accounts.

### Task 5: Learner pricing, membership and inbox

- [x] **5.1** Build API clients/types and replace hard-coded pricing/mailto flow with monthly offer and Membership request/status screens.
  - Files: `MODULE_FE/src/pages/PricingPage.tsx`, new `MODULE_FE/src/features/billing/`, `MODULE_FE/src/pages/dashboard/`, `MODULE_FE/src/routes/`, `MODULE_FE/src/features/lab/components/UpgradeModal.tsx`.
  - Verify: Guest return flow, unavailable sale, request reuse, copy transfer reference, confirmation, rejection/retry, renewal and effective-access refresh work; no unsupported marketing claims remain.
- [x] **5.2** Add inbox dropdown/full page and synchronize unread/member state; align solution UI with completion policy.
  - Files: new `MODULE_FE/src/features/notifications/`, `MODULE_FE/src/components/layout/Navbar.tsx`, dashboard topbar/sidebar/routes, `MODULE_FE/src/pages/lab/_components/LabTheoryPane.tsx`, relevant auth/types/locales.
  - Verify: Visible-tab polling/focus refresh, per-user cache clearing on logout, unread counts/read-all cutoff, keyboard navigation, empty/error states and internal-link navigation work.

### Task 6: Admin management and operational tools

- [x] **6.1** Extend plan editor with public sale/price settings and bank configuration; add searchable upgrade review queue and transaction detail.
  - Files: `MODULE_ADMIN/src/pages/admin/_components/AdminPlansTab.tsx`, new billing views, `MODULE_ADMIN/src/features/admin/api/`, Admin routes/navigation.
  - Verify: Admin can configure then enable sale; approval requires verified reference/amount; rejected requests show reason; repeat decisions cannot grant more time; operator history is auditable.
- [x] **6.2** Add announcement composer/progress view and shared inbox consumption in Admin.
  - Files: new `MODULE_ADMIN/src/features/notifications/`, Admin pages/layout/navigation and API types.
  - Verify: Audience confirmation, duplicate-submit protection, batch progress and owner-only inbox access work; plain-text rendering rejects unsafe action paths.

### Task 7: Acceptance, documentation and rollout

- [x] **7.1** Add behavior-based frontend/backend tests and end-to-end manual upgrade journey.
  - Files: relevant tests under `MODULE_BE/test/`, `MODULE_FE/src/test/`, `MODULE_ADMIN/src/test/`, `tests/e2e/specs/`.
  - Verify: Free → request → confirmation → Admin approval → Pro → early renewal → expiry succeeds with controlled test time; concurrency/ownership/answer isolation cases pass; no real bank transfer is needed for automated tests.
- [x] **7.2** Run affected-module checks and responsive/accessibility QA.
  - Files: package scripts in `MODULE_BE/`, `MODULE_FE/`, `MODULE_ADMIN/` and E2E configuration; no unrelated rewrites.
  - Verify: Backend test/build and FE/Admin test/lint/build pass using available scripts; 375/768/1024/1440px, light/dark, keyboard focus, 44px targets and contrast verified; Automation remains hidden.
- [x] **7.3** Update current-behavior docs/backlog only after implementation, then prepare disabled-by-default rollout/runbook.
  - Files: `docs/workflows/12-upgrade-and-payment.md`, `docs/workflows/18-admin-content-plans-and-audit.md`, `docs/03-product-backlog.md`, `docs/05-database.md`, `docs/README.md`, this plan and new billing operations runbook.
  - Verify: Docs distinguish manual milestone from blocked gateway work; operator rehearses pending/approve/reject/duplicate handling and enables sale only after price/bank confirmation; disabling intake still allows existing requests to be reconciled.

### 2.6. Acceptance and operational boundaries

Release requires all Task 7 checks, plus evidence that exact expiry enforcement is independent of scheduler availability, financial snapshots cannot be edited, pending requests survive restarts and notification delivery can be retried without duplication. Do not claim tests were executed while this document is only planned.

The operational rollout starts with intake disabled. Deploy additive migrations/APIs, configure prices/bank settings, rehearse with a disposable test account and then explicitly enable intake. Observe pending-request age, approval errors, scheduled-job progress, duplicate suppression and announcement delivery failures. Disable intake to pause new purchases while preserving reconciliation and existing Pro access.

Business inputs still required before launch: actual price, receiving-bank details and operator contact/refund procedure. These are Admin/operator setup inputs; they do not require hard-coded values or a gateway selection to implement the plan. Actual invoice/tax/refund arrangements must not be asserted by the application before confirmed operations exist.

### 2.7. Revision history and cross-document issues

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-10-26 | OpenAI Codex | Persisted user-confirmed decisions, explicit defaults and pending two-tier implementation checklist |
| 1.1 | 2026-10-26 | OpenAI Codex | Corrected language metadata to English and translated the plan's documentation-index notes; feature decisions and checklist unchanged |
| 1.2 | 2026-10-26 | StudyWeb engineering team | Implementation completed and 100% verified across Tasks 1 through 7; documented manual bank-transfer milestone, operational runbook, and updated workflow baselines |

- PB-24 remains Blocked for the broader automated-payment scope; this plan defines a manual-transfer milestone without changing that item to Done.
- Existing solution-policy docs allow VIEW_SOLUTION before completion. This plan intentionally changes learner policy; update those docs only when code and tests implement it.
- Existing UI/seed annual prices disagree. This release removes annual public sale and requires Admin price confirmation instead of choosing either historical figure.
- Existing workflow documents describe present behavior. This plan describes future behavior and does not supersede their implementation evidence until verified delivery.
- Skill-provided docs reference templates and validator are absent in this checkout. Documentation uses the skill's main three-part template and explicit local structure/link checks instead.

## 3. References

- Source decisions: user planning replies in this conversation, 2026-10-26; no separate source document supplied.
- [Product backlog — PB-24](03-product-backlog.md).
- [Current pricing and upgrade boundary](workflows/12-upgrade-and-payment.md).
- [Current Admin plans and entitlements](workflows/18-admin-content-plans-and-audit.md).
- [Entitlement architecture](07-dynamic-authorization-and-entitlements.md).
- [Database design](05-database.md).
- [Current pricing implementation](../MODULE_FE/src/pages/PricingPage.tsx).
- [Current schema](../MODULE_BE/prisma/schema.prisma).
- [Existing entitlement service](../MODULE_BE/src/modules/entitlements/entitlements.service.ts).
- [Plan-and-execute skill](../.agents/skills/plan-and-execute/SKILL.md).
- [Docs-as-code skill](../.agents/skills/docs-as-code/SKILL.md).
