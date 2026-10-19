/**
 * lab-runner.worker.ts
 *
 * Upgraded Web Worker for isolated in-browser code execution.
 * Implements Protocol V1 with:
 * - Built-in matcher core (expect, toBe, toEqual, toBeDefined, toContain, .not)
 * - Structured test step runner: test(name, fn, hint), it(name, fn, hint)
 * - Backward compatible assert(name, condition, ...)
 * - Security policy: disabled fetch, XHR, WebSocket, importScripts
 * - Capability bounds: max 100 log lines to prevent heap exhaustion
 */
import type { WorkerTestCase, WorkerResult } from '@/types/lab.types';

interface WorkerInboundMessage {
  submittedCode: string;
  testScript: string;
}

const MAX_LOGS = 100;
const MAX_LOG_LENGTH = 500;

class AssertionError extends Error {
  actual: any;
  expected: any;
  matcher: string;

  constructor(message: string, actual?: any, expected?: any, matcher: string = '') {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
    this.matcher = matcher;
  }
}

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function formatValue(v: any): string {
  if (v === undefined) return 'undefined';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function createExpect(actual: any) {
  const createMatchers = (isNot: boolean) => ({
    toBe(expected: any) {
      const pass = Object.is(actual, expected);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          isNot
            ? `Expected not to be ${formatValue(expected)}`
            : `Expected ${formatValue(expected)}, received ${formatValue(actual)}`,
          actual,
          expected,
          isNot ? 'not.toBe' : 'toBe',
        );
      }
    },
    toEqual(expected: any) {
      const pass = deepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          isNot
            ? `Expected values not to deeply equal`
            : `Expected deeply equal ${formatValue(expected)}, received ${formatValue(actual)}`,
          actual,
          expected,
          isNot ? 'not.toEqual' : 'toEqual',
        );
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          isNot ? `Expected value to be undefined` : 'Expected value to be defined',
          actual,
          undefined,
          isNot ? 'not.toBeDefined' : 'toBeDefined',
        );
      }
    },
    toContain(item: any) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(item));
      } else if (Array.isArray(actual)) {
        pass = actual.some((el) => deepEqual(el, item));
      } else if (actual && typeof actual === 'object') {
        pass = Object.prototype.hasOwnProperty.call(actual, item);
      }
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          isNot
            ? `Expected collection not to contain ${formatValue(item)}`
            : `Expected collection to contain ${formatValue(item)}`,
          actual,
          item,
          isNot ? 'not.toContain' : 'toContain',
        );
      }
    },
  });

  return {
    ...createMatchers(false),
    not: createMatchers(true),
  };
}

// Global runtime scope state
const logs: string[] = [];
const testCases: WorkerTestCase[] = [];

// Safe sandboxed console
const sandboxedConsole = {
  log: (...args: unknown[]) => {
    if (logs.length < MAX_LOGS) {
      const line = args.map((a) => (typeof a === 'object' ? formatValue(a) : String(a))).join(' ');
      logs.push(line.slice(0, MAX_LOG_LENGTH));
    } else if (logs.length === MAX_LOGS) {
      logs.push('[Console output truncated: exceeded 100 log lines]');
    }
  },
  warn: (...args: unknown[]) => sandboxedConsole.log('[WARN]', ...args),
  error: (...args: unknown[]) => sandboxedConsole.log('[ERROR]', ...args),
  info: (...args: unknown[]) => sandboxedConsole.log('[INFO]', ...args),
};

// Security sandbox: disable network primitives in execution scope
const blockedNetworkApi = () => {
  throw new Error('SecurityError: Network access is disabled in the practice lab sandbox.');
};

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  logs.length = 0;
  testCases.length = 0;

  const { submittedCode, testScript } = event.data;
  const start = performance.now();

  // Test runner functions injected into sandbox
  const test = (name: string, fn: () => void, hint?: string) => {
    const tStart = performance.now();
    try {
      fn();
      testCases.push({
        name,
        passed: true,
        hint,
        executionTimeMs: Math.round(performance.now() - tStart),
      });
    } catch (err: any) {
      testCases.push({
        name,
        passed: false,
        message: err.message,
        expected: err.expected !== undefined ? formatValue(err.expected) : undefined,
        actual: err.actual !== undefined ? formatValue(err.actual) : undefined,
        matcher: err.matcher,
        hint,
        executionTimeMs: Math.round(performance.now() - tStart),
      });
    }
  };

  const assert = (
    name: string,
    condition: boolean,
    message?: string,
    expected?: any,
    actual?: any,
    hint?: string,
  ) => {
    testCases.push({
      name,
      passed: Boolean(condition),
      message,
      expected: expected !== undefined ? formatValue(expected) : undefined,
      actual: actual !== undefined ? formatValue(actual) : undefined,
      hint,
    });
  };

  try {
    // eslint-disable-next-line no-new-func
    const runnable = new Function(
      'expect',
      'test',
      'it',
      'assert',
      'console',
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'importScripts',
      `
      "use strict";
      ${submittedCode}
      ${testScript}
    `,
    );

    runnable(
      createExpect,
      test,
      test, // alias it -> test
      assert,
      sandboxedConsole,
      blockedNetworkApi,
      blockedNetworkApi,
      blockedNetworkApi,
      blockedNetworkApi,
    );

    const timeMs = Math.round(performance.now() - start);
    const passed = testCases.length > 0 && testCases.every((tc) => tc.passed);

    const result: WorkerResult = {
      protocolVersion: '1.0',
      passed,
      timeMs,
      testCases,
      logs,
    };
    self.postMessage(result);
  } catch (err) {
    const timeMs = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);
    const result: WorkerResult = {
      protocolVersion: '1.0',
      passed: false,
      timeMs,
      testCases,
      logs,
      error,
    };
    self.postMessage(result);
  }
};
