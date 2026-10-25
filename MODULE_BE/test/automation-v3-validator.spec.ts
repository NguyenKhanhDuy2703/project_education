import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateV3AutomationSubmission,
  decodeV3SubmissionPayload,
} from '../src/modules/labs/automation-v3-validator';

describe('Automation V3 Server Submission Validation Suite (Subtask 2.5)', () => {
  const sampleConfig = {
    version: '3.0',
    contentRevision: 'rev-2026-10-01',
    allowedBlocks: [
      { blockType: 'nav_goto' },
      { blockType: 'act_click' },
      { blockType: 'assert_visible' },
    ],
    gradingRules: [
      {
        requiredSteps: [
          { blockType: 'nav_goto', paramsMatch: { route: '/orders' } },
          { blockType: 'act_click' },
        ],
        feedback: 'Must navigate to /orders and click the action button.',
      },
      {
        forbiddenPatterns: ['arbitraryEval', 'execScript'],
        feedback: 'Script injection patterns are strictly prohibited.',
      },
    ],
  };

  it('decodes base64 versioned V3 submission envelope cleanly', () => {
    const rawPayload = {
      version: '3.0',
      exerciseRevision: 'rev-2026-10-01',
      stepPlan: [
        { id: 's1', blockType: 'nav_goto', params: { route: '/orders' } },
        { id: 's2', blockType: 'act_click', params: { locator: "page.getByRole('button')" } },
      ],
      generatedCode: "await page.goto('/orders');\nawait page.getByRole('button').click();",
      status: 'passed',
      timeMs: 120,
    };

    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(rawPayload)).toString('base64')}*/\n\n${rawPayload.generatedCode}`;
    const decoded = decodeV3SubmissionPayload(encoded);

    assert.notEqual(decoded, null);
    assert.equal(decoded?.version, '3.0');
    assert.equal(decoded?.exerciseRevision, 'rev-2026-10-01');
    assert.equal(decoded?.stepPlan.length, 2);
  });

  it('rejects submission with revision mismatch', () => {
    const payload = {
      version: '3.0',
      exerciseRevision: 'stale-rev-old',
      stepPlan: [{ id: 's1', blockType: 'nav_goto', params: { route: '/orders' } }],
      generatedCode: "await page.goto('/orders');",
      status: 'passed',
      timeMs: 50,
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(payload)).toString('base64')}*/`;

    assert.throws(() => {
      validateV3AutomationSubmission(encoded, sampleConfig);
    }, /Submission revision mismatch/);
  });

  it('rejects submission exceeding 50 steps limit', () => {
    const steps = Array.from({ length: 51 }, (_, i) => ({
      id: `s_${i}`,
      blockType: 'nav_goto',
      params: { route: '/orders' },
    }));
    const payload = {
      version: '3.0',
      exerciseRevision: 'rev-2026-10-01',
      stepPlan: steps,
      generatedCode: '// lots of steps',
      status: 'passed',
      timeMs: 200,
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(payload)).toString('base64')}*/`;

    assert.throws(() => {
      validateV3AutomationSubmission(encoded, sampleConfig);
    }, /50-step maximum limit/);
  });

  it('rejects submission with unauthorized block types', () => {
    const payload = {
      version: '3.0',
      exerciseRevision: 'rev-2026-10-01',
      stepPlan: [
        { id: 's1', blockType: 'nav_goto', params: { route: '/orders' } },
        { id: 's2', blockType: 'arbitrary_eval_block', params: {} },
      ],
      generatedCode: 'arbitrary code',
      status: 'passed',
      timeMs: 50,
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(payload)).toString('base64')}*/`;

    assert.throws(() => {
      validateV3AutomationSubmission(encoded, sampleConfig);
    }, /is not permitted in this exercise/);
  });

  it('evaluates server-side grading rules and fails when required steps are missing', () => {
    const payload = {
      version: '3.0',
      exerciseRevision: 'rev-2026-10-01',
      stepPlan: [
        // Missing the required act_click step
        { id: 's1', blockType: 'nav_goto', params: { route: '/orders' } },
      ],
      generatedCode: "await page.goto('/orders');",
      status: 'passed', // Client claimed passed, but server overrides to failed
      timeMs: 40,
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(payload)).toString('base64')}*/`;
    const res = validateV3AutomationSubmission(encoded, sampleConfig);

    assert.equal(res.status, 'failed');
    assert.match(res.testLogs || '', /Missing required step \(act_click\)/);
  });

  it('passes valid submission satisfying all declarative checks', () => {
    const payload = {
      version: '3.0',
      exerciseRevision: 'rev-2026-10-01',
      stepPlan: [
        { id: 's1', blockType: 'nav_goto', params: { route: '/orders' } },
        { id: 's2', blockType: 'act_click', params: { locator: "page.getByRole('button')" } },
      ],
      generatedCode: "await page.goto('/orders');\nawait page.getByRole('button').click();",
      status: 'passed',
      timeMs: 85,
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(payload)).toString('base64')}*/`;
    const res = validateV3AutomationSubmission(encoded, sampleConfig);

    assert.equal(res.status, 'passed');
    assert.equal(res.timeMs, 85);
  });

  it('evaluates server-side gradingKey and rejects forged passed submission when requiredSteps are missing', () => {
    const configWithGradingKey = {
      version: '3.0',
      allowedBlocks: [{ blockType: 'nav_goto' }, { blockType: 'act_click' }],
      gradingKey: {
        exerciseRevision: 'rev-key-2026',
        requiredSteps: [
          { type: 'navigation', action: 'goto', targetUrl: '/login' },
          { type: 'action', action: 'click', target: 'Sign In' },
        ],
        forbiddenPatterns: ['eval\\(', 'window\\.'],
      },
    };

    // Forged submission: claims status 'passed', but only has nav_goto
    const forgedPayload = {
      version: '3.0',
      exerciseRevision: 'rev-key-2026',
      stepPlan: [
        { id: 's1', blockType: 'nav_goto', params: { route: '/login' } },
      ],
      generatedPlaywrightCode: "await page.goto('/login');",
      durationMs: 95,
      status: 'passed',
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(forgedPayload)).toString('base64')}*/`;
    const res = validateV3AutomationSubmission(encoded, configWithGradingKey);

    assert.equal(res.status, 'failed');
    assert.match(res.testLogs || '', /Missing required step \(act_click\)/);
  });

  it('evaluates server-side gradingKey forbiddenPatterns and handles generatedPlaywrightCode cleanly', () => {
    const configWithGradingKey = {
      version: '3.0',
      allowedBlocks: [{ blockType: 'nav_goto' }],
      gradingKey: {
        exerciseRevision: 'rev-key-2026',
        requiredSteps: [{ type: 'navigation', action: 'goto', targetUrl: '/dashboard' }],
        forbiddenPatterns: ['eval\\(', 'document\\.cookie'],
      },
    };

    const maliciousPayload = {
      version: '3.0',
      exerciseRevision: 'rev-key-2026',
      stepPlan: [
        { id: 's1', blockType: 'nav_goto', params: { route: '/dashboard' } },
      ],
      generatedPlaywrightCode: "await page.goto('/dashboard');\neval('steal');",
      durationMs: 70,
      status: 'passed',
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(maliciousPayload)).toString('base64')}*/`;
    const res = validateV3AutomationSubmission(encoded, configWithGradingKey);

    assert.equal(res.status, 'failed');
    assert.match(res.testLogs || '', /forbidden pattern "eval\\\("/);
  });

  it('passes valid submission against gradingKey and maps durationMs to timeMs', () => {
    const configWithGradingKey = {
      version: '3.0',
      allowedBlocks: [{ blockType: 'nav_goto' }, { blockType: 'act_click' }],
      gradingKey: {
        exerciseRevision: 'rev-key-2026',
        requiredSteps: [
          { type: 'navigation', action: 'goto', targetUrl: '/login' },
          { type: 'action', action: 'click', target: 'Sign In' },
        ],
      },
    };

    const validPayload = {
      version: '3.0',
      exerciseRevision: 'rev-key-2026',
      stepPlan: [
        { id: 's1', blockType: 'nav_goto', params: { route: '/login' } },
        { id: 's2', blockType: 'act_click', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
      ],
      generatedPlaywrightCode: "await page.goto('/login');\nawait page.getByRole('button', { name: 'Sign In' }).click();",
      durationMs: 110,
      status: 'passed',
    };
    const encoded = `/* AUTOMATION_V3_SUBMISSION:${Buffer.from(JSON.stringify(validPayload)).toString('base64')}*/`;
    const res = validateV3AutomationSubmission(encoded, configWithGradingKey);

    assert.equal(res.status, 'passed');
    assert.equal(res.timeMs, 110);
  });

  it('rejects malformed, corrupted, or non-base64 forged payloads with BadRequestException', () => {
    // 1. Corrupted base64 content
    assert.throws(() => {
      validateV3AutomationSubmission('/* AUTOMATION_V3_SUBMISSION:!!!NotBase64&&&*/', sampleConfig);
    }, /Invalid Automation V3 submission/);

    // 2. Base64 containing valid text but not valid JSON
    const notJsonBase64 = Buffer.from('hello world not json').toString('base64');
    assert.throws(() => {
      validateV3AutomationSubmission(`/* AUTOMATION_V3_SUBMISSION:${notJsonBase64}*/`, sampleConfig);
    }, /Invalid Automation V3 submission/);

    // 3. Base64 containing JSON with wrong version
    const wrongVersionBase64 = Buffer.from(JSON.stringify({ version: '1.0', stepPlan: [] })).toString('base64');
    assert.throws(() => {
      validateV3AutomationSubmission(`/* AUTOMATION_V3_SUBMISSION:${wrongVersionBase64}*/`, sampleConfig);
    }, /Invalid Automation V3 submission/);

    // 4. Empty string or null
    assert.throws(() => {
      validateV3AutomationSubmission('', sampleConfig);
    }, /Invalid Automation V3 submission/);
  });
});
