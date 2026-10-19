# Lab Platform Performance Verification

**Updated**: 2026-10-18  
**Status**: BUILD VERIFIED; BROWSER BENCHMARK PENDING

## Build evidence

The `MODULE_FE` production build succeeds. Current output separates the SQL UI into a 25.40 kB raw / 7.46 kB gzip lazy chunk and keeps PGlite in a dedicated worker plus WASM/data assets. The main application bundle is 991.04 kB raw / 288.52 kB gzip.

PGlite first use still downloads a 10,498.45 kB WASM asset (3,746.65 kB gzip as reported by Vite), a 6,248.21 kB data asset, and a 1,657.10 kB SQL worker. Product UX therefore shows initialization and recovery state, especially for a cold cache.

## Verified controls

- SQL workspace is lazy-loaded.
- PGlite runs outside the UI thread.
- Worker execution has a deadline and deterministic restart.
- Result rows, columns, serialized output, schema, and seed sizes are bounded.
- Worker and in-memory database are disposed when the workspace unmounts.

## Pending measurements

No reproducible real-browser numbers are certified for cold/warm initialization, query percentiles, reset latency, or memory. See `sql-engine-spike-benchmark.md` for the required protocol. Older hard-coded timing and “100% passed” statements are superseded by this report.
