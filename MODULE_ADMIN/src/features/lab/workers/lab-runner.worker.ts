/**
 * lab-runner.worker.ts
 *
 * Web Worker for isolated in-browser code execution.
 * Workflow ref: Docs/workflows/03-webworker-execution.md
 *
 * Security:
 *  - Runs in a separate OS thread → no access to window/document/localStorage
 *  - Parent sets a 2s setTimeout; if Worker doesn't reply in time → parent.terminate()
 *
 * Message protocol:
 *   IN  → { submittedCode: string; testScript: string }
 *   OUT → WorkerResult (see lab.types.ts)
 */

interface WorkerInboundMessage {
  submittedCode: string;
  testScript: string;
}

interface WorkerTestCase {
  name: string;
  passed: boolean;
  message?: string;
}

interface WorkerResult {
  passed: boolean;
  timeMs: number;
  testCases: WorkerTestCase[];
  logs: string[];
  error?: string;
}

// Capture console.log inside Worker scope
const logs: string[] = [];
const testCases: WorkerTestCase[] = [];

// Override console in worker scope
const origConsoleLog = console.log.bind(console);
console.log = (...args: unknown[]) => {
  logs.push(args.map(String).join(' '));
  origConsoleLog(...args);
};

// Simple assertion helper injected into the test script scope
function assert(name: string, condition: boolean, message?: string) {
  testCases.push({ name, passed: condition, message });
}

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const { submittedCode, testScript } = event.data;
  const start = performance.now();

  try {
    // eslint-disable-next-line no-new-func
    const runnable = new Function('assert', 'console', `
      ${submittedCode}
      ${testScript}
    `);
    runnable(assert, console);

    const timeMs = Math.round(performance.now() - start);
    const passed = testCases.length > 0 && testCases.every((tc) => tc.passed);

    const result: WorkerResult = { passed, timeMs, testCases, logs };
    self.postMessage(result);
  } catch (err) {
    const timeMs = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);
    const result: WorkerResult = {
      passed: false,
      timeMs,
      testCases,
      logs,
      error,
    };
    self.postMessage(result);
  }
};
