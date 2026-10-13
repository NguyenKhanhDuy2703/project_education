# DOC-10: Hardcode Cleanup, Data Loading Resolution & Full English Localization

- **Status**: Completed & Verified
- **Date**: 2026-10-13
- **Author**: Antigravity Lead Pair-Programmer & Architect
- **Target Components**: `MODULE_FE` & `MODULE_BE`

---

## 1. Objectives & Scope

1. **Hardcode Extraction**:
   - Environment parameters moved to `.env` / `.env.example` (`VITE_API_URL`, `VITE_APP_TITLE`, `VITE_API_TIMEOUT_MS`, `VITE_USE_MOCK`).
   - Categorical and domain constants moved to typed constants:
     - [`src/constants/content.constants.ts`](../MODULE_FE/src/constants/content.constants.ts)
     - [`src/constants/ui.constants.ts`](../MODULE_FE/src/constants/ui.constants.ts)
2. **Redundant UI Cleanup**:
   - Removed obsolete `CONTENT TOOLS -> Labs & Blog` menu item from [`AdminSidebar.tsx`](../MODULE_FE/src/pages/admin/_components/AdminSidebar.tsx).
   - Replaced lengthy Vietnamese description banners with clean dynamic breadcrumb navigation (`Home / Admin Studio / Content Studio`).
   - Eradicated all `🧪` emojis from UI components, mock stores, and seed files.
3. **Data Loading Failure Resolution**:
   - Fixed `LỖI TẢI DỮ LIỆU: Không thể tải bài lab này` when clicking from series to lab.
   - Root cause: Backend endpoints were expecting strict slugs, but navigation in certain views passed IDs or unseeded slugs.
   - Resolution: `LabsService.findBySlug()` and `SeriesService.findBySlug()` now query flexibly with `OR: [{ slug: slugOrId }, { id: slugOrId }]`. Frontend links now target `/labs/${lab.slug || lab.id}` with fallback mock resilience.
4. **Comprehensive English Localization (100%)**:
   - Fully localized navigation, student catalog, lab workspace, code runner panels, admin studio, review queue, IAM group managers, modals, badges, toasts, and mock data.

---

## 2. Verification & Validation Metrics

| Test / Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Production Build** | `npm run build` in `MODULE_FE` | **Code 0 (PASS)** | 2205 modules compiled, bundle emitted |
| **Backend NestJS Build** | `npm run build` in `MODULE_BE` | **Code 0 (PASS)** | Clean TypeScript compilation |
| **Backend IAM & Lifecycle Test Suite** | `npx tsx test/backend-e2e-matrix.test.ts` | **25/25 PASS** | Anti-bypass, review queue, group union |
| **Emoji Eradication** | `grep "🧪"` across workspace | **0 matches** | No test tube emojis remaining |
