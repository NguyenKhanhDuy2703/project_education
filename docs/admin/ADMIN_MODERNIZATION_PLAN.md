---
doc_type: project-plan
title: Kế hoạch Hiện đại hóa Module Admin (Admin Modernization Plan)
project: study-web
version: "1.0"
version_source: planning
authors:
  - {name: DeepCoder, role: Senior Software Engineer & Platform Architect}
scope: MODULE_ADMIN domain types sync, English i18n, Admin Lab Studio V2 alignment, Review Queue enhancement, and test infrastructure setup
date: 2026-10-18
status: completed
language: en
approved_by: ["Nguyen Khanh Duy"]
related_docs:
  - ../10-cleanup-refactoring-and-english-i18n.md
  - ../11-admin-contributor-separation-and-user-crud.md
  - ../13-lab-platform-upgrade-agent-execution-plan.md
  - ../workflows/08-admin-topic-governance.md
---

# Admin Portal Modernization Plan (`MODULE_ADMIN`)

> **Plan Status**: COMPLETED — Managed under Plan-and-Execute Protocol
> **Target Scope**: `MODULE_ADMIN` (Vite + React 19 + TypeScript standalone app on port 5174 / `admin.studyit.dev`)

---

## 1. Document Information & Context

| Attribute | Details |
|---|---|
| **Document Name** | Admin Portal Modernization Plan (`ADMIN_MODERNIZATION_PLAN.md`) |
| **Version** | 1.0 |
| **Architect** | DeepCoder (Platform Architect & Senior Fullstack Engineer) |
| **Scope** | `MODULE_ADMIN` contracts, Studio cleanup, Review Queue, English localization, Vitest test suite |
| **Baseline** | Standalone `MODULE_ADMIN` split from `MODULE_FE` per ADR/separation specs |
| **Target App** | React 19 + Vite 8 + Tailwind CSS v4 + Radix UI + TanStack Query + Zustand/Redux |

---

## 2. Modernization Objectives

1. **Domain Contract Synchronization**:
   - Align `MODULE_ADMIN/src/types/lab.types.ts` with `MODULE_FE` and `MODULE_BE` V2 Lab Contracts (supporting `AutomationExerciseV2`, `BlankDefinition`, `TemplateSegment`, `BlankValidationRule`, `SqlLabConfig`, `QuizLabConfig`).
2. **Complete English Localization & UI Polish**:
   - Eradicate legacy Vietnamese strings from `AdminContentPage.tsx`, `AdminTopicTagsModal.tsx`, `topicTags.service.ts`, and `AdminLabStudioPage.tsx`.
   - Standardize category badges, color presets, tooltips, and action buttons according to `ui-ux-pro-max` guidelines.
3. **Admin Studio Modernization**:
   - Remove obsolete `/contributor/...` route references and assumptions from `AdminLabStudioPage.tsx`.
   - Update default instructions, starter code, and schema placeholders to clean, production-grade English templates.
4. **Review Queue V2 Compatibility**:
   - Enhance `AdminReviewQueue.tsx` with V2 Smart Cloze inspection capabilities in both Technical Specifications and Student Simulation modes.
5. **Testing & Quality Assurance Harness**:
   - Establish Vitest configuration in `MODULE_ADMIN` mirroring `MODULE_FE`.
   - Add automated characterization tests in `MODULE_ADMIN/src/test/` to safeguard Admin hierarchy, topic tag governance, and review queue behaviors.

---

## 3. Two-Tier Task Breakdown & Verification Gates

### Task 1: Domain & Types Synchronization
- [x] **Subtask 1.1**: Update `MODULE_ADMIN/src/types/lab.types.ts` with V2 Smart Cloze (`BlankDefinition`, `TemplateSegment`, `SmartClozeConfig`, `AutomationExerciseV2`), SQL sandbox (`SqlLabConfig`), and Quiz configuration (`QuizLabConfig`, `QuizQuestionV1`).
  - *File*: `MODULE_ADMIN/src/types/lab.types.ts`
  - *Verify*: `npm run build` in `MODULE_ADMIN` compiles with zero type errors.

### Task 2: English Localization & Topic Governance UI Polish
- [x] **Subtask 2.1**: Localize `MODULE_ADMIN/src/services/topicTags.service.ts` default tags to English with professional descriptions.
  - *File*: `MODULE_ADMIN/src/services/topicTags.service.ts`
  - *Verify*: Unit test or runtime tag check returns English titles and descriptions.
- [x] **Subtask 2.2**: Localize `MODULE_ADMIN/src/pages/admin/_components/AdminTopicTagsModal.tsx` and `AdminContentPage.tsx` button labels ("Manage Topic Tags"), headers, dialogs, and color presets to English.
  - *Files*: `MODULE_ADMIN/src/pages/admin/_components/AdminTopicTagsModal.tsx`, `MODULE_ADMIN/src/pages/admin/AdminContentPage.tsx`
  - *Verify*: `npm run build` in `MODULE_ADMIN` passes.

### Task 3: Admin Studio & Review Queue Modernization
- [x] **Subtask 3.1**: Modernize `AdminLabStudioPage.tsx` by purging obsolete `/contributor/content` branches, setting clean English instructions template, and aligning stepper status bar.
  - *File*: `MODULE_ADMIN/src/pages/admin/AdminLabStudioPage.tsx`
  - *Verify*: `npm run build` in `MODULE_ADMIN` passes without reference errors.
- [x] **Subtask 3.2**: Upgrade `AdminReviewQueue.tsx` to detect and display V2 Smart Cloze configuration envelope details (blanks count, framework, managed folds) in technical inspection modal.
  - *File*: `MODULE_ADMIN/src/pages/admin/_components/AdminReviewQueue.tsx`
  - *Verify*: `npm run build` passes; review modal inspects both legacy snippets and V2 envelopes cleanly.

### Task 4: Testing Infrastructure & Characterization Test Suite
- [x] **Subtask 4.1**: Configure Vitest in `MODULE_ADMIN/vite.config.ts` and add test script to `MODULE_ADMIN/package.json`.
  - *Files*: `MODULE_ADMIN/vite.config.ts`, `MODULE_ADMIN/package.json`
  - *Verify*: Test runner executes via vitest without bundling errors.
- [x] **Subtask 4.2**: Implement characterization tests for Topic Tag Service, Admin Topic Hierarchy, and V2 Lab Type compatibility.
  - *Files*: `MODULE_ADMIN/src/test/topic-tags.test.ts`, `MODULE_ADMIN/src/test/admin-hierarchy.test.tsx`, `MODULE_ADMIN/src/test/lab-types.test.ts`
  - *Verify*: Vitest runs and all tests pass 100% green.

### Task 5: Tri-Module End-to-End Build Verification
- [x] **Subtask 5.1**: Run full production builds across all three modules (`MODULE_ADMIN`, `MODULE_FE`, `MODULE_BE`).
  - *Files*: All modified files
  - *Verify*: Exit code 0 on all 3 builds.
