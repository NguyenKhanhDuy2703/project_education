# Agent Execution Prompt — Pedagogical Curriculum Resequencing

Copy the complete prompt below into the implementation agent.

---

You are the implementation agent for the `study-web` monorepo at:

`D:\Projects\study-web`

Execute the approved pedagogical curriculum resequencing plan. The plan is the single source of truth:

`D:\Projects\study-web\.agents\scratchpad\pedagogical-curriculum-resequence.plan.md`

This prompt is explicit authorization to implement the plan. Begin work immediately after completing the mandatory repository audit below. Use the recommended decisions already recorded in the plan as approved defaults. Stop and ask the user only if repository evidence requires a material product decision outside that plan.

## Mandatory preparation

Before editing product code:

1. Read `D:\Projects\study-web\AGENTS.md` completely.
2. Read `.agents/skills/plan-and-execute/SKILL.md` completely and follow it throughout execution.
3. Read the entire approved plan, including evidence, task dependencies, gates, non-goals, Definition of Done, and decision log.
4. Read `.agents/scratchpad/learning-series-pattern-redesign.plan.md` only as historical context. Its completed checkboxes are not proof that the current code or seeded curriculum satisfies those tasks.
5. Run `git status --short`. The worktree already contains extensive user-owned changes. Preserve them. Do not reset, revert, clean, overwrite, or reformat unrelated files.
6. Re-run the source-level starter audit described in the approved plan. Record any changed findings in the active plan before implementation.
7. Change the active plan status from `PROPOSED — AWAITING EXPLICIT EXECUTION APPROVAL` to `IN_PROGRESS`.

## Plan-and-execute discipline

- The active plan file is the external working memory and progress tracker.
- Work on one unchecked subtask at a time.
- Before editing code for a subtask, change its checkbox from `[ ]` to `[/]`.
- Run the subtask's verification gate after implementation.
- Change `[/]` to `[x]` only when verification has actually passed.
- If verification fails, keep the item in progress and fix it before moving on.
- If new required work is discovered, add a new unchecked subtask to the plan before implementing it.
- Never mark a task or the plan complete based only on code inspection or a previous scratchpad claim.
- Do not broaden scope into gamification, certification/proctoring, a remote browser farm, or unrelated redesign work.

## Execution order

Follow the delivery waves in the plan, with this strict first priority:

```text
Wave 0 — P0 correctness and integrity
  1. Reproduce and lock down zero-action completion with failing tests.
  2. Make automation grading fail closed and server-authoritative.
  3. Add starter-must-fail preflight.
  4. Repair pre-solved legacy and V3 automation starters.
  5. Prevent seed/sync pipelines from bypassing release validation.

Wave 1 — Learning-unit metadata contract
Wave 2 — Theory, quiz, and automation instructional patterns
Wave 3 — Curriculum resequencing and Series Catalog
Wave 4 — Authoring validation and full verification
Wave 5 — Documentation, migration handoff, and legacy retirement
```

Do not start bulk curriculum rewriting until the metadata contract and stable ID/progress migration map are frozen.

## P0 evidence that must be reproduced

Treat the following as hypotheses to verify against the current checkout, not as assumptions to skip testing:

- Three of four legacy `auto-syntax-*` labs have starters equivalent to their solutions and pass their test scripts unchanged.
- All eight Automation V3 starter plans contain every block type currently referenced by their public checks.
- The eight V3 source configs currently lack effective `gradingRules`/`gradingKey` data.
- Legacy `js_worker` submission can retain client-provided `status` when its objective is not parseable V3 JSON.
- The SQL V3 starters are minimal, but most older SQL TODO comments reveal the exact missing answer.

The first implementation tests must prove the unsafe behavior before fixing it.

## Non-negotiable practice invariants

For every unit classified as practice, lab, or checkpoint:

1. The untouched starter must fail at least one production-equivalent authoritative check.
2. Whitespace-only and comments-only changes must still fail.
3. A forged client payload containing `status: passed` must not create passed progress.
4. A valid learner solution must pass.
5. The learner must contribute a meaningful semantic delta appropriate to the interaction mode.
6. Public hints may explain a concept or failure but must not disclose the exact accepted expression, locator, value, or sequence.
7. Reference solutions, answer keys, hidden checks, and grading keys must not be returned in learner-facing payloads.
8. Complete worked code must be presented as theory/example content and must not grant practice completion.

If a lab cannot be graded authoritatively, submission must fail closed with an actionable configuration error. Never fall back to trusting the client.

## Implementation requirements by area

### Backend and grading

- Fix `MODULE_BE/src/modules/labs/labs.service.ts` so all automation completion is server-authoritative.
- Strengthen `MODULE_BE/src/modules/labs/automation-v3-validator.ts` to require effective hidden rules and meaningful learner work.
- Preserve SQL and quiz server-authoritative grading.
- Add a reusable release/preflight validator invoked by Admin publication, seed, and curriculum sync flows.
- Do not expose private grading data through lab detail, series, submission, or review APIs.
- Preserve existing learner progress and submissions during content migration.

### Seed and curriculum content

- Audit `MODULE_BE/prisma/seed.ts` and `MODULE_BE/prisma/v3-curriculum-data.ts` by slug.
- Keep stable IDs/slugs whenever a unit already has learner progress or submissions.
- Rewrite pre-solved starters:
  - Block Builder: only locked environment/setup steps may be prefilled.
  - Smart Cloze: meaningful fields must be blank and learner-editable.
  - Guided Code: provide imports, fixture contract, and TODO boundaries—not the completed logic.
  - Full Code: provide scenario and acceptance criteria, not a completed step plan.
- Remove exact-answer TODO comments from graded SQL/automation practice. Use conceptual hints or staged hints instead.
- Add effective hidden grading rules to every published automation lab.
- Validate every seeded practice unit before it can be marked published.

### Frontend learner experience

- Reuse the existing `TheoryLessonView`; do not create a second theory renderer.
- Restore saved theory position/formative answers and make completion authoritative.
- Distinguish lesson checks from module checkpoints through typed config and presentation policy.
- For automation, implement `Observe → Predict → Build → Run → Explain → Reflect` and progressive code reveal.
- Disable submission until a valid run has occurred after a meaningful learner edit.
- Do not rely on frontend edit detection as the security boundary; the backend must independently enforce validity.
- Keep theory routes free of SQL/automation runtime bundles.

### Curriculum sequencing

- Implement the shared grammar from the plan: theory → short check → guided practice → independent practice → module checkpoint.
- Keep at least 50% of expected learner time as active practice.
- Convert the quiz-only track into the mixed `QA Foundations` path described in the plan.
- Preserve the eight SQL business scenarios and eight Playwright topics while reorganizing them by learning objective.
- Add deterministic next-unit and remediation relationships.

### Series Catalog and authoring

- Make Series Catalog learning-path-first while retaining a separate practice-library discovery mode where appropriate.
- Show outcomes, prerequisites, effort, learning mix, progress, module mastery, and one recommended next action.
- Add Admin diagnostics and hard publication blockers for pre-solved starters, missing hidden rules, answer-revealing TODOs, and invalid module order.
- Preview content through the same learner components used in production.

## Testing requirements

Add or update tests before marking the related subtask complete.

At minimum, implement a repository-wide `practice-starter-preflight` that loads every seeded/published practice unit and proves:

- untouched starter fails;
- comments-only and whitespace-only variants fail;
- forged client pass fails;
- reference solution passes;
- authoritative grading rules exist;
- private rules are removed from learner responses;
- starter content does not equal or reveal the reference solution;
- seed and sync publication paths invoke the validator.

Also run and record:

- targeted Backend tests after each grading/content-contract change;
- targeted Frontend tests after each workspace/presentation change;
- targeted Admin tests after each authoring validator change;
- curriculum preflight and migration preservation tests;
- end-to-end learner journeys from theory through checkpoint/remediation;
- keyboard, screen-reader semantics, reduced-motion, and responsive checks;
- Backend, Frontend, and Admin production builds;
- final `git diff --check` and a diff audit for unrelated changes.

Do not weaken or delete a failing test merely to make the suite green. Update obsolete tests only when the approved product contract has intentionally changed, and record the reason in the plan.

## Data and Git safety

- Do not delete or reset user-owned files or changes.
- Do not run destructive database commands.
- Do not purge, recreate, or remap learner progress/submissions without the approved deterministic migration map.
- Use idempotent migrations/upserts and rehearse them safely.
- Do not commit, push, open a PR, or modify remote state unless the user separately asks.
- Avoid unrelated dependency upgrades and broad formatting changes.

## Progress reporting

At the beginning of execution, report:

- current wave and selected subtask;
- evidence reproduced;
- files that will be changed;
- exact verification command.

After every subtask, update the active plan and report the verification result concisely. If blocked by a material decision outside the plan, stop with the exact evidence and smallest required user decision.

When all checkboxes and gates are complete:

1. Run the full completion audit against the plan's Definition of Done.
2. Change plan status to `COMPLETE` only if no required checkbox or release gate remains open.
3. Provide a final report covering changed learning flows, starter repairs, grading/security behavior, migrations, tests/builds, accessibility, known limitations, and rollback steps.

Begin now with Wave 0. First reproduce the untouched-starter and client-forged-pass failures as automated tests, then fix them sequentially according to the plan.

---
