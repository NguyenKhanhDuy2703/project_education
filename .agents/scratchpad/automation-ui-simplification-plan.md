# Automation UI Simplification & Curriculum Phase - Execution Plan & Working Memory

> **Status**: COMPLETED (Priority-adjusted release executed and verified)
> **Primary goal**: Focus the learner-facing product exclusively on PostgreSQL Business Labs and Testing Theory Quiz. Temporarily hide all Automation Testing content (Playwright, legacy API/Jest, JS labs, filters, promo) via a reversible publication/visibility mechanism while keeping admin/contributor access, DB records, and backend security intact.
> **Priority Adjustment**: Workspace redesign (Blocks palette simplification, Live App Preview runner, left-side Lab Guide Sheet) is formally documented as **deferred work** for the future Automation Reactivation release.

---

## Architecture & Priority Decisions

1. **Two Learner-Facing Primary Series**:
   - `PostgreSQL Business Labs` (slug: `postgresql-business-scenarios`)
   - `Testing Theory Quiz` (slug: `testing-theory-scenario-quiz`)
   - `Playwright Automation Labs` (slug: `playwright-low-code-automation`) remains fully preserved in code and DB with updated title, but hidden from ordinary learners.
2. **Reversible Feature Flag & Visibility Mechanism**:
   - In Backend: `FEATURE_AUTOMATION_CONTENT_ENABLED` flag (defaults to `false` for this release).
   - Ordinary learners (unauthenticated or roles `user`, `userPro`) cannot see automation content in public series list (`findAll`), direct series/lab access (`findBySlug`), or saved series (`getSavedSeries`).
   - Admins (`admin`) and Contributors (`contributor`) retain full access to automation series and labs for authoring, testing, and review.
   - Direct access by ordinary learners to a hidden automation series or lab displays a clear "Temporarily unavailable" state with a safe return route to the catalog.
   - Non-destructive: Existing IDs, slugs, submissions, and bookmarks in DB are 100% preserved.
3. **Deferred Workspace UI Enhancements**:
   - Live App Preview, Lab Guide Sheet, Syntax Palette compact blocks, and step-by-step runner animations are documented as deferred work for the future Automation Reactivation phase.
4. **Backend Anti-Leak & Solution Protection**:
   - Audit and enforce that starter plans do not leak graded parameters or satisfy grading rules on page load.
   - Enforce that server grading rules, solutions, and hidden checks remain strictly isolated from ordinary learners.

---

### Task 1: Series Titles & Legacy Content Deactivation
- [x] **Subtask 1.1**: Update the 3 series titles in `MODULE_BE/prisma/v3-curriculum-data.ts` to `PostgreSQL Business Labs`, `Testing Theory Quiz`, and `Playwright Automation Labs` without altering IDs or slugs.
  - *File*: `MODULE_BE/prisma/v3-curriculum-data.ts`
  - *Verify*: `npm --prefix MODULE_BE test` passes series title/preflight checks.
- [x] **Subtask 1.2**: Non-destructively unpublish legacy API/Jest automation series and legacy tracks in `MODULE_BE/prisma/seed.ts` (set status to `draft` / inactive) so they do not appear in public catalog.
  - *File*: `MODULE_BE/prisma/seed.ts`
  - *Verify*: Seed data reflects draft status for legacy series; submissions and records remain intact.

### Task 2: Backend Reversible Feature Flag & Access Control
- [x] **Subtask 2.1**: Implement `isAutomationContentHidden(seriesOrLab, user)` helper and reversible flag in `MODULE_BE/src/modules/series/series.service.ts` and `MODULE_BE/src/modules/labs/labs.service.ts`.
  - *Files*: `MODULE_BE/src/modules/series/series.service.ts`, `MODULE_BE/src/modules/labs/labs.service.ts`
  - *Verify*: Ordinary learners are filtered out from automation series/labs, while Admin and Contributor roles retain full access.
- [x] **Subtask 2.2**: Ensure `getSavedSeries` filters out temporarily hidden automation series for ordinary learners while keeping saved records in the DB.
  - *File*: `MODULE_BE/src/modules/series/series.service.ts`
  - *Verify*: Saved automation series do not appear in learner saved library; bookmark rows are never deleted.
- [x] **Subtask 2.3**: Write backend unit/integration tests verifying learner visibility restriction vs admin/contributor access.
  - *File*: `MODULE_BE/test/automation-visibility.spec.ts`
  - *Verify*: Automated test suite asserts hidden behavior for learners and full access for admins/contributors.

### Task 3: Strengthen Backend Anti-Leak Tests
- [x] **Subtask 3.1**: Add comprehensive anti-leak tests in `MODULE_BE/test/wave0-p0-reproduction.spec.ts` to verify starter plans do not leak graded parameter values and solutions are inaccessible.
  - *File*: `MODULE_BE/test/wave0-p0-reproduction.spec.ts`
  - *Verify*: `npm --prefix MODULE_BE test` runs and verifies all anti-leak assertions.

### Task 4: Frontend Catalog, Navigation, and Marketing Cleanup
- [x] **Subtask 4.1**: Update `SeriesHubPage.tsx` and format services to hide automation filters (`js_worker`, `hybrid`), hide automation series/labs for learners, and align catalog counts and empty states to the 2 primary pillars.
  - *Files*: `MODULE_FE/src/pages/lab/SeriesHubPage.tsx`, `MODULE_FE/src/services/formatBadge.service.ts`
  - *Verify*: Catalog only lists PostgreSQL Business Labs and Testing Theory Quiz; format filters only show relevant formats.
- [x] **Subtask 4.2**: Update `HomePage.tsx` and `RoadmapsPage.tsx` to remove marketing copy and tracks promoting Playwright, Jest, or API automation.
  - *Files*: `MODULE_FE/src/pages/HomePage.tsx`, `MODULE_FE/src/pages/lab/RoadmapsPage.tsx`
  - *Verify*: Homepage and roadmaps focus purely on Database / SQL and QA Theory & Testing Quiz.

### Task 5: Frontend Direct Access Handling ("Temporarily Unavailable" State)
- [x] **Subtask 5.1**: Add a graceful "Temporarily unavailable" state in `SeriesDetailPage.tsx` and `LabWorkspacePage.tsx` when a learner navigates directly to a hidden automation series or lab.
  - *Files*: `MODULE_FE/src/pages/lab/SeriesDetailPage.tsx`, `MODULE_FE/src/pages/lab/LabWorkspacePage.tsx`
  - *Verify*: Displays accessible notification with button to return to the active catalog; accessible touch targets and Lucide icons used.
- [x] **Subtask 5.2**: Add frontend tests verifying the temporary unavailable state and catalog filtering.
  - *Files*: `MODULE_FE/src/test/automation-visibility.test.tsx`
  - *Verify*: Vitest passes all frontend visibility tests.

### Task 6: Final Verification & Regression Audit
- [x] **Subtask 6.1**: Run backend tests (`npm --prefix MODULE_BE test`) and verify 100% pass (90/90 pass).
- [x] **Subtask 6.2**: Run backend build (`npm --prefix MODULE_BE run build`).
- [x] **Subtask 6.3**: Run frontend tests (`npm --prefix MODULE_FE test -- --run`) and verify 100% pass (302/302 pass in 61 suites).
- [x] **Subtask 6.4**: Run frontend lint and build (`npm --prefix MODULE_FE run build`).
- [x] **Subtask 6.5**: Inspect git diff to ensure no unrelated user work was overwritten.

---

## Deferred Work (Automation Reactivation Phase)

The following UI/UX features for the Automation Lab Workspace are formally documented for the future phase:
1. **Blocks Palette Simplification**: Rename "Syntax Palette" to "Blocks", replace helper text with "Add a step", show short learner-friendly labels ("Go to page", "Click", "Fill field", "Check visible"), move technical descriptions to accessible tooltips, preserve 44px touch targets.
2. **Live App Preview**: Rename "Client Scenario Runner" to "Live App Preview", badge "Local simulation", step-by-step playback with 300-500ms visual interval, active element highlighting, green/red step results, timeline synchronization.
3. **Lab Guide Sheet**: Left-to-right drawer with "Task" and "Guide" tabs, data-driven guide content, single compact toolbar trigger.
4. **Workspace Starter Code Decoupling**: Ensure generated `.spec.ts` compiles only boilerplate and learner-added steps.
