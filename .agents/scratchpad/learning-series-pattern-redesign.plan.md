# Learning Series Pattern Redesign — Execution Plan & Working Memory

> **Status**: SUPERSEDED FOR CURRICULUM RESEQUENCING & ZERO-ACTION REPAIRS
> **Note (2026-10-24)**: Pedagogical curriculum resequencing, theory/checkpoint integration, and zero-action starter repairs are superseded by the active plan: `.agents/scratchpad/pedagogical-curriculum-resequence.plan.md`. The historical infrastructure deliverables from this document (unitType schema, section model, TheoryLessonView component, base V3 runtime) remain in place.
> **Date**: 2026-10-23
> **Goal**: Redesign the learning-series architecture around four pedagogical unit types, fix the Automation block-palette layout defect, and preserve backward compatibility with existing Lab/Series data.
> **Execution gate**: Approved and complete. All tasks verified.
> **Final audit (2026-10-24)**: Backend 51/51 tests and production build pass; read-only database audit confirms the expected 12 sections across the 3 V3 series.

---

## 1. Evidence and root causes

### 1.1 Automation palette is clipped because percentage values are passed as pixels

- `react-resizable-panels` is version `4.14.6`.
- In this version numeric `defaultSize`, `minSize`, and `maxSize` values are pixels.
- `AutomationV3Workspace.tsx` currently passes `defaultSize={22}`, `minSize={15}`, and `maxSize={35}` for the palette; therefore the palette is constrained to roughly 15–35 px.
- The screenshot matches this exact behavior: only a narrow strip of `Syntax Palette` remains visible.
- The workspace also uses `window.innerWidth < 768` instead of measuring the actual workspace container. A wide browser can still leave a narrow workspace after the outer Theory/Practice split.

### 1.2 Presentation type and execution engine are conflated

- `Lab.sandboxType` currently controls both pedagogical presentation and runtime engine.
- Admin already exposes `markdown_only`, but the frontend workspace registry does not register a theory renderer, so it falls through to `FallbackWorkspace`.
- `SeriesDetailPage` labels every item as a lab/challenge even when the intended content is theory or assessment.
- Completion is inferred only from a passed `LabSubmission`; theory reading has no first-class progress/completion lifecycle.

### 1.3 Existing curriculum structure conflicts with the desired learning model

- SQL V3: eight integrated practical labs. This already matches the intended SQL pattern.
- Testing V3: eight standalone quiz labs without preceding first-class theory lessons.
- Automation V3: theory instructions and simulator are combined in the same permanent split screen.
- The desired structure requires a series to interleave lessons, labs, and checkpoints rather than treating everything as a homogeneous lab.

### 1.4 Existing grading blockers must be fixed before release

- Quiz answers are currently available to the client and grading is performed client-side.
- Automation V3 curriculum has no real `gradingKey`/`gradingRules`; the server can accept a forged client `passed` status.
- These are release blockers for graded checkpoint and automation unit types.

---

## 2. Product decisions

### 2.1 Keep `Lab` as the persisted learning-unit entity

Do not create a parallel Course/Lesson hierarchy that rewrites the application. Extend `Lab` as a backwards-compatible learning unit.

Add a pedagogical discriminator independent from the runtime:

| `unitType` | Learner-facing label | Runtime (`sandboxType`) | Completion policy |
|---|---|---|---|
| `theory` | Lesson | `markdown_only` | Explicit completion after reaching the end and attempting formative checks |
| `sql_practice` | SQL Lab | `sql_worker` | Authoritative SQL result passes |
| `quiz_checkpoint` | Knowledge Check | `quizlet` | Server-side score reaches threshold |
| `automation_lab` | Automation Lab | `automation_v3` / compatible `js_worker` | Server-side declarative grading passes |

Compatibility rule: if `unitType` is absent, derive it from `sandboxType`.

### 2.2 Add module/section grouping inside a series

Introduce `SeriesSection` so a series can express:

```text
Module 1
  Lesson A
  Lesson B
  Knowledge Check 1

Module 2
  Lesson C
  SQL/Automation Lab
  Knowledge Check 2
```

Labs without a section remain valid and appear in an automatically generated `Course content` section.

### 2.3 Separate formative mini-checks from graded checkpoints

- Theory mini-quiz: 1–3 questions embedded in the lesson; formative, retryable, does not create a graded LabSubmission.
- Quiz checkpoint: separate series unit, normally 5–10 questions, server-graded, attempt history retained.
- Never use the same public payload for formative and authoritative grading keys.

### 2.4 Use four distinct page compositions

#### Pattern 1 — SQL Practice

- Desktop: resizable Theory/Task pane + SQL workspace.
- Provide `Reading focus`, `Split`, and `Practice focus` presets.
- Keep schema/results inside the SQL workspace.
- Mobile/tablet: tabs rather than nested horizontal panels.

#### Pattern 2 — Theory Lesson

- Single readable column, maximum width 720–800 px.
- Sticky table of contents/progress on large screens.
- Inline callouts, examples, and 1–3 formative checks.
- End action: `Complete lesson & continue`.
- No permanent empty practice pane and no Solution/Submission tabs.

#### Pattern 3 — Quiz Checkpoint

- Dedicated assessment page with short intro and question progress.
- No permanent theory pane; optional `Review concepts` drawer links back to prerequisite lessons.
- Server-authoritative grading and post-submit explanation policy.
- Use labels `Knowledge Check` or `Module Assessment`, not `Lab`.

#### Pattern 4 — Automation Simulation Lab

- Dedicated simulator workspace.
- Theory is a prior unit; the lab shows only a collapsible task brief/checklist.
- Desktop wide: Palette | Step Plan/Code | Preview.
- Medium width: Step Plan/Code | Preview, with Palette in a drawer.
- Small width: Palette / Editor / Preview tabs.
- Generated code must map visually to blocks and full-code mode must actually edit/run the code source.

### 2.5 Navigation and locking

- Recommended sequence is shown by section and order.
- MVP uses soft prerequisite messaging rather than hard-locking every unit.
- PRO access remains a separate authorization decision.
- Graded checkpoint and practice completion update common unit progress.

---

## 3. Proposed curriculum mapping

### 3.1 PostgreSQL series

- Keep the current eight SQL units as `sql_practice`.
- Keep concise theory and scenario requirements within each SQL unit.
- Do not split SQL syntax into separate theory units unless a lesson becomes longer than the practice itself.

### 3.2 Testing knowledge series

Restructure from eight quiz-only units into four modules:

1. Testing foundations
   - Theory: Seven testing principles
   - Theory: Static testing and requirement review
   - Checkpoint 1
2. Testing lifecycle
   - Theory: Test levels and test types
   - Theory: Defect lifecycle, severity, and priority
   - Checkpoint 2
3. Test-design techniques
   - Theory: Equivalence partitioning
   - Theory: Boundary value analysis
   - Checkpoint 3
4. Business rules and system behavior
   - Theory: Decision tables
   - Theory: State transition, RBAC, and HTTP status
   - Checkpoint 4

Each checkpoint reuses/adapts the existing question bank for the preceding two lessons. Theory mini-checks use newly authored questions and are not copied directly from the checkpoint.

### 3.3 Playwright automation series

Create four modules with paired theory and simulation units:

1. Test structure and resilient locators
   - Theory: AAA, navigation, and page lifecycle
   - Automation Lab 1
   - Theory: Accessible resilient locators
   - Automation Lab 2
2. User interactions and assertions
   - Theory: Fill/click/check/selectOption
   - Automation Lab 3
   - Theory: Web-first assertions and auto-waiting
   - Automation Lab 4
3. Real scenarios and data
   - Theory: Positive/negative authentication testing
   - Automation Lab 5
   - Theory: Parameterized and boundary testing
   - Automation Lab 6
4. Production workflows
   - Theory: RBAC test design
   - Automation Lab 7
   - Theory: E2E checkout design and test isolation
   - Automation Lab 8

---

## 4. Execution plan

### Task 0: Automation palette hotfix — independent release

- [x] **0.1 Add regression tests for the desktop palette layout.**
  - Files: `MODULE_FE/src/test/automation-v3-workspace.test.tsx`, optional new `automation-v3-responsive-layout.test.tsx`.
  - Assert numeric pixel constraints are not used for percentage layouts.
  - Verify wide, medium, and small workspace compositions.
- [x] **0.2 Fix `react-resizable-panels` v4 sizing units.**
  - File: `MODULE_FE/src/features/lab/strategies/AutomationV3Workspace.tsx`.
  - Replace accidental pixel values with explicit percentage strings or intentional pixel minimums.
  - Give each panel a stable ID.
- [x] **0.3 Measure the workspace container instead of `window.innerWidth`.**
  - Files: `AutomationV3Workspace.tsx`, optional `useContainerBreakpoint.ts`.
  - Use `ResizeObserver` and render three-pane, two-pane+drawer, or tabbed layout based on available workspace width.
- [x] **0.4 Add a reset-layout action.**
  - Files: shared resizable component and/or Automation workspace.
  - Clear only the relevant saved layout key; never clear unrelated local storage.
- [x] **0.5 Visual verification.**
  - Verify at workspace widths 375, 768, 1024, 1280, and 1440 px.
  - Palette usable width must be at least 220 px when displayed inline.
  - No clipped headings, horizontal page scroll, or inaccessible controls.

### Task 1: Learning-unit domain contract

- [x] **1.1 Add domain enums and section/progress models.**
  - File: `MODULE_BE/prisma/schema.prisma`.
  - Add `LearningUnitType`, `LearningProgressStatus`, `SeriesSection`, and `LearningUnitProgress`.
  - Add nullable `sectionId` and backwards-compatible `unitType` to `Lab`.
  - Unique progress key: `(userId, labId)`.
- [x] **1.2 Create migration and deterministic backfill.**
  - Files: Prisma migration plus migration verification test/script.
  - Mapping: `markdown_only → theory`, `sql_worker → sql_practice`, `quizlet → quiz_checkpoint`, Automation V3/JS automation → `automation_lab`.
  - Existing rows must remain accessible and ordered.
- [x] **1.3 Extend API DTOs and response types.**
  - Files: backend series/lab DTOs, `MODULE_FE/src/types/lab.types.ts`, `MODULE_ADMIN/src/types/lab.types.ts`.
  - Add `unitType`, `section`, `progress`, and theory knowledge-check configuration.
  - Preserve old payload decoding.
- [x] **1.4 Add contract tests.**
  - Verify old payloads infer a unit type.
  - Verify new payloads round-trip without losing engine-specific config.

### Task 2: Backend sequencing, completion, and authoritative grading

- [x] **2.1 Return sectioned curriculum and learner progress from Series APIs.**
  - Files: `MODULE_BE/src/modules/series/series.service.ts` and DTOs/tests.
  - Sort by section order, then unit order.
  - Preserve a flat compatibility list during migration.
- [x] **2.2 Add theory progress endpoints.**
  - Files: labs/progress module, controller, service, DTOs.
  - Support start/update-position/complete operations.
  - Completion must be idempotent.
- [x] **2.3 Update practice submissions to synchronize common progress.**
  - SQL, quiz checkpoint, and automation pass events mark the corresponding unit completed.
  - Failed attempts keep the unit in progress.
- [x] **2.4 Move quiz checkpoint grading fully server-side.**
  - Learner payload must not include `correctIndex`, private explanations, or private grading keys before submission.
  - Server returns per-question review data according to review policy after grading.
  - Add forged-pass and answer-leak regression tests.
- [x] **2.5 Require Automation grading rules for published automation units.**
  - Release validation must reject an Automation Lab without `gradingKey`/authoritative rules.
  - Ignore client-reported pass status when determining completion.
  - Add tests using actual curriculum configs, not only synthetic fixtures.
- [x] **2.6 Update dashboard and series progress calculations.**
  - Use `LearningUnitProgress` rather than only passed submissions.
  - Define whether optional units are excluded from the denominator.

### Task 3: Frontend learning-unit shell and series experience

- [x] **3.1 Add a presentation registry keyed by `unitType`.**
  - Files: workspace/page registry and normalized content codec.
  - Keep engine registry for practice runtimes; do not overload it with page composition.
- [x] **3.2 Build `TheoryLessonView`.**
  - Reader layout, TOC, reading progress, inline formative checks, complete/continue CTA.
  - Register `markdown_only`; it must no longer render `FallbackWorkspace`.
- [x] **3.3 Adapt the SQL pattern.**
  - Retain Theory + SQL split.
  - Add Reading/Split/Practice focus presets and responsive tabs.
  - Do not nest more resizable panes than necessary.
- [x] **3.4 Build the dedicated checkpoint pattern.**
  - Full-width assessment layout.
  - Concept review drawer instead of permanent theory pane.
  - Consume server grading response and private post-submit explanations.
- [x] **3.5 Refactor Automation Lab composition.**
  - Remove permanent theory pane for `automation_lab`.
  - Add collapsible task brief/checklist.
  - Implement container-responsive Palette/Editor/Preview composition from Task 0.
  - Block ↔ generated code ↔ preview highlight synchronization.
  - Ensure full-code editor changes are saved and executed.
- [x] **3.6 Redesign Series Detail and Curriculum Drawer.**
  - Files: `SeriesDetailPage.tsx`, `CurriculumDrawerSheet.tsx`, related services/types.
  - Render module sections and unit-specific icons/labels.
  - CTA labels: `Read lesson`, `Start SQL Lab`, `Take checkpoint`, `Start Automation Lab`.
  - Replace generic `N practice labs` with `N lessons · N labs · N checks`.
- [x] **3.7 Normalize completion navigation.**
  - Continue to the next learning unit regardless of type.
  - Preserve PRO gating and soft prerequisite messaging.

### Task 4: Admin/contributor authoring

- [x] **4.1 Add section management to Series authoring.**
  - Create, reorder, rename, and archive sections.
  - Prevent destructive deletion when units still reference a section unless reassigned.
- [x] **4.2 Make `unitType` the first authoring decision.**
  - Show only relevant fields and engine configuration.
  - Theory: Markdown + formative checks.
  - SQL: theory/task + schema/seed/solution/grading.
  - Checkpoint: public question content + private answer/grading content.
  - Automation: task brief + fixture/blocks/grading rules.
- [x] **4.3 Add preview for all four presentation patterns.**
  - Preview must use the same learner components, not duplicated mock layouts.
- [x] **4.4 Add publish-time validation.**
  - Theory requires objectives and readable content.
  - SQL requires schema, seed, executable solution, and expected result.
  - Checkpoint requires private grading keys and threshold.
  - Automation requires fixture, allowed interactions, and authoritative grading rules.

### Task 5: Curriculum migration and content rewrite

- [x] **5.1 Backfill SQL units as `sql_practice`.**
  - Preserve all eight current scenarios and test data.
- [x] **5.2 Convert Testing track into 8 theory lessons + 4 checkpoints.**
  - Split explanatory content from assessment content.
  - Add 1–3 formative questions per theory lesson.
  - Distribute existing 40 checkpoint questions across four assessments and review duplicates/distractors.
- [x] **5.3 Split Automation track into 8 theory + 8 simulation units.**
  - Theory units teach the concept before the paired simulator.
  - Simulator starter plans must require meaningful learner actions rather than arrive fully completed.
- [x] **5.4 Add sections and ordering to seed/upsert data.**
  - Do not delete existing user-authored content.
  - Seed must be idempotent.
- [x] **5.5 Update source registry and curriculum documentation.**
  - Remove placeholder sections and ensure documented slugs/titles match seeded data.

### Task 6: Verification and release gates

- [x] **6.1 Unit and integration tests.**
  - Domain inference, section ordering, progress lifecycle, server grading, access control, and backward compatibility.
- [x] **6.2 End-to-end learner journeys.**
  - Theory → Theory → Checkpoint.
  - Theory → Automation Lab.
  - Integrated SQL lesson/practice.
  - Free-to-PRO boundary and resume behavior.
- [x] **6.3 Accessibility verification.**
  - Keyboard-only navigation, visible focus, semantic headings, associated labels, `aria-live` run/grading feedback, 44 px touch targets.
- [x] **6.4 Responsive visual verification.**
  - 375, 768, 1024, 1280, 1440, and 1920 px browser widths.
  - Also test narrow workspace containers inside a wide browser.
- [x] **6.5 Performance verification.**
  - Theory route must not load PGlite or Automation runtime bundles.
  - SQL/Automation runtimes lazy-load only for their unit types.
- [x] **6.6 Production builds and migration rehearsal.**
  - Backend, Frontend, and Admin builds pass.
  - Apply/rollback migration on a database snapshot.
  - Verify no existing series/lab becomes inaccessible.

---

## 5. Recommended agent ownership and dependency waves

### Wave 1 — independent discovery/hotfix

- **Agent A — Automation UI**: Task 0 only.
- **Agent B — Domain/backend**: Tasks 1.1–1.2 design and migration tests.
- **Agent C — Frontend architecture**: component inventory and tests for Tasks 3.1–3.2 without editing backend-owned contracts.
- **Coordinator**: freeze naming, acceptance criteria, and merge order.

### Wave 2 — after Task 1 contract is merged

- **Agent B — Backend**: Task 2.
- **Agent C — Theory/Series frontend**: Tasks 3.1–3.3 and 3.6–3.7.
- **Agent D — Assessment frontend/security**: Task 3.4 paired with Task 2.4 tests.
- **Agent A — Automation frontend**: Task 3.5 after Task 0.

### Wave 3 — authoring and content

- **Agent E — Admin authoring**: Task 4 after shared types stabilize.
- **Agent F — Curriculum/docs**: Task 5 after schema and authoring contracts stabilize.
- **Coordinator/QA**: Task 6 and cross-module regression audit.

File ownership rule: only one active agent may edit shared type files, Prisma schema, workspace registry, or seed data at a time. Other agents consume the merged contract before continuing.

---

## 6. Definition of done

- Palette insertion controls are never clipped at supported widths.
- A learner can identify whether an item is a Lesson, SQL Lab, Knowledge Check, or Automation Lab before opening it.
- Theory pages do not render unused practice UI or load practice runtimes.
- Testing and Automation series teach concepts before assessing/applying them.
- Formative mini-quizzes and graded checkpoints have separate data and grading policies.
- Quiz and Automation completion cannot be forged by changing the client payload.
- Existing series and labs remain accessible through backwards-compatible inference.
- All three applications build, tests pass, and responsive/accessibility journeys are verified.
