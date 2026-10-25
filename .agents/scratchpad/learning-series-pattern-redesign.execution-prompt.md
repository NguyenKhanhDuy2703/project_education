# Agent Execution Prompt — Learning Series Pattern Redesign

Copy the prompt below into the implementation agent:

---

You are the implementation agent for the `study-web` monorepo at `D:\Projects\study-web`.

Execute the approved Learning Series Pattern Redesign plan. The plan is the single source of truth:

`D:\Projects\study-web\.agents\scratchpad\learning-series-pattern-redesign.plan.md`

Before changing product code:

1. Read `D:\Projects\study-web\AGENTS.md` completely.
2. Read the plan file completely, including evidence, product decisions, task dependencies, agent ownership, verification gates, and Definition of Done.
3. Inspect the current Git status. The worktree already contains user-owned work in progress. Preserve it, do not reset, revert, overwrite, or clean unrelated changes.
4. Change the plan status from `PROPOSED — AWAITING HUMAN EXECUTION APPROVAL` to `IN_PROGRESS` because this prompt is the user's explicit authorization to execute.

Execution rules:

- Follow the `plan-and-execute` workflow exactly.
- Start with Task 0, the independent Automation palette hotfix.
- Execute tasks in dependency order; do not start a dependent task before its prerequisite contract is verified.
- Work on only one unchecked subtask at a time unless the plan explicitly assigns non-overlapping work to parallel agents.
- Before implementing a subtask, change its checkbox from `[ ]` to `[/]` in the plan.
- After implementation, run the stated verification gate. Change `[/]` to `[x]` only after verification succeeds.
- If verification fails, keep the subtask in progress and fix it before moving on.
- If new required work is discovered, add a new unchecked subtask to the plan before changing code for it.
- Use surgical edits and preserve backward compatibility with existing Series, Lab, sandbox contracts, seeded content, and user progress.
- Keep `unitType` (pedagogical presentation) separate from `sandboxType` (execution engine), as specified in the plan.
- Do not weaken server-authoritative Quiz or Automation grading to simplify implementation.
- Do not expose private quiz answers, grading keys, hidden checks, or reference solutions in learner-facing API payloads.
- Do not mark the overall plan complete while any required checkbox remains unchecked or any release gate is failing.

Critical implementation constraints:

- `react-resizable-panels` v4 treats numeric size props as pixels. Use intentional units and container-aware breakpoints for the Automation workspace.
- Preserve legacy content by deriving `unitType` when it is absent.
- Theory pages must not load SQL or Automation runtime bundles.
- Existing user-authored content and existing seed records must not be deleted.
- Database migrations must have a deterministic backfill and be rehearsed against a snapshot before completion.
- Quiz checkpoint and Automation completion must be determined authoritatively by the backend.

Verification expectations:

- Add or update tests before considering each behavior complete.
- Run targeted tests after each subtask.
- At phase boundaries, run relevant Backend, Frontend, and Admin test/build commands.
- Perform responsive verification at the widths listed in the plan, including a narrow workspace container inside a wide browser.
- Perform keyboard and accessibility verification for all four learning patterns.
- Run `git diff --check` and audit the final diff for unrelated changes.

Progress communication:

- At the start, report the current plan phase, selected subtask, affected files, and verification command.
- Give concise updates after each verified subtask.
- If a decision would materially diverge from the approved plan, stop and ask the user instead of guessing.
- When all Definition of Done conditions are satisfied, change the plan status to `COMPLETE` and provide a final report containing migrations, changed learning flows, tests/build results, known limitations, and rollback notes.

Begin execution now with Task 0.1 from the plan.

---
