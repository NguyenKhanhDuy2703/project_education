# Automation Testing Smart Cloaked Code - Analysis & Working Memory

> **Status**: SUPERSEDED — analysis was implemented by the execution and review/fix plans
> **Goal**: Compare the current SQL and Automation Testing learner flows, identify why the Automation flow overexposes boilerplate, and specify a Fill-in-the-Blanks / Smart Cloaked Code learning flow without changing product code.

---

### Task 1: Establish the current-state evidence
- [x] **Subtask 1.1**: Trace SQL learner flow, content contract, authoring, execution, grading, and progress behavior. (Files: relevant `MODULE_FE/`, `MODULE_BE/`, tests, and docs)
  - *Verify*: Evidence map cites concrete file paths and observed behavior.
- [x] **Subtask 1.2**: Trace Automation Testing learner flow across the same layers. (Files: relevant `MODULE_FE/`, `MODULE_BE/`, tests, and docs)
  - *Verify*: Evidence map identifies what learners edit, what is hidden, how execution/grading works, and where SQL assumptions leak into Automation.
- [x] **Subtask 1.3**: Compare both flows and isolate pedagogical, UX, content-model, and validation gaps. (Artifact: this file)
  - *Verify*: Each stated problem is backed by repository evidence and separated from assumptions.

### Task 2: Define the target learning model
- [x] **Subtask 2.1**: Define Smart Cloaked Code semantics and its boundaries. (Artifact: this file)
  - *Verify*: Specification distinguishes visible context, editable blanks, protected code, runtime substitution, and hidden tests.
- [x] **Subtask 2.2**: Define exercise primitives for status codes, expected values/assertions, actions, selectors, and supporting value types. (Artifact: this file)
  - *Verify*: Every primitive has author input, learner interaction, validation rules, and feedback behavior.
- [x] **Subtask 2.3**: Design the learner journey, progressive disclosure, feedback, hints, reset, accessibility, and responsive behavior. (Artifact: this file)
  - *Verify*: Flow covers first load through successful submission plus error and retry states.

### Task 3: Specify system behavior without implementation
- [x] **Subtask 3.1**: Propose the content contract and example exercise shapes at a conceptual/schema level only. (Artifact: this file)
  - *Verify*: Contract supports stable blank IDs, typed answers, multiple occurrences, safe rendering, and versioning.
- [x] **Subtask 3.2**: Define assembly, execution, grading, security, telemetry, and authoring-preview responsibilities. (Artifact: this file)
  - *Verify*: Trust boundaries and client/server responsibilities are explicit; solution leakage risks are addressed.
- [x] **Subtask 3.3**: Define rollout phases, migration strategy, acceptance criteria, and unresolved product decisions. (Artifact: this file)
  - *Verify*: Plan can be approved before code and includes measurable learning/quality outcomes.

### Task 4: Review and handoff
- [x] **Subtask 4.1**: Re-read the proposal against repository evidence and the user’s constraints. (Artifact: this file)
  - *Verify*: No production code changed; no unsupported claims; SQL remains a comparator rather than the template for Automation.
- [x] **Subtask 4.2**: Present the detailed flow and stop at the human confirmation gate. (Artifact: this file)
  - *Verify*: User receives a linked analysis/specification and implementation remains pending.

---

## 1. Executive conclusion

The user's diagnosis is correct. SQL and Automation Testing share a workspace shell, but they should not share the same learner interaction model.

- In SQL, composing the complete query is the target skill. A free-form editor plus schema/result/diff is appropriate.
- In beginner Automation Testing, framework setup, variables, fixtures, object construction, imports, and test-runner syntax are supporting machinery. Exposing all of it makes JavaScript fluency a prerequisite and shifts attention away from test intent.
- The current Automation lesson labels itself low-code but only places `/* TODO */` comments inside a fully editable Monaco document. It does not technically cloak or protect any code.
- The correct target is a structured exercise rendered as code: the platform owns the template; the learner owns only typed blanks such as status code, selector, action, matcher, and expected value.

**Recommended product rule:** keep SQL as a free-form query strategy. Replace beginner Automation's free-form source editing with a `smart_cloze` interaction mode inside the Automation strategy. Preserve a later `guided_code` and `full_code` mode for progressive mastery.

## 2. Current-state evidence

### 2.1 SQL flow

1. `LabWorkspacePage` loads `envelope.initialSnippet` into shared `code` state and resolves a strategy by `sandboxType`.
2. `SqlPracticeWorkspace` initializes an isolated SQL adapter with `schemaSql` and `seedSql`.
3. The learner edits an entire SQL query in Monaco.
4. On Run, the query passes a single-statement/read-only guard, executes in the worker-backed database, and produces rows.
5. Results are compared against `expectedQueryResult`, respecting optional columns and row ordering policy.
6. UI exposes Result, Diff, and Schema views, so the feedback matches the authored learning objective.
7. The contributor SQL builder separately authors schema/data, starter query, reference solution, and expected result grid.

This is coherent because syntax composition, clauses, aliases, filtering, joins, and result shape are the actual learning surface.

### 2.2 Automation Testing flow

1. `js_worker` maps directly to `AutomationTestWorkspace`.
2. The shared shell loads the full `initialSnippet` into the same string-valued `code` state used by SQL.
3. The learner receives a fully editable JavaScript Monaco editor, a generic matcher cheat sheet, Run Tests, Submit, logs, and assertion result cards.
4. Run concatenates arbitrary learner code with the author-provided `testScript` through `new Function` in a fresh Web Worker.
5. The V1 `AutomationTestConfig` declares `targetFunction`, `steps`, and `cheatSheetVisible`, but the learner workspace does not consume the structured steps. There is no blank model, template segmentation, or learner-answer state.
6. The contributor builder is still a JavaScript programming exercise builder: Starter Code + Reference Solution + test-case input expressions + expected expressions. Its card mode compiles to raw `assert(...)` strings.
7. The seeded low-code API exercise exposes roughly forty lines of editable mocks, declarations, comments, and `testSuite` boilerplate. The four desired inputs are merely marked by comments.

### 2.3 Critical current defects relevant to redesign

- **False low-code affordance:** comments visually indicate blanks, but Monaco permits editing/deleting all code.
- **Wrong unit of learner state:** the platform stores a source string, not answers keyed to pedagogical concepts.
- **Boilerplate tax:** success requires navigating JavaScript object declarations, expressions, punctuation, and surrounding mocks.
- **Fragile authoring:** test cards accept executable input/expected expressions as strings, so author mistakes become runtime failures.
- **Config/UI disconnect:** structured Automation `steps` exist in types/DTOs but are not used by the workspace or runner.
- **No blank-level validation:** the learner sees syntax/runtime failures instead of feedback such as “HTTP status must be a 3-digit integer.”
- **No true progressive scaffolding:** difficulty cannot control how much code is revealed or editable.
- **Submission race:** both Automation and SQL call an async run and then immediately read the previous React result state. Automation is worse: `status: passed ? 'passed' : 'passed'` always submits `passed`.
- **Trust-boundary weakness:** backend submission currently trusts the client-provided status and records it; authoritative grading is absent.
- **Potential solution leakage:** public lab detail strips `solution`, but public `testScript` and expected values can reveal answers. A cloze flow must explicitly separate public feedback from hidden grading criteria.

## 3. Target model: Fill-in-the-Blanks / Smart Cloaked Code

### 3.1 Definition

Smart Cloaked Code is not a partially disabled text editor. It is a structured assessment whose presentation happens to look like real test code.

The authored template is split into:

- **Visible locked code:** useful context learners should read but not maintain.
- **Cloaked code:** imports, fixture construction, setup/teardown, request wiring, helper functions, secrets, and grading hooks. It is represented by compact labeled folds such as “Framework setup · 12 hidden lines,” not delivered as editable source.
- **Editable blanks:** stable, typed answer slots embedded at meaningful code positions.
- **Optional revealable context:** code that may be expanded for explanation but remains read-only.
- **Hidden checks:** grading rules that are never serialized to the learner payload.

The source of truth is `answersByBlankId`, not a mutable code blob. The complete runnable source is assembled from a trusted template and normalized answers only at execution time.

### 3.2 Core blank types

| Blank kind | Learner skill | Preferred control | Example | Validation |
|---|---|---|---|---|
| `http_status` | Map scenario to protocol outcome | searchable status combobox or numeric field | `401 Unauthorized` | integer 100–599; allowed set optional |
| `expected_value` | Identify expected business result | typed literal editor | `true`, `"active"`, `{ "role": "admin" }` | declared scalar/JSON type, depth/size limits |
| `matcher` | Choose assertion semantics | constrained combobox | `toEqual`, `toContain`, `toBeDefined` | enum allowlist compatible with actual/value type |
| `action` | Choose test interaction | constrained combobox, optional parameter blanks | `click`, `fill`, `selectOption`, `request` | enum allowlist and action-specific required args |
| `selector` | Target a stable element | selector input with strategy prefix | `role=button[name="Sign in"]` | allowed selector grammar; discourage brittle positional CSS |
| `path` | Select a response/property path | autocomplete path picker | `response.data.tokens.accessToken` | must resolve in public fixture/schema when applicable |
| `method` | Choose HTTP operation | compact combobox | `POST` | enum |
| `text` / `number` / `boolean` | Supporting test data | type-specific input | `invalid@example.com`, `10`, `false` | length/range/format policy |

Avoid a general `expression` blank in beginner mode: it reintroduces arbitrary code and cognitive load. Reserve it for advanced `guided_code` lessons.

### 3.3 Recommended progression across a series

1. **Recognition:** select status, method, action, or matcher from options.
2. **Guided recall:** type status/expected values while actions/selectors remain selectable.
3. **Structured construction:** fill selectors, action arguments, property paths, and assertion values in a prewritten test.
4. **Guided code:** more context is visible; only selected expressions or whole assertion lines are editable.
5. **Independent authoring:** full-code mode appears only after the learner has mastered the test concepts.

This is faded scaffolding: the platform removes support intentionally by level. It should not expose all boilerplate from lesson one.

## 4. Detailed learner flow

### State 1 — Orient

- Left pane shows the scenario, system-under-test contract, and one explicit learning objective.
- Right pane header says what the learner is practicing, e.g. “Complete 4 test decisions,” not “JavaScript editor.”
- A progress chip shows `0/4 blanks completed`; Run is available for partial diagnostic checks but Submit is disabled until all required blanks are syntactically valid.
- First-time affordance briefly highlights the first blank and explains that dimmed/folded code is managed by the platform.

### State 2 — Fill

- Prewritten test code is syntax highlighted and read-only except for blanks.
- Each blank is a real form control in code context, with a persistent label or accessible name, not placeholder-only UI.
- Tab/Shift+Tab moves only between blanks in source order. Arrow keys operate comboboxes without trapping focus.
- Selecting a blank synchronizes a compact “Why this matters” card in the left pane.
- Type validation happens locally and immediately; semantic correctness is not revealed until Check/Run unless the lesson policy allows it.
- Cloaked blocks can be expanded as read-only explanations. They never become learner obligations in beginner mode.

### State 3 — Check / Run

- The platform validates completeness and types before assembling anything.
- It normalizes values (number stays number, JSON stays structured data) and injects them through safe template slots.
- Public checks run and results map back to blank IDs and conceptual steps.
- Feedback is layered:
  1. input error: “Expected a three-digit HTTP status”; 
  2. conceptual error: “The caller is authenticated but lacks permission—compare 401 and 403”; 
  3. scenario result: request/action/assertion step pass/fail; 
  4. raw logs are collapsed under “Technical details.”
- Focus moves to the summary, then the first invalid/incorrect blank; an `aria-live` region announces the result.

### State 4 — Hint and retry

- Hint 1 recalls the relevant rule without giving the answer.
- Hint 2 narrows the option set or highlights relevant API/UI spec evidence.
- Hint 3 may reveal the answer only if the course policy permits, recording that assistance was used.
- Editing any checked answer marks dependent results stale and removes the ready-to-submit state.
- Reset supports both “Reset current blank” and “Reset all answers,” with confirmation only for the destructive all-reset action.

### State 5 — Pass and submit

- A successful Run creates an immutable graded attempt token/result tied to template version + normalized answers.
- Submit sends the answer map and that run identity, not an arbitrary `passed` string.
- The backend either regrades or verifies the signed/recorded result before marking completion.
- The completion screen summarizes learned concepts (“distinguished 401 from 403,” “used accessible role selector”), not just test count.

### Suggested desktop sketch

```text
┌ Scenario / API spec (35%) ───────┬ Guided test (65%) ──────────────────────────┐
│ Goal: validate failed login       │ 2 of 4 decisions complete     [Reset] [Run] │
│                                   │                                               │
│ POST /auth/login                  │ ▸ Test setup · managed by Study Web            │
│ Failure response: ...             │ test('rejects bad credentials', async () => {  │
│                                   │   const response = await login(...);            │
│ Selected: HTTP status             │   expect(response.status).toBe([ 401 ▼ ]);      │
│ Why: unauthenticated request      │   expect(response.data.error).[ toBe ▼ ]        │
│ Hint 1 available                  │     ([ "Unauthorized"        ]);                │
│                                   │ });                                             │
│                                   ├ Results: Status ✓  Error message ✕              │
└───────────────────────────────────┴─────────────────────────────────────────────────┘
```

On mobile, render the scenario as a collapsible sheet above a single-column blank navigator. Do not squeeze a desktop code editor into horizontal scrolling.

## 5. Conceptual content contract (V2 proposal)

Use a new versioned Automation interaction model rather than overloading V1 `steps` or parsing `TODO` comments.

```ts
AutomationExerciseV2 {
  version: '2.0'
  interactionMode: 'smart_cloze' | 'guided_code' | 'full_code'
  framework: 'playwright' | 'api' | 'generic'
  publicTemplate: TemplateSegment[]
  blanks: BlankDefinition[]
  publicChecks: PublicCheck[]
  gradingPolicy: { passThreshold; attemptsBeforeHint; allowReveal }
  presentation: { showManagedBlocks; showTechnicalLogs; layout }
}

TemplateSegment =
  | { kind: 'readonly'; text: string }
  | { kind: 'managed'; label: string; summary?: string }
  | { kind: 'blank'; blankId: string }

BlankDefinition {
  id: string                  // stable across edits and analytics
  kind: BlankKind
  label: string
  required: boolean
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'enum'
  options?: TypedOption[]
  validation: ValidationRule[]
  hintIds?: string[]
  conceptTags: string[]
}
```

Author-only grading data must be stored and served separately:

```ts
AutomationGradingV2 {
  templateVersion: string
  acceptedAnswersOrRules: Record<blankId, rule>
  hiddenChecks: HiddenCheck[]
  feedbackMap: Record<checkId, FeedbackDefinition>
}
```

Do not send accepted answers, hidden checks, raw solution templates, or secrets in the public lab response. Public checks should teach; hidden checks should verify generalization.

## 6. Assembly, execution, and grading responsibilities

### Client

- Render typed blanks and locked/cloaked segments.
- Maintain answer map, dirty/stale state, validation state, and hint usage.
- Produce a read-only assembled preview for teaching purposes.
- Run only safe public simulations/checks in the worker.
- Submit answers + template version + run identifier.

### Runner

- Accept a structured payload, not arbitrary author-generated string concatenation as the primary API.
- Map every check result to `blankId`, `stepId`, and concept tag.
- Apply strict limits: time, logs, payload size, allowed actions/matchers, selector grammar.
- Return structured diagnostics suitable for instructional feedback.

### Backend

- Validate the V2 discriminated contract and uniqueness of blank IDs.
- Keep author-only grading material out of learner detail endpoints.
- Treat client status as untrusted. Regrade server-side or verify a trusted graded-attempt record.
- Persist normalized answer maps and template version for history/migration, while optionally retaining an assembled snapshot for human review.

## 7. Contributor authoring flow

Replace the JS-centric builder for `smart_cloze` with a five-step author flow:

1. **Choose template:** API assertion, UI interaction, form validation, auth/RBAC, or blank custom template.
2. **Compose scenario:** endpoint/page, fixture/schema, objective, and expected learner concepts.
3. **Place blanks:** select a semantic token/argument in the template and convert it to a typed blank; author never types marker syntax manually.
4. **Define grading and hints:** accepted value/rule, conceptual feedback, hidden variants, hint ladder.
5. **Preview and preflight:** use the exact learner renderer; keyboard-test blank order; run reference answers; verify wrong-answer diagnostics; verify public payload contains no hidden answers.

Preflight must reject orphan blanks, duplicate IDs, unreferenced grading rules, missing labels, incompatible matcher/value types, templates that fail with correct answers, and hidden data included in public segments.

## 8. Migration and rollout

### Phase A — Contract and vertical slice

- Add V2 alongside V1; do not reinterpret existing `initialSnippet` heuristically.
- Build one API exercise using four blanks: success status, failure status, token assertion, sensitive-field assertion.
- Prove round-trip authoring, learner rendering, public execution, trusted submission, and history display.

### Phase B — Action and selector lessons

- Add Playwright-like action/selector primitives with mocked page state or a deterministic preview application.
- Prefer accessible locator strategies (`role`, `label`, `testId`) and teach why brittle nth-child/CSS selectors are discouraged.

### Phase C — Faded scaffolding

- Add per-lab interaction modes and prerequisites so the same concepts progress from selection to guided code to full code.
- Migration remains explicit: legacy V1 labs stay in full-code mode until a contributor converts and republishes them.

### Phase D — Measurement and tuning

- Track blank-level error rates, first-run pass rate, hint use, time-to-first-valid-run, retries, abandon rate, and transition success into guided/full code.
- Never log secrets or unrestricted learner code in analytics.

## 9. Acceptance criteria for eventual implementation

- Learner cannot modify locked or managed template sections in `smart_cloze` mode.
- Every blank is keyboard reachable, visibly focused, labeled, and operable without a mouse.
- Status codes, expected values, actions, selectors, paths, and matchers retain their declared types end to end.
- Invalid blank data is rejected before execution with localized feedback.
- Changing an answer invalidates prior pass state.
- Submit cannot mark completion without a successful current-version grade.
- Public lab payload contains no hidden accepted answers or hidden checks.
- Correct reference answers pass; curated wrong answers yield concept-specific feedback.
- Legacy V1 Automation and SQL labs continue to load without semantic changes.
- SQL remains a dedicated free-form SQL workspace.
- Responsive checks pass at 375, 768, 1024, and 1440 px; no horizontal page scroll on mobile.
- UI does not depend on color alone; contrast, focus, reduced motion, and live result announcements meet accessibility expectations.

## 10. Decisions to approve before implementation

Recommended defaults are included so implementation can proceed without reopening the whole design:

1. **Scope:** start with API Automation blanks, then selectors/actions. Recommended: yes.
2. **Execution:** deterministic mocks for beginner labs; no live external HTTP/browser access. Recommended: yes.
3. **Grading authority:** server regrade or trusted graded-attempt verification. Recommended: required before completion credit.
4. **Interaction modes:** support `smart_cloze`, `guided_code`, and `full_code` under Automation V2. Recommended: yes.
5. **Migration:** explicit contributor conversion; no regex parsing of old TODO comments. Recommended: yes.
6. **Hints:** three-level ladder with hint-use telemetry; answer reveal configurable per course. Recommended: yes.

## 11. Files likely affected later (implementation boundary only)

- Shared/content contract: `MODULE_FE/src/types/lab.types.ts`, FE/BE lab codecs, BE DTO validation.
- Learner UI/state: Automation strategy, new cloze renderer/controls, workspace submission state.
- Runtime/grading: worker protocol, structured runner, backend grading or attempt verification.
- Authoring: Automation builder and exact learner preview.
- Persistence/API: versioned public vs grading config, normalized submitted answers.
- Fixtures/tests/docs: seed migration, contract tests, workspace interaction/a11y tests, submission integrity tests, workflow documentation.

No files in those product areas were changed during this analysis.

