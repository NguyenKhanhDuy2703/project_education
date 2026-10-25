export const SQL_BENCHMARK_BUDGETS = {
  largestRuntimeAssetEncodedMb: 4,
  coldInitMs: 2_000,
  queryP95Ms: 500,
  resetFailureCount: 0,
} as const;

export interface SqlBenchmarkEnvironment {
  measuredAt: string;
  userAgent: string;
  platform: string;
  hardwareConcurrency: number | null;
  deviceMemoryGb: number | null;
  memoryApiAvailable: boolean;
}

export interface SqlBenchmarkAsset {
  name: string;
  encodedBodySize: number;
  transferSize: number;
}

export interface SqlBenchmarkReport {
  environment: SqlBenchmarkEnvironment;
  coldInitMs: number;
  warmInitSamplesMs: number[];
  querySamplesMs: number[];
  resetSamplesMs: number[];
  resetFailureCount: number;
  memoryBeforeBytes: number | null;
  memoryAfterBytes: number | null;
  runtimeAssets: SqlBenchmarkAsset[];
}

export interface SqlBenchmarkSummary {
  coldInitMs: number;
  warmInitP50Ms: number;
  warmInitP95Ms: number;
  queryP50Ms: number;
  queryP95Ms: number;
  resetP50Ms: number;
  resetP95Ms: number;
  resetFailureCount: number;
  memoryGrowthBytes: number | null;
  largestRuntimeAssetEncodedMb: number;
  verdict: 'PASS' | 'FAIL';
  failedBudgets: string[];
}

export function percentile(samples: number[], percentileValue: number): number {
  if (samples.length === 0) return 0;
  if (percentileValue < 0 || percentileValue > 100) {
    throw new RangeError('percentileValue must be between 0 and 100.');
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const rank = Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[rank];
}

function bytesToMiB(bytes: number): number {
  return bytes / (1024 * 1024);
}

export function summarizeBenchmark(report: SqlBenchmarkReport): SqlBenchmarkSummary {
  const largestRuntimeAssetEncodedMb = Math.max(
    0,
    ...report.runtimeAssets.map((asset) => bytesToMiB(asset.encodedBodySize)),
  );
  const queryP95Ms = percentile(report.querySamplesMs, 95);
  const failedBudgets: string[] = [];

  if (largestRuntimeAssetEncodedMb > SQL_BENCHMARK_BUDGETS.largestRuntimeAssetEncodedMb) {
    failedBudgets.push('largestRuntimeAssetEncodedMb');
  }
  if (report.coldInitMs > SQL_BENCHMARK_BUDGETS.coldInitMs) failedBudgets.push('coldInitMs');
  if (queryP95Ms > SQL_BENCHMARK_BUDGETS.queryP95Ms) failedBudgets.push('queryP95Ms');
  if (report.resetFailureCount > SQL_BENCHMARK_BUDGETS.resetFailureCount) {
    failedBudgets.push('resetFailureCount');
  }

  return {
    coldInitMs: report.coldInitMs,
    warmInitP50Ms: percentile(report.warmInitSamplesMs, 50),
    warmInitP95Ms: percentile(report.warmInitSamplesMs, 95),
    queryP50Ms: percentile(report.querySamplesMs, 50),
    queryP95Ms,
    resetP50Ms: percentile(report.resetSamplesMs, 50),
    resetP95Ms: percentile(report.resetSamplesMs, 95),
    resetFailureCount: report.resetFailureCount,
    memoryGrowthBytes:
      report.memoryBeforeBytes === null || report.memoryAfterBytes === null
        ? null
        : report.memoryAfterBytes - report.memoryBeforeBytes,
    largestRuntimeAssetEncodedMb,
    verdict: failedBudgets.length === 0 ? 'PASS' : 'FAIL',
    failedBudgets,
  };
}
