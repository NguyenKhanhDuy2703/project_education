# Plan: Temporarily Remove Vietnamese Switching & Lock Full English UI

> **Goal**: Lock platform to 100% English. Remove language switching buttons and Vietnamese option from Navbar and User Profile settings. Keep English catalog as active source of truth.
> **Scope**: `MODULE_FE/src/components/layout/Navbar.tsx`, `MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`, `MODULE_FE/src/features/preferences/i18n.tsx`, and test suites.

---

## Two-Tier Task Checklist

### Task 1: Force Full English in i18n Provider
- [x] **Subtask 1.1**: Update `getInitialLocale` in `i18n.tsx` to strictly return `'en'` and purge `navigator.language` auto-selection of Vietnamese.
  - *File*: `MODULE_FE/src/features/preferences/i18n.tsx`
  - *Verify*: `MODULE_FE/src/test/i18n.test.tsx` passes.

### Task 2: Remove Language Switcher from UI Chrome
- [x] **Subtask 2.1**: Remove desktop and mobile Language Toggle buttons from `Navbar.tsx`.
  - *File*: `MODULE_FE/src/components/layout/Navbar.tsx`
  - *Verify*: Only Theme toggle remains in Navbar.
- [x] **Subtask 2.2**: Remove Language Preference selector from `UserProfileView.tsx`.
  - *File*: `MODULE_FE/src/pages/dashboard/views/UserProfileView.tsx`
  - *Verify*: Theme selector cleanly spans full width.

### Task 3: Align Unit and E2E Test Suites
- [x] **Subtask 3.1**: Update unit tests in `navbar-preferences.test.tsx` and `feedback-widget.test.tsx` to reflect English-only state.
  - *File*: `MODULE_FE/src/test/navbar-preferences.test.tsx`, `MODULE_FE/src/test/feedback-widget.test.tsx`
  - *Verify*: `npm --prefix MODULE_FE test -- --run` passes (all 47 test files).
- [x] **Subtask 3.2**: Update E2E test scenarios in `scenarios.ts`, `parameterized-learning.spec.ts`, and `learner-dashboard.spec.ts`.
  - *File*: `tests/e2e/fixtures/scenarios.ts`, `tests/e2e/specs/parameterized-learning.spec.ts`, `tests/e2e/specs/learner-dashboard.spec.ts`
  - *Verify*: Production build `npm --prefix MODULE_FE run build` and `npm --prefix tests/e2e test` pass (15/15 tests).
