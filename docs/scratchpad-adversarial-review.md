# Adversarial Review Scratchpad: Notifications, Pricing, and Pro Lifecycle

## Plan & Progress Tracking

### Task 1: Database Migration Polish
- [x] Subtask 1.1: Add partial unique index for open upgrade requests in migration SQL.
  File: `MODULE_BE/prisma/migrations/20261026120000_add_billing_notifications_jobs/migration.sql`
  Verify: Check SQL file has `CREATE UNIQUE INDEX IF NOT EXISTS "upgrade_requests_user_open_unique_idx"`

### Task 2: Fix Admin Billing API & Tabs
- [x] Subtask 2.1: Update `MODULE_ADMIN/src/features/admin/api/billing.admin.api.ts` with complete backend contract fields, field mapping/normalization, and approve/reject parameter alignments.
  File: `MODULE_ADMIN/src/features/admin/api/billing.admin.api.ts`
  Verify: TypeScript compiles cleanly without error.
- [x] Subtask 2.2: Fix `MODULE_ADMIN/src/pages/admin/_components/AdminUpgradeRequestsTab.tsx` to use normalized fields and safely render `reviewedBy` (avoiding React child object crash).
  File: `MODULE_ADMIN/src/pages/admin/_components/AdminUpgradeRequestsTab.tsx`
  Verify: Render tests pass and `reviewedBy` renders name/id safely.
- [x] Subtask 2.3: Fix `MODULE_ADMIN/src/pages/admin/_components/AdminBillingSettingsTab.tsx` to include `instructions` field in form state and API payload.
  File: `MODULE_ADMIN/src/pages/admin/_components/AdminBillingSettingsTab.tsx`
  Verify: Field exists and is dispatched in `saveSettings`.

### Task 3: Fix Admin Announcements Contract & UI
- [x] Subtask 3.1: Update `MODULE_ADMIN/src/features/notifications/types/notifications.types.ts` and `notifications.admin.api.ts` to map `targetAudience` / `audience` and recipient progress fields properly.
  File: `MODULE_ADMIN/src/features/notifications/types/notifications.types.ts`, `MODULE_ADMIN/src/features/notifications/api/notifications.admin.api.ts`
  Verify: Admin announcement types include both naming conventions safely.
- [x] Subtask 3.2: Fix `AdminAnnouncementsPage.tsx` progress bar calculation (`Math.round((processed / total) * 100)` guarded against division by zero `NaN%`).
  File: `MODULE_ADMIN/src/pages/admin/AdminAnnouncementsPage.tsx`
  Verify: Progress percentage displays integer / 0% without `NaN%`.

### Task 4: Fix Notification Types & Badges across FE & ADMIN
- [x] Subtask 4.1: Update `MODULE_FE/src/features/notifications/types/notifications.types.ts` and `MODULE_ADMIN/src/features/notifications/types/notifications.types.ts` with all 12 backend `NotificationType` enum values.
  Files: `MODULE_FE/src/features/notifications/types/notifications.types.ts`, `MODULE_ADMIN/src/features/notifications/types/notifications.types.ts`
  Verify: TypeScript compiles without unknown notification type warnings.
- [x] Subtask 4.2: Update notification icon and badge helper functions in `NotificationDropdown.tsx`, `UserNotificationsView.tsx`, and `AdminNotificationDropdown.tsx` to correctly handle `UPGRADE_*`, `PAYMENT_*`, `MEMBERSHIP_*`, and `CONTENT_REVIEW_*`.
  Files: `MODULE_FE/src/features/notifications/components/NotificationDropdown.tsx`, `MODULE_FE/src/pages/dashboard/views/UserNotificationsView.tsx`, `MODULE_ADMIN/src/features/notifications/components/AdminNotificationDropdown.tsx`
  Verify: Badges and icons render appropriate styling for all notification types.

### Task 5: Add Rigorous Tests for New Behavior & Edge Cases
- [x] Subtask 5.1: Add backend unit/integration tests for banned solution viewing and concurrent upgrade request race conditions.
  Files: `MODULE_BE/test/typed-submission-and-solution.spec.ts`, `MODULE_BE/test/upgrade-requests.spec.ts`
  Verify: `npm test` in `MODULE_BE` passes all tests.
- [x] Subtask 5.2: Update or add admin unit tests for billing requests, instructions, and announcements.
  Files: `MODULE_ADMIN/src/test/admin-billing.test.tsx`, `MODULE_ADMIN/src/test/admin-announcements.test.tsx`
  Verify: `npm test -- --run` in `MODULE_ADMIN` passes all tests.

### Task 6: Full Verification & Final Adversarial Report
- [x] Subtask 6.1: Run full test suites across `MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`.
  Verify: Zero failed tests in all 3 modules (BE: 116/116 passed, FE: 306/306 passed, ADMIN: 62/62 passed).
- [x] Subtask 6.2: Run full build across `MODULE_BE`, `MODULE_FE`, `MODULE_ADMIN`.
  Verify: Zero build errors across NestJS and Vite builds.
- [x] Subtask 6.3: Call `send_message` with single final report formatted per requirements to parent agent `ea901a34-236e-4531-8d2f-ea9cbadeeda1`.
