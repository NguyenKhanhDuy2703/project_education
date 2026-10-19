import { describe, it, expect as vitestExpect } from 'vitest';
import { expect, AssertionError } from './expect';

describe('Matcher Core Suite (Subtask 4.1)', () => {
  describe('toBe', () => {
    it('passes for identical primitives', () => {
      vitestExpect(() => expect(42).toBe(42)).not.toThrow();
      vitestExpect(() => expect('hello').toBe('hello')).not.toThrow();
      vitestExpect(() => expect(true).toBe(true)).not.toThrow();
    });

    it('throws AssertionError on mismatch', () => {
      try {
        expect(10).toBe(20);
        vitestExpect.unreachable();
      } catch (err: any) {
        vitestExpect(err).toBeInstanceOf(AssertionError);
        vitestExpect(err.actual).toBe(10);
        vitestExpect(err.expected).toBe(20);
        vitestExpect(err.matcher).toBe('toBe');
      }
    });

    it('supports .not.toBe', () => {
      vitestExpect(() => expect(10).not.toBe(20)).not.toThrow();
      vitestExpect(() => expect('a').not.toBe('b')).not.toThrow();
      vitestExpect(() => expect(5).not.toBe(5)).toThrow(AssertionError);
    });
  });

  describe('toEqual', () => {
    it('passes for deeply equal structures', () => {
      const obj1 = { name: 'Alice', scores: [10, 20, { bonus: 5 }] };
      const obj2 = { name: 'Alice', scores: [10, 20, { bonus: 5 }] };
      vitestExpect(() => expect(obj1).toEqual(obj2)).not.toThrow();
    });

    it('throws AssertionError on deep mismatch', () => {
      try {
        expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 99 });
        vitestExpect.unreachable();
      } catch (err: any) {
        vitestExpect(err).toBeInstanceOf(AssertionError);
        vitestExpect(err.matcher).toBe('toEqual');
      }
    });

    it('supports .not.toEqual', () => {
      vitestExpect(() => expect({ a: 1 }).not.toEqual({ a: 2 })).not.toThrow();
      vitestExpect(() => expect([1, 2]).not.toEqual([1, 2])).toThrow(AssertionError);
    });
  });

  describe('toBeDefined', () => {
    it('passes when value is defined', () => {
      vitestExpect(() => expect(0).toBeDefined()).not.toThrow();
      vitestExpect(() => expect('').toBeDefined()).not.toThrow();
      vitestExpect(() => expect(null).toBeDefined()).not.toThrow();
      vitestExpect(() => expect(false).toBeDefined()).not.toThrow();
    });

    it('throws when value is undefined', () => {
      vitestExpect(() => expect(undefined).toBeDefined()).toThrow(AssertionError);
    });

    it('supports .not.toBeDefined', () => {
      vitestExpect(() => expect(undefined).not.toBeDefined()).not.toThrow();
      vitestExpect(() => expect('defined value').not.toBeDefined()).toThrow(AssertionError);
    });
  });

  describe('toContain', () => {
    it('checks substring in string', () => {
      vitestExpect(() => expect('Bearer token_123').toContain('token_123')).not.toThrow();
      vitestExpect(() => expect('Bearer token_123').toContain('Basic')).toThrow(AssertionError);
    });

    it('checks item in array', () => {
      vitestExpect(() => expect([1, 2, 3]).toContain(2)).not.toThrow();
      vitestExpect(() => expect([{ id: 1 }, { id: 2 }]).toContain({ id: 2 })).not.toThrow();
      vitestExpect(() => expect([1, 2, 3]).toContain(99)).toThrow(AssertionError);
    });

    it('checks property key in object', () => {
      vitestExpect(() => expect({ id: 'u1', role: 'admin' }).toContain('role')).not.toThrow();
      vitestExpect(() => expect({ id: 'u1' }).toContain('email')).toThrow(AssertionError);
    });

    it('supports .not.toContain', () => {
      vitestExpect(() => expect([1, 2]).not.toContain(3)).not.toThrow();
      vitestExpect(() => expect([1, 2]).not.toContain(2)).toThrow(AssertionError);
    });
  });
});
