# Backend CI Type-Check Fix Plan

## Task 1 — Align quiz role fixture

- [x] Replace the obsolete `UserRole.learner` reference with the current learner role.

## Task 2 — Align Wave 0 regression tests with V3 contracts

- [x] Keep the absence checks for optional grading configuration type-safe.
- [x] Read public-check block coverage from canonical `targetBlockType` fields.

## Task 3 — Verify the backend CI gate

- [x] Run `npx tsc --noEmit --pretty false`.
- [x] Run the two affected test files.
- [x] Run the full backend test suite and build.
- [x] Check the final diff for whitespace or unrelated changes.

## Task 4 — Publish the fix

- [x] Commit with a conventional commit message.
- [x] Push the feature branch and verify the remote SHA.
