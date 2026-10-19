# SQL Engine Build Measurement and Browser Benchmark Plan

> **Document ID**: REPORT-SQL-SPIKE-02  
> **Status**: PARTIALLY MEASURED  
> **Updated**: 2026-10-18  
> **Engine**: `@electric-sql/pglite` 0.5.10

## Verified production-build measurements

Command: `npm run build` in `MODULE_FE` on 2026-10-18.

| Asset | Raw size | Gzip shown by Vite |
|---|---:|---:|
| Main application JS | 991.04 kB | 288.52 kB |
| Lazy SQL workspace | 25.40 kB | 7.46 kB |
| SQL worker JS | 1,657.10 kB | not reported |
| PGlite WASM | 10,498.45 kB | 3,746.65 kB |
| PGlite data | 6,248.21 kB | not reported |
| initdb WASM | 300.12 kB | 132.95 kB |

The SQL workspace is lazy and the worker/WASM assets are created only when a SQL lab initializes. PGlite is not part of the initial main bundle, but its first-use transfer is substantial.

## Runtime metrics not yet certified

Cold/warm initialization, query p50/p95, reset latency, and memory after repeated resets have not been measured with a reproducible browser harness on named hardware. Earlier values in this file were hard-coded and have been removed. A generated report must include browser/version, OS/hardware, cold and warm caches, at least 30 query samples, 20 reset cycles, and JOIN/aggregate/CTE/window/NULL/date/numeric fixtures.

## Decision

PGlite remains selected because it executes PostgreSQL in an isolated Web Worker and preserves curriculum dialect fidelity. This is not a claim of complete PostgreSQL feature parity. There is no silent SQLite fallback; unsupported environments receive a retryable error.
