import { describe, expect, it } from 'vitest';
import {
  percentile,
  summarizeBenchmark,
  type SqlBenchmarkReport,
} from '@/features/lab/sql-engine/spike/benchmark';

function report(overrides: Partial<SqlBenchmarkReport> = {}): SqlBenchmarkReport {
  return {
    environment: {
      measuredAt: '2026-10-24T00:00:00.000Z',
      userAgent: 'test',
      platform: 'test',
      hardwareConcurrency: 8,
      deviceMemoryGb: 8,
      memoryApiAvailable: true,
    },
    coldInitMs: 1_000,
    warmInitSamplesMs: [200, 100, 300],
    querySamplesMs: [5, 10, 15, 20, 25],
    resetSamplesMs: [250, 200, 300],
    resetFailureCount: 0,
    memoryBeforeBytes: 100,
    memoryAfterBytes: 150,
    runtimeAssets: [{ name: 'pglite.wasm', encodedBodySize: 3 * 1024 * 1024, transferSize: 0 }],
    ...overrides,
  };
}

describe('SQL benchmark measurements', () => {
  it('uses nearest-rank percentiles without mutating samples', () => {
    const samples = [50, 10, 30, 20, 40];
    expect(percentile(samples, 50)).toBe(30);
    expect(percentile(samples, 95)).toBe(50);
    expect(samples).toEqual([50, 10, 30, 20, 40]);
  });

  it('passes only when supplied measurements meet every budget', () => {
    const summary = summarizeBenchmark(report());
    expect(summary.verdict).toBe('PASS');
    expect(summary.failedBudgets).toEqual([]);
    expect(summary.queryP95Ms).toBe(25);
    expect(summary.memoryGrowthBytes).toBe(50);
  });

  it('reports measured budget failures instead of replacing them with defaults', () => {
    const summary = summarizeBenchmark(
      report({
        coldInitMs: 2_001,
        querySamplesMs: [501],
        resetFailureCount: 1,
        runtimeAssets: [
          { name: 'pglite.data', encodedBodySize: 5 * 1024 * 1024, transferSize: 0 },
        ],
      }),
    );
    expect(summary.verdict).toBe('FAIL');
    expect(summary.failedBudgets).toEqual([
      'largestRuntimeAssetEncodedMb',
      'coldInitMs',
      'queryP95Ms',
      'resetFailureCount',
    ]);
  });
});
