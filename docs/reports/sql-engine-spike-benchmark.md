# SQL Engine Browser Benchmark Report

> **Document ID**: REPORT-SQL-SPIKE-02
> **Status**: MEASURED — ASSET BUDGET FAILED
> **Measured**: 2026-10-24T07:13:10.473Z
> **Engine**: `@electric-sql/pglite` 0.5.10

## Environment and method

| Attribute | Value |
|---|---|
| Browser | Chrome 156.0.8078.4, headless Chromium channel |
| OS / platform | Windows 10 x64 / Windows |
| Logical CPUs | 12 |
| Reported device memory | 16 GB |
| Browser memory API | Available |
| Page | Production preview, isolated `sql-benchmark.html` entry |
| Harness | `tests/e2e/specs/sql-engine-benchmark.spec.ts` |
| Raw artifact | `tests/e2e/test-results/**/sql-benchmark-result.json` (generated, ignored) |

The harness creates a fresh in-memory PGlite database, applies a 500-row deterministic fixture, measures one cold initialization, five warm initializations, 25 aggregate queries, and 20 close/recreate reset cycles. It reports observed resource timing rather than hard-coded values.

## Runtime measurements

| Metric | Result | Budget | Outcome |
|---|---:|---:|---|
| Cold initialization | 1,565.3 ms | <= 2,000 ms | PASS |
| Warm initialization p50 | 976.2 ms | informational | measured |
| Warm initialization p95 | 1,050.4 ms | informational | measured |
| Query p50 | 0.7 ms | informational | measured |
| Query p95 | 2.3 ms | <= 500 ms | PASS |
| Reset p50 | 867.7 ms | informational | measured |
| Reset p95 | 937.3 ms | informational | measured |
| Reset failures | 0 / 20 | 0 | PASS |
| JS heap delta without forced GC | +64,106,071 bytes | informational | measured, not a leak verdict |
| Largest encoded runtime asset | 10.01 MiB | <= 4 MiB | **FAIL** |

The memory delta is not treated as a leak measurement because the browser run does not force garbage collection. Reset reliability is verified independently by 20 successful cycles.

## Observed runtime assets

| Asset | Encoded body size | Transfer size |
|---|---:|---:|
| `initdb-BOrRGPBe.wasm` | 300,129 B | 300,429 B |
| `pglite-Djh-vrdJ.wasm` | 10,498,455 B | 10,498,755 B |
| `pglite-CB2rjG_k.data` | 2,132,536 B | 2,132,836 B |

The production build additionally reports the SQL workspace as a separate 28.79 kB raw / 8.34 kB gzip chunk. PGlite stays outside the initial route, but its first-use runtime asset exceeds the current 4 MiB encoded-asset budget.

## Decision

PGlite remains functionally selected for PostgreSQL dialect fidelity and isolation, but the performance release gate is **not fully satisfied**. Cold initialization, query latency, and reset reliability pass; runtime asset size fails. Release requires either an explicit product acceptance of the first-use download or an optimization that brings the measured asset under the declared budget.
