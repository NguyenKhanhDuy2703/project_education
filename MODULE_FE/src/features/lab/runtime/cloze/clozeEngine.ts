import type {
  BlankDefinition,
  TemplateSegment,
  BlankValidationRule,
} from '@/types/lab.types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates learner answers against blank definitions and validation rules.
 */
export function validateBlankAnswers(
  blanks: BlankDefinition[],
  answers: Record<string, any>,
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const blank of blanks) {
    const rawVal = answers[blank.id];
    const isBlankEmpty =
      rawVal === undefined || rawVal === null || (typeof rawVal === 'string' && rawVal.trim() === '');

    // 1. Required check (default required is true unless explicitly false)
    const isRequired = blank.required !== false;
    if (isRequired && isBlankEmpty) {
      errors[blank.id] = `${blank.label || blank.id} is required.`;
      continue;
    }

    if (isBlankEmpty) {
      continue; // Optional and empty is valid
    }

    // 2. Type-specific checks
    if (blank.kind === 'http_status') {
      const num = Number(rawVal);
      if (!Number.isInteger(num) || num < 100 || num > 599) {
        errors[blank.id] = 'HTTP status must be a 3-digit integer (100–599).';
        continue;
      }
    } else if (blank.kind === 'method') {
      const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      const methodUpper = String(rawVal).trim().toUpperCase();
      if (!allowedMethods.includes(methodUpper)) {
        errors[blank.id] = `HTTP method must be one of: ${allowedMethods.join(', ')}.`;
        continue;
      }
    } else if (blank.kind === 'path') {
      const trimmed = String(rawVal).trim();
      const validPathRegex = /^[a-zA-Z_$][a-zA-Z0-9_$.[\]'"]*$/;
      if (!validPathRegex.test(trimmed)) {
        errors[blank.id] = 'Invalid property path syntax.';
        continue;
      }
    } else if (blank.kind === 'matcher' && (!blank.options || blank.options.length === 0)) {
      const allowedMatchers = [
        'toBe',
        'toEqual',
        'toContain',
        'toBeDefined',
        'toBeUndefined',
        'toBeTruthy',
        'toBeFalsy',
        'toBeGreaterThan',
        'toBeLessThan',
        'toHaveLength',
        'toThrow',
      ];
      if (!allowedMatchers.includes(String(rawVal).trim())) {
        errors[blank.id] = `Invalid matcher. Allowed matchers include: ${allowedMatchers.slice(0, 5).join(', ')}...`;
        continue;
      }
    } else if (blank.valueType === 'number') {
      const num = Number(rawVal);
      if (Number.isNaN(num)) {
        errors[blank.id] = 'Must be a valid number.';
        continue;
      }
    } else if (blank.valueType === 'json') {
      if (typeof rawVal === 'string') {
        try {
          JSON.parse(rawVal);
        } catch {
          errors[blank.id] = 'Invalid JSON literal format.';
          continue;
        }
      }
    }

    // 3. Option allowlist check
    if (blank.options && blank.options.length > 0) {
      const allowed = blank.options.map((opt) => String(opt.value));
      if (!allowed.includes(String(rawVal))) {
        errors[blank.id] = `Selected value is not in allowed options.`;
        continue;
      }
    }

    // 4. Custom validation rules
    if (blank.validation && blank.validation.length > 0) {
      for (const rule of blank.validation) {
        if (!checkValidationRule(rawVal, rule)) {
          errors[blank.id] = rule.message || 'Validation failed for this blank.';
          break;
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function checkValidationRule(value: any, rule: BlankValidationRule): boolean {
  switch (rule.type) {
    case 'required':
      return value !== undefined && value !== null && String(value).trim() !== '';
    case 'min':
      if (typeof value === 'string' && Number.isNaN(Number(value))) {
        return value.length >= Number(rule.value);
      }
      return Number(value) >= Number(rule.value);
    case 'max':
      if (typeof value === 'string' && Number.isNaN(Number(value))) {
        return value.length <= Number(rule.value);
      }
      return Number(value) <= Number(rule.value);
    case 'regex':
      try {
        const regex = new RegExp(rule.value);
        return regex.test(String(value));
      } catch {
        return true;
      }
    case 'enum':
      return Array.isArray(rule.value) ? rule.value.includes(value) : true;
    default:
      return true;
  }
}

/**
 * Formats a typed blank answer into its code expression representation.
 */
export function formatBlankValue(blank: BlankDefinition, value: any): string {
  if (value === undefined || value === null || value === '') {
    return 'undefined';
  }

  if (blank.kind === 'http_status' || blank.valueType === 'number') {
    const num = Number(value);
    return Number.isNaN(num) ? 'NaN' : String(num);
  }

  if (blank.valueType === 'boolean') {
    return value === true || value === 'true' ? 'true' : 'false';
  }

  if (blank.kind === 'matcher' || blank.kind === 'action' || blank.kind === 'path') {
    return String(value).trim();
  }

  if (blank.kind === 'method') {
    return JSON.stringify(String(value).trim().toUpperCase());
  }

  if (blank.valueType === 'json') {
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value).trim();
  }

  // String literal values (e.g. expected_value string, selector, text)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // If learner typed enclosed quotes (e.g. "foo" or 'foo'), safely extract content to re-stringify cleanly
    let inner = trimmed;
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string') {
          inner = parsed;
        } else {
          inner = trimmed.slice(1, -1);
        }
      } catch {
        inner = trimmed.slice(1, -1);
      }
    }
    // Always JSON.stringify to guarantee a valid, non-breaking, properly escaped JS double-quoted string literal
    return JSON.stringify(inner);
  }

  return String(value);
}

/**
 * Assembles executable JavaScript code from template segments and blank answers.
 */
export function assembleClozeCode(
  template: TemplateSegment[],
  blanks: BlankDefinition[],
  answers: Record<string, any>,
  options: { includeManagedCode?: boolean } = { includeManagedCode: true },
): string {
  const blanksMap = new Map<string, BlankDefinition>();
  for (const b of blanks) {
    blanksMap.set(b.id, b);
  }

  const parts: string[] = [];

  for (const segment of template) {
    if (segment.kind === 'readonly') {
      parts.push(segment.text);
    } else if (segment.kind === 'managed') {
      if (options.includeManagedCode && segment.code) {
        parts.push(segment.code);
      }
    } else if (segment.kind === 'blank') {
      const def = blanksMap.get(segment.blankId);
      if (!def) {
        parts.push('undefined');
        continue;
      }
      const val = answers[segment.blankId] !== undefined ? answers[segment.blankId] : def.defaultValue;
      parts.push(formatBlankValue(def, val));
    }
  }

  return parts.join('');
}

/**
 * Initializes default answer map from BlankDefinitions.
 */
export function getDefaultAnswers(blanks: BlankDefinition[]): Record<string, any> {
  const answers: Record<string, any> = {};
  for (const b of blanks) {
    if (b.defaultValue !== undefined) {
      answers[b.id] = b.defaultValue;
    } else if (b.options && b.options.length > 0) {
      answers[b.id] = b.options[0].value;
    } else if (b.valueType === 'number') {
      answers[b.id] = '';
    } else if (b.valueType === 'boolean') {
      answers[b.id] = false;
    } else {
      answers[b.id] = '';
    }
  }
  return answers;
}

/**
 * Checks whether all required blanks have been filled by learner.
 */
export function isClozeComplete(blanks: BlankDefinition[], answers: Record<string, any>): boolean {
  for (const b of blanks) {
    if (b.required !== false) {
      const val = answers[b.id];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        return false;
      }
    }
  }
  return true;
}
