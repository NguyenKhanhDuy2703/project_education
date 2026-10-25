import { describe, it, expect } from 'vitest';
import { fixtureRegistry } from '../features/lab/runtime/v3/fixtureRegistry';
import { validateAutomationPlan, BUILTIN_BLOCK_DEFINITIONS } from '../features/lab/runtime/v3/blockDsl';
import { SandboxedActionRunner } from '../features/lab/runtime/v3/blockRunner';
import { compilePlanToPlaywrightCode } from '../features/lab/runtime/v3/playwrightV3Compiler';
import {
  encodeAutomationV3Submission,
  decodeAutomationV3Submission,
  type AutomationV3SubmissionPayload,
} from '../features/lab/runtime/v3/automationV3SubmissionCodec';
import type { AutomationStep } from '@/types/lab.types';

describe('Automation V3 Runtime Safety, Limits & Fixture Isolation (Subtask 2.6)', () => {
  it('blocks external network URLs and malicious protocols from navigation', () => {
    expect(fixtureRegistry.validateRoute('order-investigation-app', 'https://malicious-external-site.com')).toBe(false);
    expect(fixtureRegistry.validateRoute('order-investigation-app', 'http://phishing.org')).toBe(false);
    expect(fixtureRegistry.validateRoute('order-investigation-app', 'javascript:alert(1)')).toBe(false);
    expect(fixtureRegistry.validateRoute('order-investigation-app', 'data:text/html,<script></script>')).toBe(false);
    expect(fixtureRegistry.validateRoute('order-investigation-app', '//external-cdn.com/exploit')).toBe(false);

    // Only declared internal routes are accepted
    expect(fixtureRegistry.validateRoute('order-investigation-app', '/orders')).toBe(true);
    expect(fixtureRegistry.validateRoute('order-investigation-app', '/non-existent-route')).toBe(false);
  });

  it('enforces maximum limit of 50 steps per test plan', () => {
    const allowed = Object.values(BUILTIN_BLOCK_DEFINITIONS);
    const validPlan: AutomationStep[] = [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
    ];
    expect(validateAutomationPlan(validPlan, allowed).isValid).toBe(true);

    const excessivePlan: AutomationStep[] = Array.from({ length: 51 }, (_, i) => ({
      id: `step_${i}`,
      blockType: 'nav_goto',
      category: 'navigation',
      params: { route: '/orders' },
    }));

    const result = validateAutomationPlan(excessivePlan, allowed);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('exceeds maximum limit of 50 steps');
  });

  it('caps runner console logs at 100 entries', async () => {
    const container = document.createElement('div');
    const runner = new SandboxedActionRunner('order-investigation-app', container);

    // Run steps that generate logs
    const steps: AutomationStep[] = Array.from({ length: 25 }, (_, i) => ({
      id: `s_${i}`,
      blockType: 'nav_goto',
      category: 'navigation',
      params: { route: '/orders' },
    }));

    const result = await runner.executePlan(steps);
    expect(result.logs.length).toBeLessThanOrEqual(101); // 100 logs + optional truncation marker
  });

  it('survives 20 consecutive run and reset cycles without DOM or state bleeding', async () => {
    const container = document.createElement('div');
    const runner = new SandboxedActionRunner('order-investigation-app', container);

    const testSteps: AutomationStep[] = [
      { id: 'step_nav', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
      { id: 'step_click', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Search' })" } },
      { id: 'step_assert', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('status')" } },
    ];

    for (let cycle = 0; cycle < 20; cycle++) {
      container.innerHTML = '';
      const runResult = await runner.executePlan(testSteps, [
        { id: 'chk_nav', name: 'Nav check', ruleType: 'block_exists', targetBlockType: 'nav_goto' },
      ]);

      expect(runResult.passed).toBe(true);
      expect(runResult.stepResults.length).toBe(3);
      expect(runResult.stepResults[0].status).toBe('passed');
      expect(container.querySelector('#orders-tbody')).not.toBeNull();
    }
  });

  it('compiles step plan into valid Playwright TypeScript syntax with deterministic title', () => {
    const steps: AutomationStep[] = [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
      { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'qa@studyweb.dev' } },
      { id: 's3', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
      { id: 's4', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/user' } },
    ];

    const code = compilePlanToPlaywrightCode(
      {
        title: 'User Login Journey',
        fixture: { fixtureId: 'auth-login-portal', fixtureVersion: '1.0.0', initialRoute: '/login' },
      },
      steps,
    );

    expect(code).toContain("import { test, expect } from '@playwright/test';");
    expect(code).toContain("test.describe('User Login Journey'");
    expect(code).toContain("await page.goto('/login');");
    expect(code).toContain("await page.getByLabel('Email Address').fill('qa@studyweb.dev');");
    expect(code).toContain("await expect(page).toHaveURL('/dashboard/user');");
  });

  it('encodes and decodes V3 submission payload with full round-trip fidelity', () => {
    const payload: AutomationV3SubmissionPayload = {
      version: '3.0',
      exerciseRevision: '2026-10-rev-1',
      stepPlan: [
        { id: 'step_1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
      ],
      answers: { customParam: 'active' },
      generatedCode: "import { test } from '@playwright/test';\ntest('demo', async () => {});",
      status: 'passed',
      timeMs: 45,
      resultSummary: {
        passedChecks: ['chk_1'],
        failedChecks: [],
        totalSteps: 1,
      },
      submittedAt: new Date().toISOString(),
    };

    const encoded = encodeAutomationV3Submission(payload);
    expect(typeof encoded).toBe('string');
    expect(encoded).toContain('/* AUTOMATION_V3_SUBMISSION:');

    const decoded = decodeAutomationV3Submission(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.version).toBe('3.0');
    expect(decoded?.exerciseRevision).toBe('2026-10-rev-1');
    expect(decoded?.stepPlan.length).toBe(1);
    expect(decoded?.status).toBe('passed');
    expect(decoded?.generatedCode).toContain('@playwright/test');
    expect(decoded?.durationMs).toBe(45);
    expect(decoded?.timeMs).toBe(45);
  });

  it('correctly resolves accessible ARIA role locators including textbox for native input elements', async () => {
    const container = document.createElement('div');
    const runner = new SandboxedActionRunner('order-investigation-app', container);

    // Initial render
    await runner.executePlan([
      { id: 'step_goto', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
    ]);

    // Test resolving input as textbox with accessible name
    const fillResult = await runner.executePlan([
      { id: 'step_goto', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
      {
        id: 'step_fill',
        blockType: 'act_fill',
        category: 'action',
        params: {
          locator: "page.getByRole('textbox', { name: 'Order ID Search' })",
          value: 'ORD-9021',
        },
      },
      {
        id: 'step_click_btn',
        blockType: 'act_click',
        category: 'action',
        params: {
          locator: "page.getByRole('button', { name: 'Search Orders', exact: true })",
        },
      },
    ]);

    expect(fillResult.passed).toBe(true);
    expect(fillResult.stepResults[1].status).toBe('passed');
    expect(fillResult.stepResults[2].status).toBe('passed');
    const inputEl = container.querySelector('#order-search') as HTMLInputElement | null;
    expect(inputEl?.value).toBe('ORD-9021');
  });
});
