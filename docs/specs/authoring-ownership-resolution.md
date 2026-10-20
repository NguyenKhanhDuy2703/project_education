# Authoring Ownership Resolution (Task 7 / Subtask 7.4)

> **Document Version**: 1.0  
> **Date**: 2026-10-19  
> **Governing ADR**: `docs/11-admin-contributor-separation-and-user-crud.md` (PLAN-ROLE-SEPARATION-02)  
> **Status**: `APPROVED & FROZEN`

---

## 1. Canonical Authoring Flow

1. **Contributor Studio in `MODULE_FE`** is the **sole canonical authoring flow** for creating and editing exercises (`PracticeLabV1`, `AutomationExerciseV2`, `SqlLabConfig`, `QuizLabConfig`).
   - Routes:
     - `/user/dashboard/labs/new` (Create Lab)
     - `/user/dashboard/labs/:labId/edit` (Edit Lab)
     - Legacy `/contributor/labs/:labId/edit` redirects to `/user/dashboard/labs/:labId/edit`.
   - Permissions: Requires `role === 'contributor' || role === 'admin'`.
   - Lifecycle: `draft` -> `submitted` (Review Queue).

2. **Admin Panel in `MODULE_ADMIN`** is responsible for **Oversight and Review Governance**, NOT content creation:
   - Routes:
     - `/admin/review` (Review Queue: Approve, Request Changes, Reject)
     - `/admin/content` (Catalog Oversight: Publish, Unpublish, Archive)
   - `AdminLabStudioPage.tsx` in `MODULE_ADMIN` acts strictly as an inspector / emergency maintenance surface for administrators reviewing submitted labs.

---

## 2. Parity & Contract Synchronization

- **Shared Schema**: Both applications conform to `docs/specs/playwright-parameterized-low-code-v1.md` and `docs/specs/lab-markdown-v1.md`.
- **Preflight & Grading**: Preflight logic is enforced by the backend (`MODULE_BE/src/modules/labs/labs.service.ts`) ensuring neither client can bypass syntax, schema, solution, or test requirements.
- **Language**: English-first UI chrome across all authoring surfaces (DEC-03).
