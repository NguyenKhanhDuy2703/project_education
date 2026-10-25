import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { compilePlanToPlaywrightCode } from '../features/lab/runtime/v3/playwrightV3Compiler';
import { SandboxedActionRunner } from '../features/lab/runtime/v3/blockRunner';
import { fixtureRegistry } from '../features/lab/runtime/v3/fixtureRegistry';
import {
  validateAutomationPlan,
  BUILTIN_BLOCK_DEFINITIONS,
} from '../features/lab/runtime/v3/blockDsl';
import {
  encodeAutomationV3Submission,
  decodeAutomationV3Submission,
} from '../features/lab/runtime/v3/automationV3SubmissionCodec';
import type { AutomationStep, AutomationExerciseV3 } from '@/types/lab.types';

// The authoritative 8 Playwright Automation Labs from Curriculum
const AUTOMATION_LABS: Array<{
  id: string;
  slug: string;
  title: string;
  interactionMode: 'block_builder' | 'smart_cloze' | 'guided_code' | 'full_code';
  fixtureId: string;
  initialRoute: string;
  steps: AutomationStep[];
  expectedKeywords: string[];
}> = [
  {
    id: 'lab-auto-v3-01',
    slug: 'auto-v3-01-test-structure-goto',
    title: 'Order Management Inquiry',
    interactionMode: 'block_builder',
    fixtureId: 'order-investigation-app',
    initialRoute: '/orders',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
      { id: 's2', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('table')" } },
    ],
    expectedKeywords: ['page.goto', "page.getByRole('table')", 'toBeVisible'],
  },
  {
    id: 'lab-auto-v3-02',
    slug: 'auto-v3-02-resilient-locators',
    title: 'Resilient Role-Based Locators',
    interactionMode: 'block_builder',
    fixtureId: 'order-investigation-app',
    initialRoute: '/orders',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
      { id: 's2', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Filter Failed' })" } },
      { id: 's3', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('region', { name: 'Order Details' })" } },
    ],
    expectedKeywords: ['Filter Failed', 'Order Details', 'toBeVisible'],
  },
  {
    id: 'lab-auto-v3-03',
    slug: 'auto-v3-03-form-interactions',
    title: 'Form Inputs and Dropdowns',
    interactionMode: 'block_builder',
    fixtureId: 'auth-login-portal',
    initialRoute: '/login',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
      { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'qa.learner@studyweb.dev' } },
      { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'SecurePass123!' } },
      { id: 's4', blockType: 'act_check', category: 'action', params: { locator: "page.getByLabel('Remember me')" } },
      { id: 's5', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
      { id: 's6', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/user' } },
    ],
    expectedKeywords: ['Email Address', 'Password', 'Remember me', 'Sign In', '/dashboard/user'],
  },
  {
    id: 'lab-auto-v3-04',
    slug: 'auto-v3-04-web-first-assertions',
    title: 'Web-First Assertions Matrix',
    interactionMode: 'smart_cloze',
    fixtureId: 'order-investigation-app',
    initialRoute: '/orders',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/orders' } },
      { id: 's2', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Filter Failed' })" } },
      { id: 's3', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Retry Payment' })" } },
      { id: 's4', blockType: 'assert_text', category: 'assertion', params: { locator: "page.getByRole('status')", expected: 'Processing' } },
    ],
    expectedKeywords: ['Filter Failed', 'Retry Payment', 'Processing', 'toHaveText'],
  },
  {
    id: 'lab-auto-v3-05',
    slug: 'auto-v3-05-login-positive-negative',
    title: 'Authentication Positive and Negative Matrix',
    interactionMode: 'smart_cloze',
    fixtureId: 'auth-login-portal',
    initialRoute: '/login',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
      { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'student@studyweb.dev' } },
      { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'ValidPassword123!' } },
      { id: 's4', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
      { id: 's5', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/user' } },
    ],
    expectedKeywords: ['Email Address', 'Password', 'Sign In', '/dashboard/user'],
  },
  {
    id: 'lab-auto-v3-06',
    slug: 'auto-v3-06-parameterized-boundary-matrix',
    title: 'Parameterized Role Destination Matrix',
    interactionMode: 'smart_cloze',
    fixtureId: 'auth-login-portal',
    initialRoute: '/login',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
      { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'admin@studyweb.dev' } },
      { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'Password123!' } },
      { id: 's4', blockType: 'act_select_option', category: 'action', params: { locator: "page.getByLabel('Select Role')", value: 'admin' } },
      { id: 's5', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
      { id: 's6', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/admin' } },
    ],
    expectedKeywords: ['Select Role', 'admin', 'Sign In', '/dashboard/admin'],
  },
  {
    id: 'lab-auto-v3-07',
    slug: 'auto-v3-07-rbac-navigation-matrix',
    title: 'RBAC Authorization Access Guards',
    interactionMode: 'guided_code',
    fixtureId: 'auth-login-portal',
    initialRoute: '/login',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/login' } },
      { id: 's2', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Email Address')", value: 'admin@studyweb.dev' } },
      { id: 's3', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Password')", value: 'AdminPass123!' } },
      { id: 's4', blockType: 'act_select_option', category: 'action', params: { locator: "page.getByLabel('Select Role')", value: 'admin' } },
      { id: 's5', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Sign In' })" } },
      { id: 's6', blockType: 'assert_url', category: 'assertion', params: { url: '/dashboard/admin' } },
      { id: 's7', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('region', { name: 'Admin Tools' })" } },
    ],
    expectedKeywords: ['admin@studyweb.dev', 'Admin Tools', '/dashboard/admin', 'toBeVisible'],
  },
  {
    id: 'lab-auto-v3-08',
    slug: 'auto-v3-08-capstone-checkout-flow',
    title: 'E-Commerce End-to-End Capstone',
    interactionMode: 'full_code',
    fixtureId: 'ecommerce-checkout-app',
    initialRoute: '/shop',
    steps: [
      { id: 's1', blockType: 'nav_goto', category: 'navigation', params: { route: '/shop' } },
      { id: 's2', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Add Mechanical Keyboard to Cart' })" } },
      { id: 's3', blockType: 'assert_text', category: 'assertion', params: { locator: "page.getByRole('status', { name: 'Cart items count' })", expected: '1 items' } },
      { id: 's4', blockType: 'nav_goto', category: 'navigation', params: { route: '/checkout' } },
      { id: 's5', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Recipient Name')", value: 'Nguyen Khanh Duy' } },
      { id: 's6', blockType: 'act_fill', category: 'action', params: { locator: "page.getByLabel('Shipping Address')", value: '123 Vo Van Ngan, Thu Duc, TP.HCM' } },
      { id: 's7', blockType: 'act_click', category: 'action', params: { locator: "page.getByRole('button', { name: 'Place Order Now' })" } },
      { id: 's8', blockType: 'assert_visible', category: 'assertion', params: { locator: "page.getByRole('status')" } },
    ],
    expectedKeywords: ['Add Mechanical Keyboard to Cart', 'Recipient Name', 'Place Order Now', 'toBeVisible'],
  },
];

describe('Automation V3 Gold Samples E2E Verification Suite (Subtask 5.2)', () => {
  let container: HTMLDivElement;
  const allAllowedBlocks = Object.values(BUILTIN_BLOCK_DEFINITIONS);

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'automation-test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
    document.body.innerHTML = '';
  });

  it('verifies all 8 automation labs generate valid Playwright test code', () => {
    for (const lab of AUTOMATION_LABS) {
      const exercise: Partial<AutomationExerciseV3> = {
        title: lab.title,
        interactionMode: lab.interactionMode,
        contentRevision: 'rev-2026-10-v3',
        fixture: {
          fixtureId: lab.fixtureId,
          fixtureVersion: '1.0.0',
          initialRoute: lab.initialRoute,
        },
      };

      const code = compilePlanToPlaywrightCode(exercise, lab.steps);

      expect(code).toContain("import { test, expect } from '@playwright/test';");
      expect(code).toContain(`test.describe('${lab.title}'`);
      expect(code).toContain("test('verify expected scenario workflow'");

      for (const keyword of lab.expectedKeywords) {
        expect(code).toContain(keyword);
      }
    }
  });

  it('validates step plans comply with DSL structural bounds (<= 50 steps, valid params)', () => {
    for (const lab of AUTOMATION_LABS) {
      const validation = validateAutomationPlan(lab.steps, allAllowedBlocks);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(lab.steps.length).toBeLessThanOrEqual(50);
    }
  });

  it('executes in-memory Client Scenario Runner for all 8 fixtures safely within resource limits', async () => {
    for (const lab of AUTOMATION_LABS) {
      const fixture = fixtureRegistry.get(lab.fixtureId);
      expect(fixture).toBeDefined();

      container.innerHTML = '';
      const runner = new SandboxedActionRunner(lab.fixtureId, container);

      const result = await runner.executePlan(lab.steps);

      expect(result.totalTimeMs).toBeLessThanOrEqual(2000);
      expect(result.logs.length).toBeLessThanOrEqual(100);
      if (!result.passed) {
        const failedSteps = result.stepResults.filter((s) => s.status === 'failed');
        console.error('FAILED ON LAB:', lab.slug, 'FAILED STEPS:', failedSteps, 'LOGS:', result.logs);
      }
      expect(result.passed).toBe(true);
    }
  });

  it('verifies submission payload round-trip encoding and decoding for all 8 labs', () => {
    for (const lab of AUTOMATION_LABS) {
      const code = compilePlanToPlaywrightCode(
        {
          title: lab.title,
          interactionMode: lab.interactionMode,
          contentRevision: 'rev-2026-10-v3',
        },
        lab.steps,
      );

      const base64 = encodeAutomationV3Submission({
        version: '3.0',
        exerciseRevision: 'rev-2026-10-v3',
        stepPlan: lab.steps,
        generatedCode: code,
      });

      const decoded = decodeAutomationV3Submission(base64);
      expect(decoded).not.toBeNull();
      expect(decoded!.version).toBe('3.0');
      expect(decoded!.exerciseRevision).toBe('rev-2026-10-v3');
      expect(decoded!.stepPlan).toHaveLength(lab.steps.length);
      expect(decoded!.generatedCode).toContain('@playwright/test');
    }
  });
});
