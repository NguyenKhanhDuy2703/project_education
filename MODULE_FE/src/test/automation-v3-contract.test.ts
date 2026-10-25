import { describe, it, expect } from 'vitest';
import { normalizeLabDetail, serializeEnvelope } from '@/features/lab/domain/labContentCodec';
import type {
  AutomationExerciseV3,
  LabContentEnvelopeV1,
} from '@/types/lab.types';

describe('Automation V3 Contract & Codec Suite (Subtask 1.6)', () => {
  const sampleV3Exercise: AutomationExerciseV3 = {
    version: '3.0',
    framework: 'playwright',
    interactionMode: 'block_builder',
    contentRevision: '2026-10-rev-1',
    fixture: {
      fixtureId: 'order-status-mini-app',
      fixtureVersion: '1.0.0',
      initialRoute: '/orders',
      initialState: { orderId: 'ORD-9021', status: 'failed' },
    },
    allowedBlocks: [
      {
        blockType: 'nav_goto',
        category: 'navigation',
        name: 'Navigate to Route',
        description: 'Navigates the browser to the specified route',
        codePattern: "await page.goto('{route}');",
        parameters: [
          {
            id: 'route',
            name: 'route',
            label: 'Target Route',
            type: 'string',
            defaultValue: '/orders',
            required: true,
          },
        ],
      },
      {
        blockType: 'action_click',
        category: 'action',
        name: 'Click Element',
        description: 'Clicks the target locator',
        codePattern: 'await {locator}.click();',
        parameters: [
          {
            id: 'locator',
            name: 'locator',
            label: 'Locator',
            type: 'string',
            required: true,
          },
        ],
      },
      {
        blockType: 'assert_visible',
        category: 'assertion',
        name: 'Assert Visible',
        description: 'Verifies the element is visible on page',
        codePattern: 'await expect({locator}).toBeVisible();',
        parameters: [
          {
            id: 'locator',
            name: 'locator',
            label: 'Locator',
            type: 'string',
            required: true,
          },
        ],
      },
    ],
    starterPlan: [
      {
        id: 'step_1',
        blockType: 'nav_goto',
        category: 'navigation',
        params: { route: '/orders' },
        isLocked: true,
      },
      {
        id: 'step_2',
        blockType: 'action_click',
        category: 'action',
        params: { locator: "page.getByRole('button', { name: 'Retry Payment' })" },
      },
    ],
    publicChecks: [
      {
        id: 'chk_1',
        name: 'Navigate to Orders Page',
        description: 'Ensures page navigates to /orders route',
        ruleType: 'block_exists',
        targetBlockType: 'nav_goto',
      },
      {
        id: 'chk_2',
        name: 'Assert Payment Status Visible',
        description: 'Ensures assertion verifies visibility of payment status',
        ruleType: 'assertion_match',
        targetBlockType: 'assert_visible',
      },
    ],
    exportTemplate: 'typescript',
    title: 'Playwright Lab 01: Investigation of Failed Orders',
    scenarioDescription: 'Investigate payment retry and verify status changes',
  };

  it('normalizes V3 exercise payload into typed PracticeLabV1 envelope', () => {
    const raw = {
      id: 'lab-playwright-01',
      slug: 'playwright-01-order-investigation',
      title: 'Playwright Lab 01: Investigation of Failed Orders',
      sandboxType: 'js_worker',
      instructions: '# Test Instructions',
      objective: JSON.stringify({
        _envelopeVersion: '3.0',
        config: sampleV3Exercise,
      }),
    };

    const normalized = normalizeLabDetail(raw);
    expect(normalized.sandboxType).toBe('js_worker');
    expect(normalized.envelope.version).toBe('3.0');

    const config = normalized.envelope.config as AutomationExerciseV3;
    expect(config.version).toBe('3.0');
    expect(config.framework).toBe('playwright');
    expect(config.interactionMode).toBe('block_builder');
    expect(config.fixture.fixtureId).toBe('order-status-mini-app');
    expect(config.allowedBlocks.length).toBe(3);
    expect(config.starterPlan.length).toBe(2);
    expect(config.publicChecks.length).toBe(2);
  });

  it('supports round-trip serialization and deserialization of V3 envelope', () => {
    const originalEnvelope: LabContentEnvelopeV1 = {
      version: '3.0',
      sandboxType: 'js_worker',
      instructions: '# Scenario Instructions',
      initialSnippet: '',
      testScript: '',
      config: sampleV3Exercise,
    };

    const serialized = serializeEnvelope(originalEnvelope);
    expect(typeof serialized.objective).toBe('string');

    const reconstructed = normalizeLabDetail({
      id: 'lab-roundtrip-v3',
      instructions: serialized.instructions,
      initialSnippet: serialized.initialSnippet,
      testScript: serialized.testScript,
      objective: serialized.objective,
      sandboxType: 'js_worker',
    });

    expect(reconstructed.envelope.version).toBe('3.0');
    const reconstructedConfig = reconstructed.envelope.config as AutomationExerciseV3;
    expect(reconstructedConfig.contentRevision).toBe('2026-10-rev-1');
    expect(reconstructedConfig.fixture.initialRoute).toBe('/orders');
    expect(reconstructedConfig.starterPlan[0].params.route).toBe('/orders');
  });

  it('preserves backward compatibility with V1 and V2 exercises', () => {
    // V1 exercise
    const v1Raw = {
      id: 'v1-lab',
      sandboxType: 'js_worker',
      instructions: '# V1 JS Lab',
      objective: JSON.stringify({
        version: '1.0',
        targetFunction: 'sum',
        steps: [{ id: 's1', name: 'Step 1', matcher: 'toBe', expected: 3 }],
      }),
    };
    const normalizedV1 = normalizeLabDetail(v1Raw);
    expect(normalizedV1.envelope.version).toBe('1.0');

    // V2 exercise
    const v2Raw = {
      id: 'v2-lab',
      sandboxType: 'js_worker',
      instructions: '# V2 Cloze Lab',
      objective: JSON.stringify({
        _envelopeVersion: '2.0',
        interactionMode: 'smart_cloze',
        publicTemplate: [{ kind: 'readonly', text: 'expect(1).' }],
        blanks: [{ id: 'b1', label: 'Matcher', defaultValue: 'toBe' }],
      }),
    };
    const normalizedV2 = normalizeLabDetail(v2Raw);
    expect(normalizedV2.envelope.version).toBe('2.0');
  });
});
