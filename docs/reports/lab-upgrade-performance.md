# Lab Platform Performance Verification

**Updated**: 2026-10-24
**Status**: RUNTIME MEASURED; ASSET BUDGET FAILED

## Build evidence

The `MODULE_FE` production build succeeds. Current output separates the SQL UI into a 28.79 kB raw / 8.34 kB gzip lazy chunk and keeps PGlite in dedicated runtime assets. The main application bundle is 1,145.56 kB raw / 329.44 kB gzip.

The measured Chrome run observed a 10,498,455-byte PGlite WASM encoded body and a 2,132,536-byte data encoded body. Product UX therefore retains initialization and recovery state, especially for a cold cache.

## Verified controls

- SQL workspace is lazy-loaded.
- PGlite runs outside the UI thread.
- Worker execution has a deadline and deterministic restart.
- Result rows, columns, serialized output, schema, and seed sizes are bounded.
- Worker and in-memory database are disposed when the workspace unmounts.

## Browser measurements

The reproducible Chromium run on 2026-10-24 measured 1,565.3 ms cold initialization, 976.2/1,050.4 ms warm p50/p95, 0.7/2.3 ms query p50/p95, and 867.7/937.3 ms reset p50/p95 with 20/20 successful reset cycles. The unforced-GC JS heap delta was +64,106,071 bytes and is informational, not proof of a leak.

The largest encoded runtime asset was 10.01 MiB, so the declared <= 4 MiB asset budget failed. See [SQL Engine Browser Benchmark Report](sql-engine-spike-benchmark.md) for environment, method, and traceable raw-artifact location.
