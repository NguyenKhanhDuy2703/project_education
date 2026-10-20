# UI/UX, Localization, Low-Code Playwright, and Dashboard Execution Plan

> **Status**: `COMPLETED`
> **Primary Goal**: Deliver a consistent learning platform with safe Markdown quiz rendering, isolated quiz scrolling, wrapped long titles in curriculum drawer with keyboard navigation, English-first authoring studio, plain-language account copy, and comprehensive E2E Playwright UI testing.
> **Source Document**: `docs/14-ui-ux-localization-dashboard-agent-execution-plan.md`
> **Standards Applied**: `plan-and-execute`, `ui-ux-pro-max`, `Karpathy Guidelines`

---

## Decisions Approved for Execution (Task 0.1)

| Decision | Policy Approved |
|---|---|
| DEC-01 | Remove decorative emoji/format dots; retain functional Lucide icons with accessible labels. |
| DEC-02 | Remove redundant helper sentences from Create Lab cards (`Thiết lập môi trường làm bài, mã nguồn ban đầu, lời giải mẫu và tiêu chuẩn kiểm thử.`), preserving semantic section hierarchy. |
| DEC-03 | Learner FE and contributor studio localized in `MODULE_FE`; Admin remains English-first. |
| DEC-04 | Localize UI chrome, validation, and error states. User-authored lab content stays in authored language. |
| DEC-05 | Language persistence in `localStorage`, default `en`, fallback to English. |
| DEC-06 | Theme support `system | light | dark`, persisted locally. Monaco follows resolved theme. |
| DEC-07 | Quiz solution remains PRO entitlement; clarify discoverability and status. |
| DEC-08 | Teach and generate valid parameterized Playwright syntax from low-code scenarios; run tests in `tests/e2e`. |
| DEC-09 | Admin dashboard uses accessible snapshot charts with existing aggregates. |
| DEC-10 | Responsive 3-column footer with brand, Learn links, and Legal/Support. |

---

## Two-Tier Task Checklist

### Task 0: Resolve Scope and E2E Baseline
- [x] **Subtask 0.1**: Record product decisions DEC-01 through DEC-10 as approved.
  - *Verify*: Decisions locked in plan document with defaults confirmed.
- [x] **Subtask 0.2**: Setup Playwright E2E suite and capture route-level checks and UI verifications.
  - *File*: `tests/e2e/specs/ui-regression-baseline.spec.ts`, `tests/e2e/playwright.config.ts`
  - *Verify*: 6/6 tests passing in Chromium preview (`npx playwright test`).

### Task 1: Introduce Locale and Theme Foundations
- [x] **Subtask 1.1**: Add typed FE translation catalogs and provider (`i18n.tsx`, `en.ts`, `vi.ts`).
  - *File*: `MODULE_FE/src/locales/en.ts`, `MODULE_FE/src/locales/vi.ts`, `MODULE_FE/src/features/preferences/i18n.tsx`, `MODULE_FE/src/test/i18n.test.tsx`
  - *Verify*: 6/6 unit tests passing.
- [x] **Subtask 1.2**: Add resolved theme state and pre-paint bootstrap.
  - *File*: `MODULE_FE/index.html`, `MODULE_FE/src/features/preferences/theme.tsx`, `MODULE_FE/src/main.tsx`, `MODULE_FE/src/test/theme.test.tsx`
  - *Verify*: 4/4 unit tests passing, pre-paint inline script prevents theme flash.
- [x] **Subtask 1.3**: Add accessible language/theme controls in Navbar and settings.
  - *File*: `MODULE_FE/src/components/layout/Navbar.tsx`, `MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`, `MODULE_FE/src/test/navbar-preferences.test.tsx`
  - *Verify*: 3/3 navbar control tests passing, responsive mobile/desktop controls verified.
- [x] **Subtask 1.4**: Synchronize Monaco and code surfaces with resolved theme.
  - *File*: `MODULE_FE/src/features/lab/strategies/AutomationTestWorkspace.tsx`, `MODULE_FE/src/features/lab/strategies/SqlPracticeWorkspace.tsx`, `MODULE_FE/src/features/lab/strategies/legacy/LegacyCodeWorkspace.tsx`, `MODULE_FE/src/test/monaco-theme-sync.test.tsx`
  - *Verify*: Dynamic `vs` / `vs-dark` theme synchronization verified by tests.

### Task 2: Repair Quiz Rendering, Scrolling, and Supporting Tabs
- [x] **Subtask 2.1**: Add safe Markdown fragment rendering for quiz content in `QuizQuestionCard.tsx` (and `MarkdownFragment.tsx`).
  - *File*: `MODULE_FE/src/features/lab/components/MarkdownFragment.tsx`, `MODULE_FE/src/features/lab/strategies/QuizQuestionCard.tsx`
  - *Verify*: Headings (`###`), bold (`**`), inline code, links, images, tables render without raw syntax markers; unsafe HTML/scripts stripped; quote attribute breakout XSS prevented; semantic `<h3>` question headings for screen readers; unit tests pass (8/8 tests in `markdown-fragment.test.tsx`).
- [x] **Subtask 2.2**: Contain quiz scrolling to question pane with `overscroll-contain`.
  - *File*: `MODULE_FE/src/features/lab/strategies/QuizAssignmentWorkspace.tsx`
  - *Verify*: Question list container has `overscroll-contain` and `min-h-0` flex propagation; smooth isolated scrolling verified by E2E test.
- [x] **Subtask 2.3**: Characterize and fix Solution/Submissions discoverability.
  - *File*: `MODULE_FE/src/pages/lab/_components/LabTheoryPane.tsx`
  - *Verify*: Horizontal scroll preservation on narrow/split panes, compact PRO badge, and accessible tab labels.
- [x] **Subtask 2.4**: Add post-submit quiz accessibility regression tests.
  - *File*: `MODULE_FE/src/features/lab/strategies/QuizQuestionCard.tsx`, `MODULE_FE/src/features/lab/strategies/QuizAssignmentWorkspace.tsx`, `MODULE_FE/src/test/quiz-assignment-workspace.test.tsx`
  - *Verify*: Screen reader status announcement (`role="status"`, `aria-live="polite"`), sr-only text for correct/incorrect answers, and double-submit prevention verified by 5 unit tests.

### Task 3: Make Curriculum Drawer Robust for Long Titles
- [x] **Subtask 3.1**: Redesign header and lab item row layout in `CurriculumDrawerSheet.tsx`.
  - *File*: `MODULE_FE/src/pages/lab/_components/CurriculumDrawerSheet.tsx`
  - *Verify*: Multi-line wrapping for long series/lab titles (80-120 chars), badges positioned cleanly without overlay, accessible full title tooltips. Verified in `workspace-responsive-a11y.test.tsx`.
- [x] **Subtask 3.2**: Preserve full title access and keyboard navigation semantics.
  - *File*: `MODULE_FE/src/pages/lab/_components/CurriculumDrawerSheet.tsx`
  - *Verify*: Lab items have `role="button"`, `tabIndex={0}`, keyboard listeners (Enter/Space), and aria-labels. Verified in `workspace-responsive-a11y.test.tsx` and E2E Test 6.

### Task 4: Replace Automation Cheat Sheet with Scenario-Driven Low-Code Playwright Learning
- [x] **Subtask 4.1**: Freeze low-code scenario contract (`lab.types.ts`, json schema).
  - *File*: `MODULE_FE/src/types/lab.types.ts`, `MODULE_FE/src/features/lab/runtime/playwrightScenarioCompiler.ts`, `docs/specs/playwright-parameterized-low-code-v1.md`, `MODULE_FE/src/test/playwright-scenario-compiler.test.ts`
  - *Verify*: 5/5 unit tests passing.
- [x] **Subtask 4.2**: Add Playwright parameterization theory to lesson content.
  - *File*: `MODULE_BE/prisma/seed.ts`, `docs/curriculum/templates-and-gold-samples.md`, `MODULE_FE/src/test/seed-compatibility.test.ts`
  - *Verify*: Canonical lab `auto-syntax-04-playwright-parameterized-testing` seeded, Gold Standard Sample 3 documented with official upstream guide link, 5/5 seed compatibility tests pass.
- [x] **Subtask 4.3**: Build scenario editor/learner interaction using existing cloze engine.
  - *File*: `MODULE_FE/src/features/lab/strategies/AutomationTestWorkspace.tsx`
  - *Verify*: Scenario Guidance tab with compile/run test flow and parameterized syntax guidelines. 9/9 workspace unit tests passing.
- [x] **Subtask 4.4**: Remove Testing CheatSheet UI and dead code.
  - *File*: `MODULE_FE/src/features/lab/components/TestingCheatSheet.tsx`
  - *Verify*: CheatSheet component and dead imports removed, tab renamed to `scenarios`.
- [x] **Subtask 4.5**: Add real Playwright parameterized examples to E2E suite (`parameterized-learning.spec.ts`).
  - *File*: `tests/e2e/fixtures/scenarios.ts`, `tests/e2e/specs/parameterized-learning.spec.ts`
  - *Verify*: 5/5 parameterized tests passing in Chromium preview (`npx playwright test parameterized-learning.spec.ts`).

### Task 5: Improve the Learner Footer
- [x] **Subtask 5.1**: Implement approved responsive footer information architecture.
  - *File*: `MODULE_FE/src/components/layout/Footer.tsx`, `MODULE_FE/src/test/footer.test.tsx`
  - *Verify*: 3 columns (Brand, Learn, Support/Legal) with localized links, dynamic current year, and feedback trigger event. 3/3 unit tests pass.
- [x] **Subtask 5.2**: Remove stale hardcoded year/copy variants.
  - *File*: `MODULE_FE/src/layouts/AuthLayout.tsx`, `MODULE_FE/src/components/layout/Footer.tsx`
  - *Verify*: Replaced fixed 2025 in `AuthLayout.tsx` with dynamic year; clean dynamic copyright formatting across reachable layouts.

### Task 6: Audit and Refine the Existing Learner Dashboard
- [x] **Subtask 6.1**: Lock dashboard API contract with backend tests.
  - *File*: `MODULE_BE/src/modules/labs/labs.service.ts`, `MODULE_BE/src/modules/labs/labs.controller.ts`, `MODULE_BE/test/dashboard-stats.spec.ts`
  - *Verify*: Deterministic totals, deduplicated passes, streak calculation across calendar boundaries, and status filtering verified by 5 unit tests (18/18 BE suite passing).
- [x] **Subtask 6.2**: Refine cards and overall progress visualization.
  - *File*: `MODULE_FE/src/pages/dashboard/views/DashboardOverviewView.tsx`, `MODULE_FE/src/test/dashboard-overview-view.test.tsx`
  - *Verify*: Four KPI cards retained, accessible part-to-whole progress bar with ARIA attributes (`role="progressbar"`), screen-reader ratio text, and i18n support. 3/3 unit tests pass.
- [x] **Subtask 6.3**: Add dashboard route E2E coverage (`learner-dashboard.spec.ts`).
  - *File*: `tests/e2e/specs/learner-dashboard.spec.ts`
  - *Verify*: 3/3 Playwright browser tests passing (KPI assertions, progress bar attributes, mobile non-overflow, and Vietnamese localization).

### Task 7: Make Contributor Create Lab English-First and Remove Redundant Helper Copy
- [x] **Subtask 7.1**: Migrate reachable Studio UI chrome to English-first default per DEC-03.
  - *File*: `MODULE_FE/src/pages/lab/LabStudioPage.tsx`
  - *Verify*: Tabs ("Editor", "Student Preview"), action buttons ("Save Draft", "Run Preflight", "Publish Lab"), sidebar labels, checklists, and template strings converted to English; verified in unit tests and E2E Test 3.
- [x] **Subtask 7.2**: Remove redundant instructional subheadings per DEC-02.
  - *File*: `MODULE_FE/src/pages/lab/LabStudioPage.tsx`
  - *Verify*: Quoted sentence `Thiết lập môi trường làm bài, mã nguồn ban đầu, lời giải mẫu và tiêu chuẩn kiểm thử.` removed; clean semantic section headers retained (`Theory & Learner Guide`, `Exercise Configuration`). All 10 studio tests pass.
- [x] **Subtask 7.3**: Normalize preflight error messages to English plain language.
  - *File*: `MODULE_FE/src/pages/lab/LabStudioPage.tsx`
  - *Verify*: Clear actionable error messages in English for title length, missing schema, missing solution, and missing tests.
- [x] **Subtask 7.4**: Resolve duplicated authoring ownership between learner FE and admin.
  - *File*: `docs/specs/authoring-ownership-resolution.md`, `docs/11-admin-contributor-separation-and-user-crud.md`
  - *Verify*: Canonical authoring established in `MODULE_FE` Contributor Studio (`/user/dashboard/labs/new` and `:labId/edit`), with `MODULE_ADMIN` restricted to oversight and review governance (`/admin/review`, `/admin/content`). Shared schema and preflight contracts frozen.

### Task 8: Localize the Feedback Experience
- [x] **Subtask 8.1**: Move FeedbackWidget copy and suggestions into locale catalogs.
  - *File*: `MODULE_FE/src/components/feedback/FeedbackWidget.tsx`, `MODULE_FE/src/locales/en.ts`, `MODULE_FE/src/locales/vi.ts`, `MODULE_FE/src/test/feedback-widget.test.tsx`
  - *Verify*: 4/4 unit tests pass, switches EN/VN, Playwright E2E test 7 verifies modal open, suggestion append, and machine-readable payload submission.
- [x] **Subtask 8.2**: Preserve useful diagnostic context without technical jargon.
  - *File*: `MODULE_FE/src/components/feedback/FeedbackWidget.tsx`
  - *Verify*: Embeds `[Area: {feature.id}]` header, includes `pageUrl`, no cryptic internal error codes exposed to learners.

### Task 9: Remove Decorative Icons and User-Facing Technical Jargon
- [x] **Subtask 9.1**: Remove decorative emoji/icon data per DEC-01.
  - *File*: `MODULE_FE/src/services/formatBadge.service.ts`, `MODULE_FE/src/pages/lab/SeriesHubPage.tsx`, `MODULE_FE/src/pages/lab/SeriesDetailPage.tsx`, `MODULE_ADMIN/src/pages/admin/_components/SeriesModal.tsx`
  - *Verify*: Removed decorative dots and emojis (`dotClass`, `emoji`), replaced with semantic badges and functional Lucide icons.
- [x] **Subtask 9.2**: Replace implementation jargon in User Profile with plain-language copy.
  - *File*: `MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`
  - *Verify*: Replaced `Authentication: Session Active` with `Signed in`, `JWT Guarded` with `Your session is protected` styled cleanly as `text-xs font-medium text-muted-foreground`. Verified in `user-profile-view.test.tsx` and E2E Test 2.

### Task 10: Add Accessible Admin Dashboard Charts
- [x] **Subtask 10.1**: Define chart questions and data provenance.
  - *File*: `MODULE_ADMIN/src/pages/admin/AdminDashboardPage.tsx`
  - *Verify*: Practice Labs format distribution (SQL, Quiz, Automation) and active subscriptions by tier mapped to existing aggregates without fabricating data.
- [x] **Subtask 10.2**: Implement reusable accessible chart primitives.
  - *File*: `MODULE_ADMIN/src/components/charts/AccessibleBarChart.tsx`, `MODULE_ADMIN/src/test/accessible-bar-chart.test.tsx`
  - *Verify*: Labeled horizontal progress bars, interactive Table View toggle, sr-only fallback table for screen readers, responsive layout. 4/4 unit tests pass.
- [x] **Subtask 10.3**: Integrate charts without duplicating metric cards.
  - *File*: `MODULE_ADMIN/src/pages/admin/AdminDashboardPage.tsx`, `MODULE_ADMIN/src/test/admin-dashboard-page.test.tsx`
  - *Verify*: Integrates 2 snapshot charts alongside existing metric cards, plan breakdown, and audit log. 2/2 tests pass.
- [x] **Subtask 10.4**: Optional historical metrics phase only if DEC-09 requests trends.
  - *Verify*: Scope confirmed as static snapshot charts per DEC-09; historical trend timeseries cleanly deferred to prevent fabricating non-existent timeseries data.

### Task 11: Cross-Cutting Verification & Release Audit
- [x] **Subtask 11.1**: Run full FE, Admin, and BE unit & integration test suites.
  - *Verify*: 47/47 test files (229 tests) passed in `MODULE_FE`; 7/7 test files (46 tests) passed in `MODULE_ADMIN`; 7 test suites (18 tests) passed in `MODULE_BE`. All 293 unit tests passing.
- [x] **Subtask 11.2**: Run production builds across FE, BE, and Admin.
  - *Verify*: `tsc -b && vite build` passed for `MODULE_FE` (exit 0); `tsc -b && vite build` passed for `MODULE_ADMIN` (exit 0); `nest build` passed for `MODULE_BE` (exit 0).
- [x] **Subtask 11.3**: Run full Playwright browser matrix and accessibility audit.
  - *Verify*: 15/15 Playwright E2E browser tests passed across Chromium (baseline regressions, parameterized testing, learner dashboard, mobile responsiveness, and feedback widget).
- [x] **Subtask 11.4**: Sync docs-as-code and audit status.
  - *Verify*: `.agents/scratchpad/14-ui-ux-localization-dashboard.plan.md`, `docs/14-ui-ux-localization-dashboard-agent-execution-plan.md`, and `docs/README.md` synchronized and updated to complete.
