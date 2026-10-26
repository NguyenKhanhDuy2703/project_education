# Product Backlog v1.2 Implementation — Scratchpad & External Working Memory

> **Status**: COMPLETED
> **Strategy**: Stabilization First (Wave 0 -> Wave 1 -> Wave 2 -> Wave 3)
> **Active Wave**: All Waves Complete (Gates G0–G6 Passed)
> **Gates**: G0 (Scope/Contract) -> G1 (Security) -> G2 (API Contract) -> G3 (Data/Migration) -> G4 (Functional E2E) -> G5 (Non-functional) -> G6 (Release/Docs)

---

## Baseline Accepted Decisions
- **D-01**: Register returns HTTP 201 + `{ message, user, nextAction: 'login' }`; no auto-login after register.
- **D-02**: Backend entitlement is source of truth. Roles describe personas; admin bypass has audit logs.
- **D-03**: Canonical capability keys on backend; FE reads effective access / locked state from server.
- **D-04**: Unified Markdown sanitization allowlist policy for Learner FE and Admin FE.
- **D-05**: Safe incremental migration preserving existing data + reproducible fresh migration chain.
- **D-06**: Server-side authoritative grading; client status/score is never trusted.
- **D-07**: Archive lifecycle and endpoint implemented on backend and Admin FE.
- **D-08**: No arbitrary payment/email provider selection; provider-dependent features remain Blocked.

---

## Two-Tier Task Checklist

### Wave 0: Scope, Contract and Test Baseline
- [x] **Subtask 0.1**: Lock and document all contracts & security boundaries (Auth, Entitlements, Locked lab payload, Grading, Progress, Admin governance).
  - *Files*: `docs/reports/product-backlog-v1-2-execution-plan.md`, `docs/03-product-backlog.md`
  - *Verify*: All 7 contract areas explicitly mapped to D-01 through D-07 with request/response schemas.
  - *Evidence*: Section 2.2 of both documents locks D-01 to D-08 contracts; API contract boundary, schema types, and security criteria verified. Gate G0 pass.
- [x] **Subtask 0.2**: Create regression tests characterizing known vulnerabilities (token revive, locked lab leak, draft series leak, progress manipulation, orphan ownership bypass, Markdown XSS, migration reproducibility).
  - *Files*: `MODULE_BE/test/wave0-security-reproduction.spec.ts`, `MODULE_FE/src/test/markdown-security.test.ts`, `MODULE_ADMIN/src/test/markdown-security.test.ts`
  - *Verify*: Reproduction test assertions accurately capture and document the existing defects.
  - *Evidence*: Created test suites confirming P0-01 (16 missing tables), P0-03 (XSS on FE & Admin), P0-04 (token revival), P0-05 (locked lab leakage), P1-04 (inactive series leak), P1-06 (orphan ownership bypass). All reproduction tests pass, capturing defective baseline behavior. Gate G0 completely PASS.

---

### Wave 1: P0 Stabilization

#### W1.1: PB-16 Database Migrations
- [x] **Subtask 1.1.1**: Design safe incremental migration completing all 20 Prisma models, enums, FKs, indices and deterministic backfills.
  - *Files*: `MODULE_BE/prisma/migrations/20261023153000_learning_unit_pattern_redesign/migration.sql`, `MODULE_BE/prisma/migrations/20261025180000_complete_core_schema_baseline/migration.sql`, `MODULE_BE/prisma/schema.prisma`
  - *Verify*: `npx prisma validate` passes; fresh deploy migration SQL contains all missing tables and enums.
  - *Evidence*: Created `20261025180000_complete_core_schema_baseline` and augmented `20261023153000` with prerequisite tables/enums; `npx prisma validate` passes cleanly with 0 errors.
- [x] **Subtask 1.1.2**: Write migration smoke check test validating schema integrity and model completeness.
  - *Files*: `MODULE_BE/test/migration-smoke.spec.ts`
  - *Verify*: Passes against database/schema model checks.
  - *Evidence*: `test/migration-smoke.spec.ts` passes (3/3 assertions), verifying all 20 Prisma models have matching `CREATE TABLE`, all enums exist, and migration timestamps are monotonic. Gate G3 and G6 pass. PB-16 Done.

#### W1.2: PB-18 / PB-07 / PB-15 Safe Markdown & Stored XSS Prevention
- [x] **Subtask 1.2.1**: Implement unified allowlist-based Markdown sanitizer for Learner FE.
  - *Files*: `MODULE_FE/src/pages/lab/_components/renderMarkdown.ts`, `MODULE_FE/src/test/markdown-security.test.ts`
  - *Verify*: Neutralizes `<script>`, `onerror`, `onload`, `javascript:` URLs; preserves code blocks, tables, valid links.
  - *Evidence*: `renderMarkdown.ts` now uses DOM-based allowlist sanitizer; `src/test/markdown-security.test.ts` passes (4/4 tests).
- [x] **Subtask 1.2.2**: Implement unified allowlist-based Markdown sanitizer for Admin FE.
  - *Files*: `MODULE_ADMIN/src/pages/admin/_utils/renderMarkdown.ts`, `MODULE_ADMIN/src/test/markdown-security.test.ts`
  - *Verify*: Editor preview and review queue sanitize all dangerous payloads.
  - *Evidence*: `renderMarkdown.ts` in Admin FE updated with identical DOMParser allowlist policy; `src/test/markdown-security.test.ts` passes (4/4 tests). All 9 test files (53 tests) in Admin pass. Gates G1, G4, G5 pass. PB-18 Done.

#### W1.3: PB-19 / PB-03 Secure Session Lifecycle
- [x] **Subtask 1.3.1**: Eliminate plaintext `User.refreshToken` usage and legacy refresh fallback; enforce session invalidation on change-password and logout.
  - *Files*: `MODULE_BE/src/modules/auth/auth-session.service.ts`, `MODULE_BE/src/modules/auth/auth.service.ts`
  - *Verify*: Revoked/replayed refresh token returns 401; password change revokes all tokens without legacy revival.
  - *Evidence*: Removed fallback to unhashed lookup; `authSession.validateAndRotate` clears `User.refreshToken`; `revokeAllUserSessions` invalidates sessions and clears raw tokens.
- [x] **Subtask 1.3.2**: Remove refresh token from OAuth callback redirect URL and sanitize auth logging.
  - *Files*: `MODULE_BE/src/modules/auth/auth.controller.ts`, `MODULE_FE/src/pages/auth/GoogleCallbackPage.tsx`
  - *Verify*: Google callback URL only passes safe one-time token or cookie; no refresh token in URL params.
  - *Evidence*: `auth.controller.ts` `googleCallback` no longer adds `refreshToken` to URL search params; refresh token securely stored in HttpOnly cookie.
- [x] **Subtask 1.3.3**: Add rate limiting guard on auth endpoints (login, register, refresh, feedback).
  - *Files*: `MODULE_BE/src/common/guards/rate-limit.guard.ts`, `MODULE_BE/src/modules/auth/auth.controller.ts`, `MODULE_BE/src/modules/feedback/feedback.controller.ts`, `MODULE_BE/test/session-security.spec.ts`
  - *Verify*: Excessive requests trigger HTTP 429 Too Many Requests.
  - *Evidence*: `RateLimitGuard` created and applied to `/auth/login`, `/auth/register`, `/auth/refresh`, and `/feedback`; verified with unit test returning 429 upon exceeding threshold. Gates G1–G4 pass. PB-03/PB-19 Done.

#### W1.4: PB-20 / PB-09 Unified Entitlement & Access Control
#### W1.4: PB-20 / PB-09 Unified Entitlement & Access Control
- [x] **Subtask 1.4.1**: Align canonical feature/permission keys between FE and BE (`EXECUTE_LAB_ADVANCED`, `VIEW_SOLUTION`, `RUN_JS_WORKER`, `AI_CODE_REVIEW`).
  - *Files*: `MODULE_FE/src/features/auth/permissions.ts`, `MODULE_FE/src/types/user.types.ts`, `MODULE_ADMIN/src/features/auth/permissions.ts`, `MODULE_ADMIN/src/types/user.types.ts`, `MODULE_BE/prisma/seed.ts`
  - *Verify*: FE uses canonical backend keys; role alone does not grant PRO features.
  - *Evidence*: Added `EXECUTE_LAB_ADVANCED`, `VIEW_SOLUTION`, `RUN_JS_WORKER`, `AI_CODE_REVIEW` to PermissionCode and capability mappings in FE and Admin; seeded features in backend Prisma seed; verified across FE and Admin test suites (284 FE tests + 53 Admin tests pass).
- [x] **Subtask 1.4.2**: Restrict locked lab response in `LabsService.findBySlug` to minimal metadata when `isLocked === true`.
  - *Files*: `MODULE_BE/src/modules/labs/labs.service.ts`
  - *Verify*: Locked lab response contains NO instructions, testScript, initialSnippet, quizQuestions, solution, or sensitive config.
  - *Evidence*: `findBySlug` now checks `isLocked` immediately after entitlements resolution and returns stripped entity with only safe navigation metadata; verified in `wave0-security-reproduction.spec.ts` P0-05 prevention test.
- [x] **Subtask 1.4.3**: Enforce publication checks in public catalog and protect `includeInactive`.
  - *Files*: `MODULE_BE/src/modules/series/series.controller.ts`, `MODULE_BE/src/modules/series/series.service.ts`
  - *Verify*: Public `GET /series` always forces active and published content; anonymous queries cannot view drafts.
  - *Evidence*: Added `OptionalJwtAuthGuard` to `series.controller.ts`; `series.service.ts` enforces `isActive: true, status: 'published'` unless requester has explicit admin role; verified in `wave0-security-reproduction.spec.ts` P1-04 prevention test.

#### W1.5: PB-17 / PB-11 / PB-13 Server-Authoritative Grading
- [x] **Subtask 1.5.1**: Require server-authoritative grading in `LabsService.submit`; eliminate client-supplied status fallback.
  - *Files*: `MODULE_BE/src/modules/labs/labs.service.ts`
  - *Verify*: Forged `status: passed` is ignored; server grader calculates status and score.
  - *Evidence*: Default `authoritativeResult.status` initialized to `'failed'`; `assertLabAccess` verifies authorization before submission; verified in `wave0-p0-reproduction.spec.ts` P0-2 prevention test.
- [x] **Subtask 1.5.2**: Update starter code and configurations so starter solutions never pass automatically.
  - *Files*: `MODULE_BE/prisma/seed.ts`, `MODULE_BE/prisma/v3-curriculum-data.ts`
  - *Verify*: Starter code fails test script; answer-leaking comments removed.
  - *Evidence*: Updated `auto-syntax-01`, `02`, `04` initial snippets with incomplete starter code; sanitized answer-leaking comments in SQL labs 3–6; added `gradingRules` and reduced `starterPlan` in all 8 Automation V3 labs; verified in `wave0-p0-reproduction.spec.ts` P0-1, P0-3, P0-4, P0-5 tests.
- [x] **Subtask 1.5.3**: Guard progress transitions (`start`, `updatePosition`, `complete`) against unpublished/unauthorized labs and client score injection.
  - *Files*: `MODULE_BE/src/modules/labs/labs.service.ts`
  - *Verify*: Non-theory lab completion requires valid server submission; unauthorized lab progress is rejected.
  - *Evidence*: Added `assertLabAccess` check across `startTheoryProgress`, `updateTheoryPosition`, and `completeTheoryProgress`; `completeTheoryProgress` rejects non-theory labs with `BadRequestException` and locks score strictly to 100 on server.
- [x] **Subtask 1.5.4**: Convert `wave0-p0-reproduction.spec.ts` into prevention regression tests verifying vulnerabilities are closed.
  - *Files*: `MODULE_BE/test/wave0-p0-reproduction.spec.ts`, `MODULE_BE/test/wave0-security-reproduction.spec.ts`
  - *Verify*: All assertions verify that vulnerabilities are prevented.
  - *Evidence*: Converted P0-1 through P0-5 and P0-04, P0-05, P1-04, P1-06, P0-01 to prevention assertions. All 67 BE tests in 20 suites pass cleanly. Gates G0 and G1 fully PASS.

---

### Wave 2: Restore Core Flows

#### W2.1: PB-01 Registration Contract
- [x] **Subtask 2.1.1**: Update BE register response to HTTP 201 + `{ message, user, nextAction: 'login' }` and duplicate email/phone to 409 Conflict.
  - *Files*: `MODULE_BE/src/modules/auth/auth.controller.ts`, `MODULE_BE/src/modules/auth/auth.service.ts`
  - *Verify*: Duplicate registration returns 409; success returns 201 with `nextAction: 'login'`.
  - *Evidence*: Added `@HttpCode(HttpStatus.CREATED)` to `/auth/register`; thrown `ConflictException` for duplicate email and phone; returned `{ message, nextAction: 'login', user }`; verified in `MODULE_BE/test/session-security.spec.ts` (all 4 tests pass).
- [x] **Subtask 2.1.2**: Align FE registration hook and page to navigate to `/login` without setting unauthenticated token.
  - *Files*: `MODULE_FE/src/features/auth/hooks/useAuth.ts`, `MODULE_FE/src/pages/auth/RegisterPage.tsx`, `MODULE_FE/src/features/auth/components/LoginForm.tsx`, `MODULE_FE/src/test/registration-flow.test.tsx`
  - *Verify*: Register flow redirects to login page with success notification; no undefined access token in store.
  - *Evidence*: Removed `setAuth` from `registerMutation.onSuccess`; `RegisterPage` navigates to `/login` with `state: { registered: true }`; `LoginForm` displays success banner; verified with `MODULE_FE/src/test/registration-flow.test.tsx` (passes).

#### W2.2: PB-04 / PB-22 Account Lifecycle
- [x] **Subtask 2.2.1**: Update BE `/auth/me` to include `defaultAddress`, `avatarUrl`, `isContributor`, `contributorStatus` and add profile update endpoint.
  - *Files*: `MODULE_BE/src/modules/auth/auth.controller.ts`, `MODULE_BE/src/modules/auth/auth.dto.ts`, `MODULE_BE/src/modules/users/users.service.ts`
  - *Verify*: Profile returns all fields; update endpoint validates and persists profile changes.
  - *Evidence*: `GET /auth/me` returns `defaultAddress`, `avatarUrl`, `isContributor`, `contributorStatus`; `PUT /auth/profile` updates `name`, `avatarUrl`, `defaultAddress` using `UpdateProfileDto` and returns refreshed profile; verified with BE tests.
- [x] **Subtask 2.2.2**: Implement Learner FE Profile edit and Change Password modal/form.
  - *Files*: `MODULE_FE/src/features/auth/components/EditProfileModal.tsx`, `MODULE_FE/src/features/auth/components/ChangePasswordModal.tsx`, `MODULE_FE/src/features/auth/api/auth.api.ts`, `MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`, `MODULE_FE/src/test/user-profile-view.test.tsx`
  - *Verify*: User can update profile info and change password with current password verification.
  - *Evidence*: Created `EditProfileModal` and `ChangePasswordModal` wired to `authApi.updateProfile` and `authApi.changePassword`; added action triggers in `UserProfileView`; verified in `src/test/user-profile-view.test.tsx` (passes).

#### W2.3: PB-21 / PB-14 / PB-15 Admin Governance Contract & Ownership
- [x] **Subtask 2.3.1**: Implement archive endpoint for Series and Labs in `ReviewController` and `ReviewService`.
  - *Files*: `MODULE_BE/src/modules/review/review.controller.ts`, `MODULE_BE/src/modules/review/review.service.ts`, `MODULE_BE/test/admin-governance-archive.spec.ts`
  - *Verify*: `POST /admin/review/:type/:id/archive` sets status to `archived` and logs audit entry.
  - *Evidence*: Added `archive` in `ReviewService` and `@Post(':type/:id/archive')` in `ReviewController`; verified with `admin-governance-archive.spec.ts` (both series and lab tests pass).
- [x] **Subtask 2.3.2**: Harmonize Admin FE review API calls (`reject` sends `{ reason }`, `transferOwnership` sends `{ newAuthorId }`, group plans `PUT`).
  - *Files*: `MODULE_ADMIN/src/features/admin/api/review.admin.api.ts`, `MODULE_ADMIN/src/features/admin/api/groups.admin.api.ts`
  - *Verify*: Contract parity between Admin FE and Backend API.
  - *Evidence*: `reject` sends `{ reason }`, `transferOwnership` sends `{ newAuthorId, reason }`, `assignPlans` changed from POST to PUT `/admin/groups/:id/plans`. Admin tests pass (53/53).
- [x] **Subtask 2.3.3**: Fix `ResourceOwnerGuard` to deny contributor modifications when `authorId === null`.
  - *Files*: `MODULE_BE/src/common/guards/resource-owner.guard.ts`
  - *Verify*: Non-admin contributors are denied access to orphaned resources.
  - *Evidence*: `ResourceOwnerGuard` checks `if (!authorId || authorId !== user.userId) throw new ForbiddenException(...)`; verified in `wave0-security-reproduction.spec.ts` P1-06 prevention test.
- [x] **Subtask 2.3.4**: Add confirmation dialog to Admin user role/pro promotion and ensure atomic entitlement update.
  - *Files*: `MODULE_ADMIN/src/pages/admin/_components/AdminUsersTab.tsx`
  - *Verify*: Admin role change requires explicit confirmation and triggers plan assignment.
  - *Evidence*: Added `pendingRoleChange` state and confirmation dialog intercepting role dropdown change in `AdminUsersTab.tsx`; verified with Admin test suite.

#### W2.4: PB-11 / PB-12 / PB-13 Typed Submission & Solution Prerequisite
- [x] **Subtask 2.4.1**: Add support for typed submissions (`code`, `pull_request`, `test_file`) in DTO and submission model.
  - *Files*: `MODULE_BE/src/modules/labs/dto/submit-lab.dto.ts`, `MODULE_BE/src/modules/labs/labs.service.ts`, `MODULE_BE/test/typed-submission-and-solution.spec.ts`
  - *Verify*: Submissions validate submission type and payload format.
  - *Evidence*: Added `submissionType` enum to `SubmitLabDto`; validated PR URL format and non-empty test file in `LabsService.submit`; verified in `test/typed-submission-and-solution.spec.ts`.
- [x] **Subtask 2.4.2**: Enforce submission prerequisite on solution viewing (only view solution if user has passed or is entitled).
  - *Files*: `MODULE_BE/src/modules/labs/labs.service.ts`, `MODULE_BE/test/typed-submission-and-solution.spec.ts`
  - *Verify*: Unauthorized learners cannot view reference solutions.
  - *Evidence*: `findBySlug` checks `isCompleted = progress?.status === COMPLETED` and only reveals reference solution if user has completed lab or holds explicit entitlement / admin role; verified in `test/typed-submission-and-solution.spec.ts`.

#### W2.5: PB-26 Quality Pipeline & Verification
- [x] **Subtask 2.5.1**: Add `backend-e2e-matrix.test.ts` to test script and run full-stack verification.
  - *Files*: `MODULE_BE/package.json`, `MODULE_BE/test/backend-e2e-matrix.test.ts`
  - *Verify*: Test suite runs all tests including E2E RBAC matrix.
  - *Evidence*: Added `test:e2e` to `package.json`; fixed persona query to target seeded accounts; fixed `validateAutomationLabForRelease` to only check automation labs; all 25/25 assertions pass in `backend-e2e-matrix.test.ts`. 72/72 BE tests, 286/286 FE tests, 53/53 Admin tests pass. Gate G4 pass.
- [x] **Subtask 2.5.2**: Verify production builds across BE, FE, and Admin modules.
  - *Files*: `MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`
  - *Verify*: `npm run build` exits 0 across all 3 modules.
  - *Evidence*: Fixed TS series property lookup in `MODULE_BE/src/modules/labs/labs.service.ts`; `npm run build` succeeded with code 0 across all three modules (`MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`). Gates G4 & G5 pass. PB-26 Done.

---

### Wave 3: Complete MVP Features

#### W3.1: PB-08 Sample Project Links
- [x] **Subtask 3.1.1**: Render validated GitHub repository and Swagger documentation links in Learner workspace.
  - *Files*: `MODULE_FE/src/components/domain/SampleProjectLinks.tsx`, `MODULE_FE/src/pages/lab/SeriesDetailPage.tsx`, `MODULE_FE/src/pages/lab/_components/LabTheoryPane.tsx`, `MODULE_FE/src/types/lab.types.ts`, `MODULE_BE/src/modules/labs/labs.service.ts`, `MODULE_FE/src/test/sample-project-links.test.tsx`
  - *Verify*: Links display with appropriate icons and target attributes when present; hidden when null; invalid protocols blocked.
  - *Evidence*: Created `SampleProjectLinks` component with URL validation (http/https only, blocking javascript:/data: URLs) and secure `rel="noopener noreferrer"`; wired to `SeriesDetailPage` header and `LabTheoryPane` header; updated `LabsService` to return `repoUrl` and `swaggerUrl`; 5/5 unit tests pass in `sample-project-links.test.tsx`. Gates G2, G4, G5 pass. PB-08 Done.

#### W3.2: PB-10 Categorized Bug Hints
- [x] **Subtask 3.2.1**: Implement Bug Hints UI with collapsible severity tiers (Critical, Major, Minor).
  - *Files*: `MODULE_FE/src/pages/lab/_components/BugHintsPanel.tsx`, `MODULE_FE/src/pages/lab/_components/LabTheoryPane.tsx`, `MODULE_FE/src/test/bug-hints.test.tsx`
  - *Verify*: Hints default to collapsed state; displays severity badges; keyboard accessible; markdown sanitized.
  - *Evidence*: Created `BugHintsPanel` with `Critical`, `Major`, `Minor` tiers, aria-expanded/aria-controls accessibility attributes, and DOMParser Markdown sanitizer; integrated into `LabTheoryPane`; verified with 4/4 passing unit tests in `bug-hints.test.tsx`. Gates G1, G2, G4, G5 pass. PB-10 Done.

#### W3.3: PB-23 Saved Series
- [x] **Subtask 3.3.1**: Implement saved series (bookmarks) endpoint and persistence.
  - *Files*: `MODULE_BE/prisma/schema.prisma`, `MODULE_BE/prisma/migrations/20261025210000_add_user_saved_series/migration.sql`, `MODULE_BE/src/modules/series/series.controller.ts`, `MODULE_BE/src/modules/series/series.service.ts`, `MODULE_FE/src/features/lab/api/series.api.ts`, `MODULE_FE/src/pages/lab/SeriesDetailPage.tsx`, `MODULE_BE/test/saved-series.spec.ts`, `MODULE_FE/src/test/saved-series.test.tsx`
  - *Verify*: User can save and unsave series; list saved series for authenticated user; duplicate calls are idempotent; unpublished/deleted series filtered out.
  - *Evidence*: Added `UserSavedSeries` model, unique composite index, and migration `20261025210000_add_user_saved_series`; implemented `POST /series/:id/save`, `DELETE /series/:id/save`, `GET /series/user/saved`, and `isSaved` field in `SeriesService.findBySlug`; added Bookmark button in `SeriesDetailPage.tsx`; all 4 backend tests in `saved-series.spec.ts` and 3 frontend tests in `saved-series.test.tsx` pass. Gates G1–G4 pass. PB-23 Done.

#### W3.4: PB-25 Shared Topic Taxonomy
- [x] **Subtask 3.4.1**: Standardize topic taxonomy categories and validation between FE, Admin, and BE.
  - *Files*: `MODULE_BE/src/modules/series/series.service.ts`, `MODULE_BE/src/modules/series/series.controller.ts`, `MODULE_FE/src/services/topicTags.service.ts`, `MODULE_ADMIN/src/test/topic-tags.test.ts`, `MODULE_BE/test/taxonomy-sync.spec.ts`
  - *Verify*: Topic categories and aliases are synchronized across BE, FE, and Admin; validation normalizes input categories in create/update.
  - *Evidence*: Added `CANONICAL_TOPICS`, `TOPIC_KEY_ALIASES`, `normalizeTopicKey`, and `GET /series/taxonomy/topics` endpoint to `SeriesService` & `SeriesController`; category normalization enforced in `create` and `update`; verified 5/5 unit tests pass in `MODULE_BE/test/taxonomy-sync.spec.ts` and 13/13 tests pass in `MODULE_ADMIN/src/test/topic-tags.test.ts`. Gates G1, G2, G4 pass. PB-25 Done.

---

### Wave 4: Expansion (Documented Status)
- [ ] **PB-24**: Monetization / Payment Provider Lifecycle — **BLOCKED** pending business/provider selection.
- [ ] **PB-27**: GitHub / Webhook Automated Verification — **DEFERRED** post-MVP.

---

## Subtask Execution Log & Verification Evidence
*(Evidence for each subtask will be appended sequentially below)*
