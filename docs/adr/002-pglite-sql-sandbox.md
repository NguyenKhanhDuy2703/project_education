# ADR-002: PGlite SQL Learning Sandbox

- Status: Accepted
- Date: 2026-10-18
- Owners: Learning Platform

## Context

Learners need real PostgreSQL behavior without executing untrusted SQL against the platform PostgreSQL database. The browser must provide immediate feedback, while recorded completion must not trust a client-provided pass status or expose hidden grading fixtures.

## Decision

1. Each SQL lab runs in a fresh, in-memory PGlite database inside a dedicated Web Worker.
2. The browser loads the published schema and seed fixture, executes queries, renders results, and provides non-authoritative feedback.
3. On submission, the API accepts the learner SQL and client timing only. For SQL labs, the backend creates an ephemeral PGlite instance, applies the authoritative schema/seed, executes the query under the lab policy, compares it with hidden expected output, stores the server-derived status, and disposes the instance.
4. Learner SQL never executes against the platform PostgreSQL database. That database stores content, identities, entitlements, and submission records only.
5. SQL policy is configured per lab. Existing labs default to `read_only`; future mutation/schema labs may opt into `mutable` and always start from a fresh fixture.
6. Dataset state is not persisted across visits. Only the learner's editor draft may be persisted by the UI.

## Trust Boundary

- Trusted: published lab configuration held by the backend, backend grader, stored server-derived status.
- Untrusted: learner SQL, browser result/diff, client status, client logs, client execution time.
- Public learner payload: instructions, starter SQL, visible schema, visible seed data, execution policy and limits.
- Hidden payload: reference solution, expected result, hidden grading options, author notes.

## Failure Policy

- Invalid or forbidden SQL records a failed attempt with a safe diagnostic.
- Sandbox initialization or infrastructure failure returns a retryable server error and does not record a failed learner attempt.
- Timeout terminates the grading instance and records a failed attempt with a timeout diagnostic.
- The browser remains usable when server verification is temporarily unavailable, but cannot award completion.

## Consequences

- Browser feedback remains fast and isolated.
- Completion cannot be forged by changing the submission request.
- Backend submissions incur short-lived WASM startup and memory cost; concurrency must be bounded and measured.
- Expected rows and reference solutions can be removed from learner-facing responses.
