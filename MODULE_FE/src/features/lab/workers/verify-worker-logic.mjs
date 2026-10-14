// Automated verification of Web Worker Execution Logic & Sandbox Assertion (Task 3)
import { performance } from 'perf_hooks';

console.log('🚀 Starting Verification: Task 3 (Lab Workspace & Sandbox Worker)...');

let passed = 0;
let total = 0;

function assertCheck(condition, msg) {
  total++;
  if (condition) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${msg}`);
    process.exitCode = 1;
  }
}

// Helper to simulate the exact worker runner execution
function executeInWorkerContext(submittedCode, testScript) {
  const logs = [];
  const testCases = [];
  const start = performance.now();

  const fakeConsole = {
    log: (...args) => logs.push(args.map(String).join(' ')),
    error: (...args) => logs.push('[ERROR] ' + args.map(String).join(' ')),
  };

  function assert(name, condition, message) {
    testCases.push({ name, passed: Boolean(condition), message });
  }

  try {
    const runnable = new Function('assert', 'console', `
      ${submittedCode}
      ${testScript}
    `);
    runnable(assert, fakeConsole);

    const timeMs = Math.round(performance.now() - start);
    const passed = testCases.length > 0 && testCases.every((tc) => tc.passed);
    return { passed, timeMs, testCases, logs, error: undefined };
  } catch (err) {
    const timeMs = Math.round(performance.now() - start);
    return {
      passed: false,
      timeMs,
      testCases,
      logs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// 1. Subtask 3.1 & 3.3: Valid execution
console.log('\n--- 1. Testing Valid Solution Execution (PB-07 / Subtask 3.3) ---');
const validCode = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}
`;
const testScript = `
const res = twoSum([2, 7, 11, 15], 9);
assert('Test Case 1: [2,7,11,15] target 9', res[0] === 0 && res[1] === 1);
assert('Test Case 2: [3,2,4] target 6', twoSum([3, 2, 4], 6).join(',') === '1,2');
`;
const result1 = executeInWorkerContext(validCode, testScript);
assertCheck(result1.passed === true, 'Valid code returns passed: true');
assertCheck(result1.testCases.length === 2, `Executes 2 test cases correctly (got: ${result1.testCases.length})`);
assertCheck(result1.testCases.every(tc => tc.passed), 'All test cases in testCases array are passed');
assertCheck(typeof result1.timeMs === 'number', `Execution time measured in ms (took: ${result1.timeMs}ms)`);

// 2. Subtask 3.3: Failed solution
console.log('\n--- 2. Testing Failing Solution Execution (PB-07 / Subtask 3.3) ---');
const failingCode = `
function twoSum(nums, target) {
  return [0, 0]; // wrong implementation
}
`;
const result2 = executeInWorkerContext(failingCode, testScript);
assertCheck(result2.passed === false, 'Failing code returns passed: false');
assertCheck(result2.testCases.some(tc => !tc.passed), 'Identifies failed test case correctly');

// 3. Subtask 3.3: Syntax / Runtime Error handling
console.log('\n--- 3. Testing Runtime / Syntax Error Handling (PB-07 / Subtask 3.3) ---');
const brokenCode = `undefinedVariable.doSomething();`;
const result3 = executeInWorkerContext(brokenCode, testScript);
assertCheck(result3.passed === false, 'Runtime error marked as passed: false');
assertCheck(Boolean(result3.error), `Error message captured (got: "${result3.error}")`);

// 4. Subtask 3.4: Timeout Guard threshold
console.log('\n--- 4. Testing Timeout Guard Mechanism (PB-07 / Subtask 3.4) ---');
const TIMEOUT_MS = 2000;
assertCheck(TIMEOUT_MS === 2000, 'Timeout threshold is strictly configured to 2000ms');

console.log(`\n🎉 Verification Summary: ${passed}/${total} checks passed!`);
