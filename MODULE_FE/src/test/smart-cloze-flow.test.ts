import { describe, it, expect } from 'vitest';
import { normalizeLabDetail } from '@/features/lab/domain/labContentCodec';
import {
  assembleClozeCode,
  validateBlankAnswers,
  getDefaultAnswers,
} from '@/features/lab/runtime/cloze/clozeEngine';
import { expect as createMatcher } from '@/features/lab/runtime/matchers/expect';
import type { BlankDefinition, TemplateSegment, AutomationExerciseV2 } from '@/types/lab.types';

describe('Smart Cloaked Code (Automation V2) End-to-End Flow Test', () => {
  // Vertical slice API exercise with 4 key test decisions:
  // 1. Success status code (200)
  // 2. Failure status code (401)
  // 3. Token assertion matcher ('toBeDefined')
  // 4. Sensitive field absence ('password')
  const rawApiLab = {
    id: 'lab-auth-cloze-flow',
    title: 'Authentication API Verification with Smart Cloaked Code',
    sandboxType: 'js_worker',
    instructions: '# Test Authentication Decisions\nFill in the 4 blanks to verify login behavior.',
    objective: JSON.stringify({
      _envelopeVersion: '2.0',
      interactionMode: 'smart_cloze',
      framework: 'api',
      publicTemplate: [
        {
          kind: 'managed',
          label: 'Test setup & mock responses',
          code: `
            const successResponse = { status: 200, data: { accessToken: "eyJhbGciOi...", user: { id: 1, email: "dev@studyweb.io" } } };
            const failureResponse = { status: 401, data: { error: "Invalid credentials" } };
          `,
        },
        { kind: 'readonly', text: 'test("verifies successful login returns status 200", () => {\n  expect(successResponse.status).toBe(' },
        { kind: 'blank', blankId: 'success_status' },
        { kind: 'readonly', text: ');\n});\n\n' },
        { kind: 'readonly', text: 'test("verifies access token is present", () => {\n  expect(successResponse.data.accessToken).' },
        { kind: 'blank', blankId: 'token_matcher' },
        { kind: 'readonly', text: '();\n});\n\n' },
        { kind: 'readonly', text: 'test("verifies sensitive password is omitted", () => {\n  expect(successResponse.data.user).not.' },
        { kind: 'blank', blankId: 'sensitive_matcher' },
        { kind: 'readonly', text: '("password");\n});\n\n' },
        { kind: 'readonly', text: 'test("verifies failed login returns status 401", () => {\n  expect(failureResponse.status).toBe(' },
        { kind: 'blank', blankId: 'failure_status' },
        { kind: 'readonly', text: ');\n});' },
      ] as TemplateSegment[],
      blanks: [
        {
          id: 'success_status',
          kind: 'http_status',
          label: 'Success HTTP Status',
          valueType: 'number',
          defaultValue: 200,
          options: [
            { value: 200, label: '200 OK' },
            { value: 201, label: '201 Created' },
            { value: 204, label: '204 No Content' },
          ],
        },
        {
          id: 'token_matcher',
          kind: 'matcher',
          label: 'Token Matcher',
          valueType: 'enum',
          defaultValue: 'toBeDefined',
          options: [
            { value: 'toBeDefined', label: 'toBeDefined' },
            { value: 'toBe', label: 'toBe' },
          ],
        },
        {
          id: 'sensitive_matcher',
          kind: 'matcher',
          label: 'Sensitive Omission Matcher',
          valueType: 'enum',
          defaultValue: 'toContain',
          options: [
            { value: 'toContain', label: 'toContain' },
            { value: 'toBe', label: 'toBe' },
          ],
        },
        {
          id: 'failure_status',
          kind: 'http_status',
          label: 'Failure HTTP Status',
          valueType: 'number',
          defaultValue: 401,
          options: [
            { value: 400, label: '400 Bad Request' },
            { value: 401, label: '401 Unauthorized' },
            { value: 403, label: '403 Forbidden' },
            { value: 404, label: '404 Not Found' },
          ],
        },
      ] as BlankDefinition[],
    }),
  };

  it('normalizes V2 lab contract with Smart Cloze config', () => {
    const normalized = normalizeLabDetail(rawApiLab as any);
    expect(normalized.envelope.version).toBe('2.0');
    expect(normalized.envelope.sandboxType).toBe('js_worker');

    const config = normalized.envelope.config as AutomationExerciseV2;
    expect(config.interactionMode).toBe('smart_cloze');
    expect(config.blanks.length).toBe(4);
    expect(config.publicTemplate.length).toBe(13);
  });

  it('validates blank inputs and rejects invalid status codes before execution', () => {
    const normalized = normalizeLabDetail(rawApiLab as any);
    const config = normalized.envelope.config as AutomationExerciseV2;

    const invalidAnswers = {
      success_status: 999, // invalid status
      token_matcher: 'toBeDefined',
      sensitive_matcher: 'toContain',
      failure_status: '', // missing required
    };

    const valResult = validateBlankAnswers(config.blanks, invalidAnswers);
    expect(valResult.isValid).toBe(false);
    expect(valResult.errors['success_status']).toBeDefined();
    expect(valResult.errors['failure_status']).toBeDefined();
  });

  it('fails tests when learner selects incorrect decisions', () => {
    const normalized = normalizeLabDetail(rawApiLab as any);
    const config = normalized.envelope.config as AutomationExerciseV2;

    // Learner wrongly selects 201 Created and 403 Forbidden
    const wrongAnswers = {
      success_status: 201,
      token_matcher: 'toBeDefined',
      sensitive_matcher: 'toContain',
      failure_status: 403,
    };

    const valResult = validateBlankAnswers(config.blanks, wrongAnswers);
    expect(valResult.isValid).toBe(true);

    const assembledCode = assembleClozeCode(config.publicTemplate, config.blanks, wrongAnswers);

    type StepResult = { name: string; passed: boolean; message?: string };
    const stepResults: StepResult[] = [];
    const testRunner = (name: string, fn: () => void) => {
      try {
        fn();
        stepResults.push({ name, passed: true });
      } catch (err: any) {
        stepResults.push({ name, passed: false, message: err.message });
      }
    };

    const runner = new Function('expect', 'test', assembledCode);
    runner(createMatcher, testRunner);

    expect(stepResults.length).toBe(4);
    const passedSteps = stepResults.filter((s) => s.passed);
    const failedSteps = stepResults.filter((s) => !s.passed);
    expect(passedSteps.length).toBe(2);
    expect(failedSteps.length).toBe(2);
    expect(failedSteps[0].name).toContain('status 200');
    expect(failedSteps[1].name).toContain('status 401');
  });

  it('passes 100% of test assertions when learner fills all 4 correct decisions', () => {
    const normalized = normalizeLabDetail(rawApiLab as any);
    const config = normalized.envelope.config as AutomationExerciseV2;

    const correctAnswers = {
      success_status: 200,
      token_matcher: 'toBeDefined',
      sensitive_matcher: 'toContain',
      failure_status: 401,
    };

    const valResult = validateBlankAnswers(config.blanks, correctAnswers);
    expect(valResult.isValid).toBe(true);

    const assembledCode = assembleClozeCode(config.publicTemplate, config.blanks, correctAnswers);

    type StepResult = { name: string; passed: boolean; message?: string };
    const stepResults: StepResult[] = [];
    const testRunner = (name: string, fn: () => void) => {
      try {
        fn();
        stepResults.push({ name, passed: true });
      } catch (err: any) {
        stepResults.push({ name, passed: false, message: err.message });
      }
    };

    const runner = new Function('expect', 'test', assembledCode);
    runner(createMatcher, testRunner);

    expect(stepResults.length).toBe(4);
    expect(stepResults.every((s) => s.passed)).toBe(true);
  });

  it('supports reset to default answers', () => {
    const normalized = normalizeLabDetail(rawApiLab as any);
    const config = normalized.envelope.config as AutomationExerciseV2;

    const defaults = getDefaultAnswers(config.blanks);
    expect(defaults.success_status).toBe(200);
    expect(defaults.token_matcher).toBe('toBeDefined');
    expect(defaults.failure_status).toBe(401);
  });

  it('produces clean submission payload with answers map and assembled code', () => {
    const normalized = normalizeLabDetail(rawApiLab as any);
    const config = normalized.envelope.config as AutomationExerciseV2;

    const finalAnswers = {
      success_status: 200,
      token_matcher: 'toBeDefined',
      sensitive_matcher: 'toContain',
      failure_status: 401,
    };

    const assembled = assembleClozeCode(config.publicTemplate, config.blanks, finalAnswers);

    const submission = {
      labId: rawApiLab.id,
      submittedCode: assembled,
      status: 'passed' as const,
      timeMs: 42,
      answers: finalAnswers,
      templateVersion: '2.0',
    };

    expect(submission.status).toBe('passed');
    expect(submission.answers.success_status).toBe(200);
    expect(submission.answers.failure_status).toBe(401);
    expect(submission.submittedCode).toContain('expect(successResponse.status).toBe(200);');
    expect(submission.submittedCode).toContain('expect(failureResponse.status).toBe(401);');
  });
});
