import { describe, it, expect } from 'vitest';
import {
  validateBlankAnswers,
  formatBlankValue,
  assembleClozeCode,
  getDefaultAnswers,
  isClozeComplete,
} from '@/features/lab/runtime/cloze/clozeEngine';
import type { BlankDefinition, TemplateSegment } from '@/types/lab.types';

describe('Smart Cloze Engine (Subtask 2.1)', () => {
  const mockBlanks: BlankDefinition[] = [
    {
      id: 'status_code',
      kind: 'http_status',
      label: 'HTTP Status',
      valueType: 'number',
      required: true,
      defaultValue: 200,
      options: [
        { value: 200, label: '200 OK' },
        { value: 401, label: '401 Unauthorized' },
        { value: 404, label: '404 Not Found' },
      ],
    },
    {
      id: 'res_property',
      kind: 'path',
      label: 'Response Property',
      valueType: 'string',
      required: true,
      defaultValue: 'res.data.token',
    },
    {
      id: 'assertion_matcher',
      kind: 'matcher',
      label: 'Matcher',
      valueType: 'enum',
      required: true,
      defaultValue: 'toBe',
      options: [
        { value: 'toBe', label: 'toBe' },
        { value: 'toEqual', label: 'toEqual' },
        { value: 'toBeDefined', label: 'toBeDefined' },
      ],
    },
    {
      id: 'expected_val',
      kind: 'expected_value',
      label: 'Expected Value',
      valueType: 'string',
      required: true,
      defaultValue: 'jwt_mock_token',
    },
  ];

  const mockTemplate: TemplateSegment[] = [
    { kind: 'managed', label: 'Framework setup', code: 'const res = { status: 200, data: { token: "jwt_mock_token" } };\n' },
    { kind: 'readonly', text: 'expect(res.status).' },
    { kind: 'blank', blankId: 'assertion_matcher' },
    { kind: 'readonly', text: '(' },
    { kind: 'blank', blankId: 'status_code' },
    { kind: 'readonly', text: ');\n' },
    { kind: 'readonly', text: 'expect(' },
    { kind: 'blank', blankId: 'res_property' },
    { kind: 'readonly', text: ').toBe(' },
    { kind: 'blank', blankId: 'expected_val' },
    { kind: 'readonly', text: ');' },
  ];

  describe('validateBlankAnswers', () => {
    it('validates a complete, valid set of answers', () => {
      const answers = {
        status_code: 200,
        res_property: 'res.data.token',
        assertion_matcher: 'toBe',
        expected_val: 'jwt_mock_token',
      };

      const result = validateBlankAnswers(mockBlanks, answers);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('rejects missing required blanks with helpful localized messages', () => {
      const answers = {
        status_code: 200,
        res_property: '',
        assertion_matcher: 'toBe',
        expected_val: undefined,
      };

      const result = validateBlankAnswers(mockBlanks, answers);
      expect(result.isValid).toBe(false);
      expect(result.errors['res_property']).toBe('Response Property is required.');
      expect(result.errors['expected_val']).toBe('Expected Value is required.');
    });

    it('validates HTTP status code bounds (100–599 integer)', () => {
      const invalidStatuses = [99, 600, 'abc', 3.14];
      for (const st of invalidStatuses) {
        const res = validateBlankAnswers(
          [{ id: 'status', kind: 'http_status', label: 'Status', valueType: 'number' }],
          { status: st },
        );
        expect(res.isValid).toBe(false);
        expect(res.errors['status']).toContain('100–599');
      }

      const validRes = validateBlankAnswers(
        [{ id: 'status', kind: 'http_status', label: 'Status', valueType: 'number' }],
        { status: 404 },
      );
      expect(validRes.isValid).toBe(true);
    });

    it('validates options allowlist', () => {
      const res = validateBlankAnswers(mockBlanks, {
        status_code: 500, // not in options [200, 401, 404]
        res_property: 'token',
        assertion_matcher: 'toBe',
        expected_val: 'test',
      });

      expect(res.isValid).toBe(false);
      expect(res.errors['status_code']).toContain('allowed options');
    });

    it('validates JSON literals when valueType is json', () => {
      const jsonBlank: BlankDefinition = {
        id: 'payload',
        kind: 'expected_value',
        label: 'Payload',
        valueType: 'json',
      };

      const invalidJson = validateBlankAnswers([jsonBlank], { payload: '{ invalid json ' });
      expect(invalidJson.isValid).toBe(false);
      expect(invalidJson.errors['payload']).toContain('Invalid JSON');

      const validJson = validateBlankAnswers([jsonBlank], { payload: '{"id": 1}' });
      expect(validJson.isValid).toBe(true);
    });

    it('validates HTTP method blank kinds', () => {
      const methodBlank: BlankDefinition = {
        id: 'req_method',
        kind: 'method',
        label: 'HTTP Method',
        valueType: 'string',
      };

      const validRes = validateBlankAnswers([methodBlank], { req_method: 'POST' });
      expect(validRes.isValid).toBe(true);

      const invalidRes = validateBlankAnswers([methodBlank], { req_method: 'INVALID_VERB' });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors['req_method']).toContain('HTTP method must be one of');
    });

    it('validates property path syntax and blocks code injection in paths', () => {
      const pathBlank: BlankDefinition = {
        id: 'prop_path',
        kind: 'path',
        label: 'Property Path',
        valueType: 'string',
      };

      const validRes = validateBlankAnswers([pathBlank], { prop_path: 'res.data.tokens[0].id' });
      expect(validRes.isValid).toBe(true);

      const injectionRes = validateBlankAnswers([pathBlank], { prop_path: 'res; delete user;' });
      expect(injectionRes.isValid).toBe(false);
      expect(injectionRes.errors['prop_path']).toContain('Invalid property path syntax');
    });

    it('evaluates min/max validation rule on string length when value is non-numeric', () => {
      const textBlank: BlankDefinition = {
        id: 'selector_str',
        kind: 'selector',
        label: 'Selector',
        valueType: 'string',
        validation: [
          { type: 'min', value: 5, message: 'Selector must be at least 5 characters.' },
          { type: 'max', value: 20, message: 'Selector cannot exceed 20 characters.' },
        ],
      };

      const tooShort = validateBlankAnswers([textBlank], { selector_str: 'btn' });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors['selector_str']).toContain('at least 5 characters');

      const justRight = validateBlankAnswers([textBlank], { selector_str: '#submit-button' });
      expect(justRight.isValid).toBe(true);

      const tooLong = validateBlankAnswers([textBlank], { selector_str: 'a'.repeat(25) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors['selector_str']).toContain('cannot exceed 20 characters');
    });
  });

  describe('formatBlankValue and assembleClozeCode', () => {
    it('safely escapes single quotes, double quotes, and malicious breakout code', () => {
      const strBlank: BlankDefinition = {
        id: 'val',
        kind: 'expected_value',
        label: 'Val',
        valueType: 'string',
      };

      // Edge case 1: Single quote only - must NOT produce unterminated string literal `'`
      expect(formatBlankValue(strBlank, "'")).toBe('"\'"');

      // Edge case 2: Double quote only
      expect(formatBlankValue(strBlank, '"')).toBe('"\\""');

      // Edge case 3: Multiline string
      expect(formatBlankValue(strBlank, 'line1\nline2')).toBe('"line1\\nline2"');

      // Edge case 4: Attempted code injection breakout
      const malicious = '"; alert("hacked"); "';
      const formatted = formatBlankValue(strBlank, malicious);
      expect(formatted).toBe(JSON.stringify('; alert("hacked"); '));

      // Assembled into code does NOT evaluate the alert
      const assembled = assembleClozeCode(
        [{ kind: 'readonly', text: 'expect(x).toBe(' }, { kind: 'blank', blankId: 'val' }, { kind: 'readonly', text: ');' }],
        [strBlank],
        { val: malicious },
      );
      // Valid JS string literal
      expect(() => new Function(assembled)).not.toThrow();
    });

    it('properly quotes strings and preserves unquoted matchers/paths', () => {
      expect(formatBlankValue(mockBlanks[0], 200)).toBe('200');
      expect(formatBlankValue(mockBlanks[1], 'res.data.token')).toBe('res.data.token');
      expect(formatBlankValue(mockBlanks[2], 'toBe')).toBe('toBe');
      expect(formatBlankValue(mockBlanks[3], 'secret_token')).toBe('"secret_token"');
      expect(formatBlankValue(mockBlanks[3], '"already_quoted"')).toBe('"already_quoted"');
    });

    it('assembles complete runnable JS code from template and answers', () => {
      const answers = {
        status_code: 200,
        res_property: 'res.data.token',
        assertion_matcher: 'toBe',
        expected_val: 'jwt_mock_token',
      };

      const code = assembleClozeCode(mockTemplate, mockBlanks, answers);
      expect(code).toContain('const res = { status: 200');
      expect(code).toContain('expect(res.status).toBe(200);');
      expect(code).toContain('expect(res.data.token).toBe("jwt_mock_token");');
    });

    it('handles default values when answers are omitted', () => {
      const code = assembleClozeCode(mockTemplate, mockBlanks, {});
      expect(code).toContain('expect(res.status).toBe(200);');
    });
  });

  describe('getDefaultAnswers & isClozeComplete', () => {
    it('initializes default answers map from definitions', () => {
      const defaults = getDefaultAnswers(mockBlanks);
      expect(defaults.status_code).toBe(200);
      expect(defaults.res_property).toBe('res.data.token');
      expect(defaults.assertion_matcher).toBe('toBe');
      expect(defaults.expected_val).toBe('jwt_mock_token');
    });

    it('detects incomplete blanks accurately', () => {
      expect(isClozeComplete(mockBlanks, {})).toBe(false);
      expect(
        isClozeComplete(mockBlanks, {
          status_code: 200,
          res_property: 'res.token',
          assertion_matcher: 'toBe',
          expected_val: '',
        }),
      ).toBe(false);
      expect(
        isClozeComplete(mockBlanks, {
          status_code: 200,
          res_property: 'res.token',
          assertion_matcher: 'toBe',
          expected_val: 'jwt_token',
        }),
      ).toBe(true);
    });
  });
});
