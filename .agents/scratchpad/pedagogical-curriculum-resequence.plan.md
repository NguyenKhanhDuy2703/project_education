# Pedagogical Curriculum Resequencing — Analysis & Execution Plan

> **Status:** IN_PROGRESS
> **Execution Started:** 2026-10-24
> **Audit Verified:** Confirmed P0 findings:
>   - 3 legacy automation labs (`auto-syntax-01`, `02`, `04`) pass unchanged.
>   - Legacy `js_worker` submission accepts client-supplied status when objective JSON parsing fails.
>   - All 8 V3 automation labs in `v3-curriculum-data.ts` lack `gradingRules`/`gradingKey`.
>   - Older SQL starters contain answer-leaking TODO comments.
> **Created:** 2026-10-24
> **Scope:** Learner curriculum sequencing, theory/quiz/practice patterns, Playwright automation learning pattern, and Series Catalog UX.
> **Execution gate:** Do not change production code, schema, seed data, or learner progress until the user explicitly says to execute this plan.

## 1. Outcome

Restructure StudyWeb from three activity-siloed collections into coherent learning paths where each concept is introduced, checked, practiced, and consolidated in a predictable sequence:

```text
Concept cycle
Theory (8–12 min)
  → Inline retrieval check (1–2 questions)
  → Short quiz (3–5 questions, low stakes)
  → Guided practice
  → Independent practice

Module close
  → Module checkpoint (8–12 questions)
  → Targeted remediation links
  → Transfer lab/capstone when applicable
```

Target learning-time distribution per module:

| Activity | Target share | Purpose |
|---|---:|---|
| Theory and worked examples | 20–25% | Build a compact mental model |
| Retrieval checks and quizzes | 10–15% | Expose misconceptions early |
| Guided and independent practice | 50–60% | Make the learner perform the skill |
| Reflection, review, remediation | 10–15% | Consolidate and recover from errors |

The sequence is intentionally practice-heavy. Quiz units are not treated as a standalone content category unless the product later introduces an explicit exam/certification mode.

## 2. Evidence from the current repository

### 2.1 Current curriculum is separated by engine instead of learning objective

- `MODULE_BE/prisma/v3-curriculum-data.ts` defines three independent V3 series: eight SQL labs, eight five-question quiz labs, and eight Playwright labs.
- There are no `markdown_only` theory units in this V3 source.
- `MODULE_BE/test/v3-curriculum-preflight.spec.ts` enforces the exact `8 SQL + 8 Quiz + 8 Automation` split. That test currently protects the old organization rather than the desired pedagogy.
- Four sections exist per series, but section membership only groups homogeneous activities; it does not guarantee a theory → check → practice → checkpoint flow.

**Assessment:** The user's concern is valid. Content exists, but the learning journey is fragmented because the catalog and seed are organized around render/runtime type rather than skill acquisition.

### 2.2 A theory-only presentation pattern already exists

The technical foundation is present:

- Prisma has `LearningUnitType.theory` and `LearningUnitProgress`.
- `markdown_only` is registered to `TheoryLessonView` in the frontend workspace registry.
- `TheoryLessonView` already provides:
  - focused reading layout;
  - estimated reading time;
  - reading progress bar;
  - desktop table of contents;
  - embedded retryable formative questions;
  - explicit completion action;
  - progress start, position-save, and complete API calls.
- The backend exposes start, position, get-progress, and complete endpoints.

Current gaps:

- The V3 curriculum does not seed this pattern, so users do not benefit from it in the main paths.
- The view saves scroll position and formative answers but does not restore them into the component state on load.
- Completion is primarily click-based and the UI continues through a fallback path even when the dedicated progress request fails; completion semantics must be made authoritative and observable.
- The reading view has no explicit learning objectives, prerequisite/review links, key-term summary, or “next practice” bridge as first-class metadata.
- Code blocks do not expose an obvious copy action in the theory renderer.
- Mobile navigation for long lessons needs a compact outline/sheet rather than the desktop-only outline.
- Authoring validation checks content existence, but not lesson structure, objective alignment, reading length, or the quality of formative feedback.

**Decision:** Reuse and strengthen the existing theory pattern. Do not build another theory renderer.

### 2.3 Quiz engine exists, but there is only one assessment policy

- `QuizLabConfig` currently supports questions, `allowReviewBeforeSubmit`, and `passPercentage`.
- Server-authoritative grading and answer-key stripping are already present.
- The model does not distinguish a short lesson check from an end-of-module checkpoint.
- Existing V3 quiz content is presented as a separate eight-quiz certification-style series.

**Decision:** Add typed assessment intent rather than cloning quiz workspaces:

```text
assessmentScope: lesson_check | module_checkpoint
stakes: formative | graded
attemptPolicy: unlimited | limited
feedbackPolicy: immediate | after_submit
remediationUnitIds: string[]
```

Recommended policy:

| Type | Questions | Pass behavior | Feedback |
|---|---:|---|---|
| Inline theory check | 1–2 | Never blocks progress | Immediate explanation |
| Lesson check | 3–5 | Unlimited retry; low stakes | Immediate after submit |
| Module checkpoint | 8–12 | 75–80%; recorded | Summary plus concept-level remediation |

### 2.4 Automation has a good difficulty ladder, but the exercises over-scaffold

Positive foundation:

- The eight Playwright units progress through 3 Block Builder, 3 Smart Cloze, 1 Guided Code, and 1 Full Code activity.
- The V3 workspace has a deterministic client scenario runner, generated Playwright code, responsive layouts, and backend validation.

Problems to correct:

- Every automation unit has a populated `starterPlan`; in early units, the starter plan already contains the blocks requested by public checks. Learners can often run/submit before constructing the solution.
- Theory is embedded in task instructions instead of being taught before practice and revisited after mistakes.
- The simultaneous palette/editor/preview/code presentation can overload beginners; generated code competes with the task rather than appearing at the teachable moment.
- Public checks mostly report structural success/failure. Feedback is not yet classified by misconception such as locator choice, action sequence, assertion intent, test data, or synchronization.
- The simulator teaches Playwright concepts but is not a real browser execution environment. The UI and content must clearly explain what is simulated and what exported Playwright code still needs to prove.
- There is no module-level retrieval checkpoint connecting QA theory to automation choices.

**Decision:** Keep the runtime, change the instructional choreography and scaffolding.

### 2.5 Critical audit: practice units can be completed without learner work

A source-level starter audit confirms the reported issue.

#### Legacy JavaScript automation

The unchanged starter was executed against its existing test script:

| Lab | Starter equals solution after comments/whitespace | Starter passes unchanged |
|---|---:|---:|
| `auto-syntax-01-describe-test-structure` | Yes | Yes |
| `auto-syntax-02-core-matchers-primitive-vs-deep` | Yes | Yes |
| `auto-syntax-03-api-response-schema-assert` | No | No |
| `auto-syntax-04-playwright-parameterized-testing` | Yes | Yes |

This means three of four legacy automation labs are demonstrations incorrectly published as practice labs. A learner only needs to press Run.

There is also a grading trust defect: `LabsService.submit()` initializes the authoritative result from the client payload. For legacy `js_worker` labs whose objective is plain text/non-V3 JSON, parsing fails and the service retains the client-provided `status`. Consequently, a client can claim `passed` without a server-authoritative evaluation.

#### Automation V3

- All eight V3 labs ship with non-empty starter plans of 2–8 steps.
- A static comparison shows 8/8 starter plans already contain every block type referenced by their public checks.
- Early block-builder labs include the exact routes, locators, values, actions, and assertions requested by the task.
- The source configs contain no `gradingRules` or `gradingKey`. Running the server validator directly against each untouched starter returns “Lab has no authoritative grading rules or grading key configured.”
- The seed still publishes these units directly, bypassing the release validator that would reject them.

The result is internally inconsistent: the client runner can treat the supplied plan as a successful exercise, while the server has no complete authoritative rubric for the same published unit.

#### SQL

- The eight SQL V3 starters are minimal (`SELECT`/`WITH` beginnings) and are not equal to the reference solutions. This is the healthiest current starter pattern.
- The older seeded SQL collection does not generally pass unchanged, but 11 of 12 non-empty practice starters contain `TODO` comments that state the literal missing answer, such as `DISTINCT`, `Country = 'Mexico'`, `Price DESC`, or complete join/aggregation clauses.
- This is answer leakage rather than zero-action completion: the learner mainly copies/removes comments instead of recalling or designing the query.

#### Root cause

The platform currently validates that starter content, a solution, and tests exist, but does not validate the essential negative property of an exercise: **the untouched starter must fail**. It also lacks a measurable distance between starter and solution, and it does not require a learner-authored delta before completion.

**Severity:** P0 for legacy client-trusted completion and pre-solved automation; P1 for V3 grading inconsistency and SQL answer-revealing TODOs.

### 2.6 Starter-content policy

Classify starter material explicitly:

| Level | Meaning | Allowed use |
|---|---|---|
| S0 — Environment only | Imports, fixture setup, function signature, locked navigation | Any practice unit |
| S1 — Guided scaffold | Structure plus neutral placeholders that do not state the answer | Guided practice |
| S2 — Answer-revealing | TODO/comment contains the exact expression, selector, value, or sequence | Worked example only; forbidden in graded practice |
| S3 — Pre-solved | Unchanged starter passes public or hidden evaluation | Forbidden in every practice/checkpoint unit |

Mandatory invariants for practice units:

1. Unchanged starter must fail at least one authoritative required check.
2. Whitespace/comments-only edits must not convert failure into pass.
3. The learner must contribute a minimum semantic delta appropriate to the mode.
4. Public hints describe the concept or failure, not the exact accepted answer.
5. Reference solutions and hidden rules never appear in learner payloads.
6. Worked examples that intentionally contain complete code must be typed as theory/example and cannot generate practice completion.

### 2.7 Catalog is inventory-first, not path-first

- The hub provides search, topic/plan/difficulty/format filters, sorting, and Series/Labs tabs.
- The detail page groups units by section and shows type, time, access, and completion state.
- It does not foreground learning outcomes, prerequisites, theory/practice/checkpoint mix, module mastery, or a single recommended next action.
- Numbering resets inside each section and the rows read as an inventory rather than a connected path.
- Format filtering becomes less meaningful once a series deliberately mixes theory, quizzes, SQL, and automation.

**Decision:** Preserve discovery filters, but make the series card and detail view communicate a guided learning path.

### 2.8 Plan-state inconsistency must be corrected

`.agents/scratchpad/learning-series-pattern-redesign.plan.md` marks curriculum conversion tasks as completed, including conversion to theory/checkpoint units. Current seed data and preflight tests still implement the separated 8/8/8 structure.

This new plan treats those content-migration checkboxes as stale evidence, not proof of completion. During execution, the old plan must be annotated as superseded/partially implemented after code and seeded-data verification—not silently rewritten.

## 3. Target curriculum architecture

### 3.1 Shared module grammar

Every published module must satisfy these invariants:

1. Starts with a measurable outcome: “After this module, the learner can…”
2. Teaches a concept before grading or requiring it.
3. Includes at least one meaningful learner action, not only reading or selecting answers.
4. Uses support fading: worked example → guided practice → independent practice.
5. Ends with a checkpoint mapped to module objectives.
6. Failed checkpoint concepts link back to exact lessons/practices.
7. The next recommended unit is deterministic and visible.

### 3.2 PostgreSQL path

Keep the eight valuable business scenarios, reorganized into four modules:

```text
Module 1 Query foundations
  Theory: relational query mental model
  Inline check
  Guided lab: failed orders
  Independent lab: customer segmentation
  Module checkpoint

Module 2 Aggregation and reconciliation
  Theory: GROUP BY, aggregates, HAVING
  Inline check
  Guided lab: duplicate accounts
  Independent lab: revenue reconciliation
  Module checkpoint

Module 3 Missing data and business rules
  Theory: JOIN choice, NULL, CASE
  Inline check
  Guided lab: forgotten customers/products
  Independent lab: inventory alerts
  Module checkpoint

Module 4 Time and analytical SQL
  Theory: CTE, intervals, window functions
  Inline check
  Guided lab: SLA tracking
  Independent lab/capstone: category ranking
  Module checkpoint
```

Do not duplicate long SQL explanations inside each lab. Labs retain concise task context, schema, constraints, hints, and a link back to the concept lesson.

### 3.3 QA Foundations path

Rename/reposition the quiz-only collection as a mixed `QA Foundations` learning path:

- Module 1: testing principles + requirement/static review.
- Module 2: test levels/types + defect lifecycle/severity/priority.
- Module 3: equivalence partitioning + boundary value analysis.
- Module 4: decision tables + state transitions/RBAC/status codes.

Each module contains:

```text
Theory lesson A → inline check
Theory lesson B → short lesson check
Scenario workshop (classify/design/review a test artifact)
Module checkpoint
```

Reuse the existing 40 questions only after item analysis. Questions should be redistributed by objective, not copied wholesale. Author missing scenario-practice and checkpoint items where coverage is weak. A future certification/mock-exam collection may aggregate questions, but it must be visibly labeled as assessment-only and must not replace the teaching path.

### 3.4 Playwright Automation path

Keep four modules and the eight existing lab topics, but pair instruction and practice:

| Module | Teach | Guided practice | Independent practice | Checkpoint |
|---|---|---|---|---|
| 1 Foundations | Test anatomy, navigation, resilient locators | Block Builder: structure/goto | Block Builder: locator strategy | Locator and test-structure quiz |
| 2 Interactions | Forms, web-first assertions, waiting | Block Builder: form actions | Smart Cloze: assertions | Action/assertion checkpoint |
| 3 Data and flows | Positive/negative cases, boundaries, parameterization | Smart Cloze: authentication | Smart Cloze: boundary matrix | Test-design checkpoint |
| 4 Maintainable E2E | RBAC, isolation, readable tests, end-to-end risk | Guided Code: RBAC | Full Code capstone: checkout | Final module checkpoint + reflection |

Scaffolding policy:

- Block Builder: provide locked setup only; learner adds the assessed action/assertion blocks.
- Smart Cloze: preserve test structure but blank meaningful locator/action/assertion parameters.
- Guided Code: provide imports/fixtures and TODO boundaries, not the solution path.
- Full Code: provide scenario, fixture contract, and acceptance criteria only.
- A starter plan must never already satisfy every public and hidden rule.

## 4. Execution plan

### Task 0 — Freeze the pedagogical contract and reconcile plan state

- [x] Record this plan as the active source of truth for curriculum resequencing.
- [x] Add a short supersession note to the older learning-series plan after verifying each claimed completion against code and seed data.
- [x] Produce an inventory mapping every current unit ID/slug to its target module, objective, and disposition: keep, rewrite, split, or retire.
  - *Inventory summary:*
    - 24 Core V3 Labs (`sql-v3-01..08`, `quiz-v3-01..08`, `auto-v3-01..08`) retain stable IDs/slugs.
    - 4 Legacy Automation Labs (`auto-syntax-01..04`) retained with stable slugs; P0 repair starters.
    - 12 Legacy SQL Labs (`w3schools-sql-01..10`, `sql-ecom-*`) retained as practice library; clean answer-leaking comments.
    - 2 Legacy ISTQB Quizzes (`istqb-01..02`) retained with stable slugs.
- [x] Freeze stable IDs/slugs for content that already has progress/submissions; define aliases or migration mappings for renamed content.
  - *Freezing Rule:* All existing slugs remain primary lookup keys. Series `testing-theory-scenario-quiz` retains its ID and slug while UI title becomes `QA Foundations: Principles, Design & Test Engineering`.
- [x] Confirm product decisions before schema/content work:
  - QA quiz-only series becomes `QA Foundations` mixed path (recommended).
  - Existing learner progress and submissions are preserved.
  - Inline formative checks do not affect scores.
  - Module checkpoints use an initial 80% pass threshold unless item difficulty data later justifies another threshold.
- [x] Freeze the starter policy: every practice/checkpoint starter must fail unchanged; complete worked code belongs to a non-completable example/theory unit.
- [x] Mark legacy client-trusted automation completion and pre-solved starters as P0 release blockers.

**Gate 0:** Approved curriculum map and no unresolved ID/progress migration risk. (PASSED)

### Task 1 — Extend the learning-unit metadata contract

- [ ] Add typed metadata for `learningObjectives`, `prerequisiteUnitIds`, `assessmentScope`, `stakes`, `attemptPolicy`, `feedbackPolicy`, `remediationUnitIds`, and `supportLevel`.
- [ ] Decide which fields require indexed Prisma columns and which belong in the versioned objective/config envelope. Prefer typed config for presentation metadata; add schema columns only when catalog queries or integrity constraints require them.
- [ ] Version quiz/theory configs while preserving V1 decoding and existing published content.
- [ ] Return module progress, objective coverage, and deterministic `nextUnit` from the series API.
- [ ] Add authoring and release validators for the shared module invariants.

**Verification:** codec round trips, V1 backward compatibility, DTO validation, API contract tests, and zero answer-key leakage.

### Task 2 — Strengthen the theory lesson pattern

- [ ] Restore server-saved scroll position and formative answers on entry; prevent the initial zero-state debounce from overwriting saved state.
- [ ] Make completion server-authoritative and surface save/complete errors; remove false local success on failed progress persistence.
- [ ] Require a configurable completion rule: minimum reading progress plus attempted formative checks, with an accessible override for non-scroll readers.
- [ ] Add first-class lesson header fields: objectives, prerequisites, estimated time, key terms, and “practice this next”.
- [ ] Add copy controls for fenced code, accessible callouts, and a mobile outline/sheet.
- [ ] Add end-of-lesson summary and direct CTA to the short quiz or next practice unit.
- [ ] Keep the route lightweight: theory must not load PGlite or automation runtime bundles.

**Verification:** restore/resume tests, failed-network behavior, keyboard navigation, screen-reader semantics, long-lesson mobile test, and lazy-bundle regression.

### Task 3 — Split quiz behavior into lesson checks and module checkpoints

- [ ] Extend one quiz workspace with scope-driven presentation instead of duplicating components.
- [ ] Lesson check UX: 3–5 questions, low-stakes language, unlimited retry, concise immediate explanations, no celebratory “certification” framing.
- [ ] Module checkpoint UX: 8–12 questions, server-authoritative grading, concept-level result breakdown, attempt history, and remediation links.
- [ ] Map every question to one or more objective IDs and validate balanced coverage before publish.
- [ ] Prevent review-before-submit and answer leakage for graded checkpoints; keep formative inline checks intentionally immediate.
- [ ] Define whether completion requires pass or attempt by scope and make catalog progress consistent with that policy.

**Verification:** scoring boundaries, unanswered questions, retry policy, sanitized learner payload, objective breakdown, and remediation navigation.

### Task 4 — Rebuild curriculum order and preserve learner data

- [ ] Generate the approved module/sequence manifest before editing seed content.
- [ ] Add theory and checkpoint units using stable deterministic IDs.
- [ ] Reassign current SQL, QA, and Automation units to their pedagogical modules and order indices.
- [ ] Rewrite duplicated lab theory into focused prerequisites/task context; preserve unique business scenarios, fixtures, datasets, solutions, and grading keys.
- [ ] Redistribute and review existing QA quiz questions; add missing practice/checkpoint items.
- [ ] Implement idempotent upsert and an explicit old-ID → new-ID mapping where any split/merge is unavoidable.
- [ ] Preserve progress, submissions, access entitlements, and free/PRO semantics. Never delete referenced units during migration; archive superseded items only after mapping.
- [ ] Replace exact `8/8/8` preflight assertions with module-invariant and learning-flow assertions.

**Gate 4:** Dry-run migration report shows no orphaned progress/submissions and every module passes sequence validation.

### Task 5 — Improve the Playwright automation learning pattern

Primary implementation targets:

- `MODULE_BE/prisma/seed.ts`
- `MODULE_BE/prisma/v3-curriculum-data.ts`
- `MODULE_BE/src/modules/labs/labs.service.ts`
- `MODULE_BE/src/modules/labs/automation-v3-validator.ts`
- `MODULE_ADMIN/src/pages/admin/AdminLabStudioPage.tsx`
- `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx`
- `MODULE_FE/src/features/lab/runtime/v3/*`
- Backend/frontend curriculum, security, and workspace tests

- [ ] Add a machine-readable starter audit for every Automation V1/V2/V3 unit: run the untouched starter, compare normalized starter/solution, inspect public/hidden rule coverage, and produce a per-slug report.
- [ ] Rewrite the three confirmed pre-solved legacy automation labs so the starter fails unchanged and the learner must implement the target behavior.
- [ ] Audit each V3 starter plan against public/hidden rules and remove pre-solved steps. Keep only locked environment/setup steps; assessed actions and assertions must be learner-created or meaningfully completed.
- [ ] Add authoritative `gradingRules`/`gradingKey` to every published V3 lab and ensure the seed cannot bypass the same release validation used by authoring.
- [ ] Remove the legacy backend fallback that trusts client `status`; unsupported/ungradable automation submissions must fail closed.
- [ ] Require a semantic learner delta before submission:
  - Block Builder: add or correctly configure assessed blocks.
  - Smart Cloze: fill required parameters/blanks.
  - Guided Code: modify designated editable regions.
  - Full Code: submit a parsed plan that satisfies hidden rules and differs meaningfully from the starter.
- [ ] Introduce a visible learning loop: `Observe → Predict → Build → Run → Explain → Reflect`.
- [ ] Reveal generated Playwright code progressively: after a successful visual run for beginners, side-by-side for cloze, primary editor for guided/full code.
- [ ] Add focus modes so one primary workspace dominates; keep Preview/Result available without forcing three simultaneous panes.
- [ ] Classify feedback by misconception and provide an actionable next hint without exposing the solution.
- [ ] Add deterministic reset and “what changed” state diff between steps.
- [ ] Label the client runner accurately as a deterministic simulator and state the boundary between simulated checks and real Playwright/browser execution.
- [ ] Add per-module checkpoints that connect QA concepts to automation decisions.
- [ ] Validate scaffold fading across the 3/3/1/1 mode ladder with a content rubric, not only config presence.

**Verification:** untouched, comments-only, whitespace-only, and client-forged-pass submissions all fail; each mode requires the intended semantic learner action; valid learner solutions pass; generated code compiles; reset remains deterministic; keyboard/mobile flows pass.

### Task 6 — Make Series Catalog learning-path-first

- [ ] Separate `Learning Paths` from an optional `Practice Library`; do not flatten mixed paths into a generic lab list by default.
- [ ] On series cards, show outcomes, prerequisite level, module count, estimated effort, theory/practice/checkpoint mix, and current progress.
- [ ] Change format filters into skill/goal filters for learning paths; retain engine/format filters in the practice library.
- [ ] On series detail, render a connected module path with global sequence numbers, unit-type labels, prerequisite state, module mastery, and one primary `Continue learning` action.
- [ ] Explain why a unit is next and where a failed checkpoint sends the learner.
- [ ] Keep locked units visible enough to understand the full path without allowing access bypass.
- [ ] Apply progressive disclosure, stable layout, semantic headings, breadcrumbs for deep navigation, keyboard operation, and reduced-motion support.

**Verification:** discovery-to-first-unit journey, resume journey, failed-checkpoint remediation, free-to-PRO boundary, empty/loading/error states, and 375/768/1024/1440px layouts.

### Task 7 — Upgrade authoring and release validation

- [ ] Make module outcome and unit role mandatory before content-specific fields.
- [ ] Provide reusable templates for theory, lesson check, scenario practice, SQL lab, automation lab, and module checkpoint.
- [ ] Preview the exact learner renderer from authoring; avoid duplicate mock previews.
- [ ] Add module-level diagnostics: missing theory, no meaningful practice, checkpoint before instruction, duplicated objective, pre-solved starter, missing remediation, and excessive reading length.
- [ ] Add a mandatory negative preflight: execute the starter using the same authoritative grader and block publication if it passes.
- [ ] Add starter/solution similarity diagnostics that ignore comments and whitespace; exact or near-exact semantic matches are release blockers for practice units.
- [ ] Reject `TODO` text that includes exact expected expressions/values in graded practice unless the unit is explicitly configured as a constrained cloze with those tokens hidden from the learner.
- [ ] Run release validation from seed/sync pipelines as well as the Admin UI so direct upserts cannot publish invalid labs.
- [ ] Add a curriculum ordering editor with safe reordering and explicit dependency warnings.
- [ ] Block publication when module invariants fail; allow draft saving with clear diagnostics.

**Verification:** admin type tests, publish validator tests, learner/admin contract parity, and role/authorization regression.

### Task 8 — Automated quality gates and rollout

- [ ] Unit tests: config codecs, type inference, sequence validator, scoring policy, progress restoration, starter-plan difficulty rubric, normalized similarity detection, and semantic-delta checks.
- [ ] Integration tests: series API order/next-unit, authoritative completion, progress migration, and answer-key security.
- [ ] Add a repository-wide `practice-starter-preflight` that loads every seeded/published practice unit and proves:
  - untouched starter fails;
  - client-forged `status: passed` fails;
  - reference solution passes;
  - grading rules exist and remain private;
  - the starter does not disclose the reference answer.
- [ ] E2E journeys:
  - theory → lesson check → guided lab;
  - full module → checkpoint → remediation → retry;
  - Automation block → cloze → guided/full code;
  - returning learner resume;
  - free learner reaches a PRO boundary.
- [ ] Accessibility tests: keyboard-only, focus order, semantic outline, `aria-live` feedback, contrast, reduced motion, and touch targets.
- [ ] Performance tests: theory/catalog bundles remain lightweight; heavy runtimes lazy-load by unit type.
- [ ] Run backend, frontend, admin, and E2E suites plus production builds.
- [ ] Roll out behind a curriculum version/feature flag, monitor completion/drop-off by unit role, then retire the legacy ordering only after validation.

**Gate 8:** All suites green, migration rehearsal clean, accessibility blockers at zero, and rollback path documented.

### Task 9 — Documentation and handoff

- [ ] Update the curriculum architecture doc with the shared module grammar and assessment policy.
- [ ] Update learner workflow documentation for discovery, lesson, quiz, practice, remediation, and module completion.
- [ ] Update authoring guidance and sample module templates.
- [ ] Record migration mapping, rollout/rollback steps, and known limitations.
- [ ] Update scratchpad checkboxes only after evidence is attached to each completed item.

## 5. Recommended delivery order

```text
Wave 0: Task 0 + P0 parts of Task 5 and Task 8
        (fail closed, starter-must-fail preflight, repair pre-solved labs)
Wave 1: Task 1
Wave 2: Tasks 2, 3, and remaining Task 5 work on the frozen contract
Wave 3: Task 4 curriculum migration + Task 6 catalog
Wave 4: Task 7 authoring + Task 8 full verification
Wave 5: Task 9 documentation and legacy retirement
```

Do not begin bulk content rewriting before Task 1 is frozen. Do not change seeded IDs/order before Task 0 produces a migration map.

## 6. Definition of done

- Every published module visibly follows theory → short check → meaningful practice → module checkpoint.
- At least 50% of learner time in the core paths is active practice.
- No main V3 learning path is a quiz-only or lab-only collection.
- Theory resume and completion are reliable and server-authoritative.
- Short checks and module checkpoints have distinct policies and UI language.
- No untouched automation starter solution can pass its lab.
- Every practice starter fails the production-equivalent authoritative grader before content can be published.
- No automation result trusts client-provided pass/fail status.
- Seed and sync pipelines cannot bypass release validation.
- Exact-answer TODO comments are absent from graded SQL/automation practice.
- Automation support fades deliberately from blocks to full code.
- Catalog communicates outcomes and next actions, not only content inventory.
- Existing progress, submissions, access rules, and stable links survive migration.
- Module-invariant, security, accessibility, responsive, performance, and end-to-end gates pass.
- Old scratchpad claims are reconciled with repository evidence.

## 7. Explicit non-goals for the first execution cycle

- Building a real remote Playwright browser farm.
- Creating a high-stakes certification/proctoring system.
- Deleting historical submissions or learner progress.
- Replacing the existing SQL or Automation engines.
- Adding social/community, badges, or gamification before the core learning flow is coherent.

## 8. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-10-24 | Reuse `TheoryLessonView` | The first-class theory renderer and progress model already exist; adoption and correctness are the gaps. |
| 2026-10-24 | Keep one quiz workspace with typed assessment scope | Avoids duplicate UI while allowing different pedagogical policies. |
| 2026-10-24 | Convert quiz-only content into a mixed QA Foundations path | Preserves valuable question content while fixing the disconnected learning journey. |
| 2026-10-24 | Preserve the Automation V3 runtime and redesign scaffolding | The technical ladder is valuable; starter content and feedback choreography are the main defects. |
| 2026-10-24 | Treat old completed curriculum-migration checkboxes as stale | Current seed/preflight evidence contradicts those completion claims. |
