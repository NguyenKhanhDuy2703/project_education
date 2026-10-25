import { PGlite } from '@electric-sql/pglite';
import {
  summarizeBenchmark,
  type SqlBenchmarkAsset,
  type SqlBenchmarkReport,
  type SqlBenchmarkSummary,
} from './benchmark';

const schemaSql = `
  CREATE TABLE benchmark_orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL
  );
  INSERT INTO benchmark_orders (id, customer_id, amount, status)
  SELECT value, value % 25, value * 1.25, CASE WHEN value % 3 = 0 THEN 'paid' ELSE 'pending' END
  FROM generate_series(1, 500) AS value;
`;

const benchmarkQuery = `
  SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS revenue
  FROM benchmark_orders
  WHERE status = 'paid'
  GROUP BY customer_id
  ORDER BY revenue DESC;
`;

type MemoryPerformance = Performance & { memory?: { usedJSHeapSize: number } };
type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
  userAgentData?: { platform?: string };
};

async function measure<T>(operation: () => Promise<T>): Promise<{ durationMs: number; value: T }> {
  const startedAt = performance.now();
  const value = await operation();
  return { durationMs: performance.now() - startedAt, value };
}

async function createSeededDatabase(): Promise<PGlite> {
  const database = await PGlite.create('memory://');
  await database.exec(schemaSql);
  return database;
}

function runtimeAssets(): SqlBenchmarkAsset[] {
  return performance
    .getEntriesByType('resource')
    .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
    .filter((entry) => /pglite|\.wasm|\.data|initdb/i.test(entry.name))
    .map((entry) => ({
      name: new URL(entry.name).pathname.split('/').pop() || entry.name,
      encodedBodySize: entry.encodedBodySize,
      transferSize: entry.transferSize,
    }));
}

async function runSqlBenchmark(): Promise<{
  report: SqlBenchmarkReport;
  summary: SqlBenchmarkSummary;
}> {
  const memoryPerformance = performance as MemoryPerformance;
  const navigatorWithMemory = navigator as NavigatorWithMemory;
  const memoryBeforeBytes = memoryPerformance.memory?.usedJSHeapSize ?? null;

  const coldMeasurement = await measure(createSeededDatabase);
  await coldMeasurement.value.close();

  const warmInitSamplesMs: number[] = [];
  for (let sample = 0; sample < 5; sample += 1) {
    const measurement = await measure(createSeededDatabase);
    warmInitSamplesMs.push(measurement.durationMs);
    await measurement.value.close();
  }

  const queryDatabase = await createSeededDatabase();
  const querySamplesMs: number[] = [];
  for (let sample = 0; sample < 25; sample += 1) {
    const measurement = await measure(() => queryDatabase.query(benchmarkQuery));
    querySamplesMs.push(measurement.durationMs);
  }
  await queryDatabase.close();

  const resetSamplesMs: number[] = [];
  let resetFailureCount = 0;
  for (let cycle = 0; cycle < 20; cycle += 1) {
    try {
      const measurement = await measure(async () => {
        const database = await createSeededDatabase();
        await database.close();
      });
      resetSamplesMs.push(measurement.durationMs);
    } catch {
      resetFailureCount += 1;
    }
  }

  const report: SqlBenchmarkReport = {
    environment: {
      measuredAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigatorWithMemory.userAgentData?.platform || navigator.platform || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemoryGb: navigatorWithMemory.deviceMemory ?? null,
      memoryApiAvailable: Boolean(memoryPerformance.memory),
    },
    coldInitMs: coldMeasurement.durationMs,
    warmInitSamplesMs,
    querySamplesMs,
    resetSamplesMs,
    resetFailureCount,
    memoryBeforeBytes,
    memoryAfterBytes: memoryPerformance.memory?.usedJSHeapSize ?? null,
    runtimeAssets: runtimeAssets(),
  };

  return { report, summary: summarizeBenchmark(report) };
}

declare global {
  interface Window {
    __runSqlBenchmark: typeof runSqlBenchmark;
  }
}

window.__runSqlBenchmark = runSqlBenchmark;
document.documentElement.dataset.benchmarkReady = 'true';
