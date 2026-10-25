# PGlite SQL Learning Sandbox - Analysis & Execution Plan

> **Status**: IMPLEMENTED — browser benchmark measured; release asset budget failed; legacy database authoring remains externally gated
> **Goal**: Use isolated PGlite/WebAssembly databases for SQL learning without executing learner SQL against the platform PostgreSQL database.
> **Scope rule**: Implementation was authorized by the user's explicit command on 2026-10-18. Preserve unrelated working-tree changes.

## Verified Current State

- `MODULE_FE` already depends on `@electric-sql/pglite@0.5.10`.
- SQL labs already route to `SqlPracticeWorkspace`, which uses `SqlWorkerAdapter` and `sql-runner.worker.ts`.
- Each lab currently creates an ephemeral in-memory PGlite database, applies schema/seed SQL, and runs learner queries in a Web Worker.
- The current SQL guard allows one `SELECT`, `WITH`, or `EXPLAIN` statement and blocks DDL/DML.
- The backend platform database stores lab definitions and submissions; learner SQL is not intentionally sent to it for execution.
- Current frontend verification: 36 test files and 175 tests pass; production build passes.
- Actual production assets include ~10.50 MB PGlite WASM, ~6.25 MB PGlite data, and ~1.68 MB SQL worker JavaScript. The main application JS is ~599 KB gzip.
- Official Vite recommendations (`optimizeDeps.exclude` and ES worker format) are not configured.
- Existing benchmark values are hard-coded in a TypeScript object rather than produced by a reproducible browser benchmark.

## Confirmed Problems

- SQL submission reads stale React state after awaiting query execution, so the recorded pass/fail can describe the previous run.
- The backend accepts client-provided `status`, `timeMs`, and `testLogs`; a learner can forge a passed submission.
- Student lab responses expose `expectedQueryResult`, allowing answers to be read in network/devtools.
- Admin SQL “Test Solution” uses regex/heuristics instead of executing the reference solution in PGlite.
- Worker timeout recovery respawns and reinitializes asynchronously, but reports `ready` before reinitialization completes.
- Initialization failures do not expose a useful learner-facing error or retry state.
- `PgEngineCore.getSchemaOverview()` interpolates table names into SQL instead of using safe identifier handling.
- Query result rendering has no row/column/output-size ceiling.
- PGlite is statically reachable through the workspace registry, contributing to the oversized main application chunk.
- Documentation overstates “100% PostgreSQL parity,” “AST-level guard,” measured performance, and security guarantees.

## Decision Gates

- [x] Decide grading authority: browser preview plus server-authoritative ephemeral PGlite verification.
- [x] Decide SQL capability policy: per-lab policy; read-only by default with opt-in isolated DDL/DML labs.
- [x] Decide persistence: fresh dataset per visit; persist learner SQL draft only.

## Task 1: Lock Architecture and Contracts

- [x] **1.1 Define trust boundary and grading flow**
  - Files: `docs/adr/`, lab API contract documentation.
  - Verify: threat model explicitly distinguishes local preview from authoritative completion.
- [x] **1.2 Define SQL lab configuration V2**
  - Files: shared frontend/admin/backend lab types and DTOs.
  - Verify: schema covers dataset, execution policy, grading policy, limits, and version migration.
- [x] **1.3 Define supported browser and fallback behavior**
  - Files: SQL sandbox runbook.
  - Verify: Chrome, Edge, Firefox, and Safari behavior plus unsupported-WASM UX are documented.
- [x] **1.4 Add hidden verification SQL for mutable labs**
  - Files: shared frontend/admin/backend SQL lab contracts.
  - Verify: builds accept optional `verificationSql` without exposing it as a learner requirement.

## Task 2: Harden the PGlite Runtime

- [x] **2.1 Adopt explicit PGlite readiness and supported Vite configuration**
  - Files: `PgEngineCore.ts`, `SqlWorkerAdapter.ts`, `vite.config.ts`.
  - Verify: production worker initializes reliably and build emits separate PGlite assets without browser-external warnings.
- [x] **2.2 Make worker lifecycle deterministic**
  - Files: worker protocol and adapter.
  - Verify: init, execute, cancel, timeout, respawn, reset, lab switch, and dispose tests pass without state bleed.
- [x] **2.3 Enforce resource limits**
  - Files: runtime policy/adapter and result types.
  - Verify: execution timeout, maximum returned rows/cells/bytes, schema/seed size, and friendly limit errors are tested.
- [x] **2.4 Replace regex-only policy claims with a defensible statement policy**
  - Files: SQL guard/policy module and tests.
  - Verify: allow/deny matrix covers CTE DML, EXPLAIN ANALYZE, COPY, CALL, DO, transaction commands, comments, quoted identifiers, and multi-statement input.

## Task 3: Correct Learner Execution and Submission

- [x] **3.1 Return one immutable run outcome from Run Query**
  - Files: `SqlPracticeWorkspace.tsx` and SQL workspace tests.
  - Verify: Submit grades the query executed in that same action, never stale React state.
- [x] **3.2 Separate Run from Submit state**
  - Files: SQL workspace/controller hook.
  - Verify: edits after a successful run invalidate the previous result; double submission and lab switching are safe.
- [x] **3.3 Implement selected grading authority**
  - Files: student DTO mapper, submission endpoint/service, optional server PGlite grader.
  - Verify: forged client status cannot create a false pass when authoritative grading is enabled.
- [x] **3.4 Protect hidden grading material**
  - Files: backend lab response mapping and SQL grading contracts.
  - Verify: learner API responses contain schema/visible seed data but no hidden expected rows or model solution.

## Task 4: Upgrade Admin SQL Authoring

- [x] **4.1 Use the same PGlite engine to validate schema and seed SQL**
  - Files: admin SQL builder and shared SQL runtime package/module.
  - Verify: invalid DDL/DML produces real PostgreSQL diagnostics.
- [x] **4.2 Execute reference solutions to generate expected fixtures**
  - Files: admin SQL builder.
  - Verify: JOIN, aggregate, CTE, window, NULL, date, numeric, and ordering cases produce deterministic fixtures without regex simulation.
- [x] **4.3 Add authoring policy and preflight controls**
  - Files: admin form/types and backend DTO validation.
  - Verify: content cannot be submitted/published with invalid schema, seed, solution, limits, or grading configuration.

## Task 5: Performance, UX, and Observability

- [x] **5.1 Lazy-load the SQL workspace and PGlite runtime**
  - Files: workspace registry/router boundaries.
  - Verify: non-SQL routes do not download PGlite assets.
- [x] **5.2 Add explicit initialization/progress/recovery UI**
  - Files: SQL workspace and schema preview.
  - Verify: slow initialization, offline cache miss, unsupported browser, worker crash, timeout, and retry are understandable and keyboard accessible.
- [x] **5.3 Create reproducible browser benchmarks**
  - Files: benchmark harness and generated report.
  - Verify: cold/warm init, p50/p95 query, reset, memory proxy, downloaded bytes, and target-device results are measured rather than hard-coded.
- [x] **5.4 Add privacy-safe telemetry**
  - Files: existing analytics/telemetry boundary if available.
  - Verify: engine errors and timings exclude learner SQL, hidden fixtures, and sensitive data.

## Task 6: Compatibility, Documentation, and Release

- [x] **6.1 Migrate legacy SQL lab configurations to the selected contract version**
  - Files: codecs, seed data, admin load/save path.
  - Verify: all existing SQL labs initialize and grade identically or have documented corrections.
- [x] **6.2 Correct architecture, security, and benchmark documentation**
  - Files: SQL runbook, security report, performance report, ADR.
  - Verify: every claim links to a real test or generated measurement.
- [ ] **6.3 Run complete release gates** — automated gates complete; runtime asset budget and database state audit remain open
  - Files: no new functional files beyond planned scope.
  - Verify: FE, Admin, and BE tests/builds pass; real-browser SQL journeys pass; production assets meet budgets; diff contains no unrelated changes.

## Human Confirmation Gate

Satisfied: the user explicitly requested implementation after the architecture recommendation.

## Verification Evidence — 2026-10-18

- [x] Backend: 13 tests pass; Nest production build passes.
- [x] Learner frontend: 37 files / 182 tests pass; Vite production build passes.
- [x] Admin: 5 files / 40 tests pass; Vite production build passes.
- [x] Prisma seed TypeScript compilation passes without executing the seed.
- [x] Compiled backend grading worker executes real PGlite SELECT and aggregate queries successfully.
- [x] Main FE bundle is 288.53 kB gzip; SQL workspace is a separate 7.47 kB gzip chunk; PGlite WASM is 3,746.65 kB gzip.
- [x] Cold/warm real-browser timing, query percentiles, reset cycles, resource sizes, and an informational memory delta were measured on Chrome 156 / Windows / 12 logical CPUs / 16 GB reported device memory on 2026-10-24. The largest encoded runtime asset was 10.01 MiB, so the <= 4 MiB budget failed.
- [ ] Updated V2 fixtures have not been applied to an existing database automatically because the project seed performs broader content upserts.
