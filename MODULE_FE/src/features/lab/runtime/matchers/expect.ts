export class AssertionError extends Error {
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

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

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

export interface Matchers {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toBeDefined(): void;
  toContain(item: any): void;
}

export interface Expectation extends Matchers {
  not: Matchers;
}

export function expect(actual: any): Expectation {
  const createMatchers = (isNot: boolean): Matchers => ({
    toBe(expected: any) {
      const pass = Object.is(actual, expected);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          isNot
            ? `Expected value not to be ${formatValue(expected)}, but received ${formatValue(actual)}`
            : `Expected ${formatValue(expected)}, but received ${formatValue(actual)}`,
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
            ? `Expected values not to deeply equal ${formatValue(expected)}`
            : `Expected deeply equal to ${formatValue(expected)}, but received ${formatValue(actual)}`,
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
          isNot ? `Expected value to be undefined, but received ${formatValue(actual)}` : 'Expected value to be defined',
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
            ? `Expected ${formatValue(actual)} not to contain ${formatValue(item)}`
            : `Expected ${formatValue(actual)} to contain ${formatValue(item)}`,
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
