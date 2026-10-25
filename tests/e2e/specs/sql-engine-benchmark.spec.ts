import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('measures PGlite in a real Chromium production preview', async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  await page.goto('/sql-benchmark.html');
  await expect(page.locator('html')).toHaveAttribute('data-benchmark-ready', 'true');

  const result = await page.evaluate(async () => {
    return (window as typeof window & {
      __runSqlBenchmark: () => Promise<unknown>;
    }).__runSqlBenchmark();
  });

  const typedResult = result as {
    report: {
      warmInitSamplesMs: number[];
      querySamplesMs: number[];
      resetSamplesMs: number[];
      resetFailureCount: number;
    };
    summary: { verdict: 'PASS' | 'FAIL'; failedBudgets: string[] };
  };

  expect(typedResult.report.warmInitSamplesMs).toHaveLength(5);
  expect(typedResult.report.querySamplesMs).toHaveLength(25);
  expect(typedResult.report.resetSamplesMs).toHaveLength(20);
  expect(typedResult.report.resetFailureCount).toBe(0);

  const outputPath = testInfo.outputPath('sql-benchmark-result.json');
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await testInfo.attach('sql-benchmark-result', {
    path: outputPath,
    contentType: 'application/json',
  });

  console.log(`SQL_BENCHMARK_RESULT=${JSON.stringify(result)}`);
});
