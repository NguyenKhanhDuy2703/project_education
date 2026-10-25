import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AutomationV3Workspace, parsePlaywrightCodeToSteps } from '../features/lab/strategies/AutomationV3Workspace';
import { getWorkspaceStrategy } from '../features/lab/strategies/workspaceRegistry';
import type { PracticeLabV1, AutomationExerciseV3 } from '@/types/lab.types';
import { BUILTIN_BLOCK_DEFINITIONS } from '../features/lab/runtime/v3/blockDsl';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-mock"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

describe('Automation V3 Workspace Component Suite (Task 3)', () => {
  const sampleExercise: AutomationExerciseV3 = {
    version: '3.0',
    framework: 'playwright',
    interactionMode: 'block_builder',
    contentRevision: 'rev-2026-10-01',
    fixture: {
      fixtureId: 'order-investigation-app',
      fixtureVersion: '1.0.0',
      initialRoute: '/orders',
    },
    allowedBlocks: [
      BUILTIN_BLOCK_DEFINITIONS.nav_goto,
      BUILTIN_BLOCK_DEFINITIONS.act_click,
      BUILTIN_BLOCK_DEFINITIONS.assert_visible,
    ],
    starterPlan: [
      {
        id: 'step_1',
        blockType: 'nav_goto',
        category: 'navigation',
        params: { route: '/orders' },
        isLocked: true,
      },
    ],
    publicChecks: [
      {
        id: 'chk_1',
        name: 'Orders Navigation Check',
        ruleType: 'block_exists',
        targetBlockType: 'nav_goto',
      },
    ],
    exportTemplate: 'typescript',
    title: 'Orders Investigation Lab',
  };

  const mockLab: PracticeLabV1 = {
    id: 'lab-playwright-01',
    slug: 'playwright-01-order-investigation',
    seriesId: 'series-auto-v3',
    title: 'Playwright Lab 01',
    sandboxType: 'js_worker',
    order: 1,
    isProOnly: false,
    estimatedMinutes: 20,
    envelope: {
      version: '3.0',
      sandboxType: 'js_worker',
      instructions: 'Investigate failed orders',
      initialSnippet: '',
      testScript: '',
      config: sampleExercise,
    },
  };

  it('resolves AutomationV3Workspace when envelope version is 3.0', () => {
    const Strategy = getWorkspaceStrategy('js_worker', '3.0');
    expect(Strategy).toBe(AutomationV3Workspace);

    const LegacyStrategy = getWorkspaceStrategy('js_worker', '2.0');
    expect(LegacyStrategy).not.toBe(AutomationV3Workspace);
  });

  it('renders top toolbar, palette, visual steps editor, and mini-app preview', () => {
    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Toolbar labels - Client Scenario Runner appears in top toolbar and preview header
    const runnerLabels = screen.getAllByText('Client Scenario Runner');
    expect(runnerLabels.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Visual Steps')).toBeDefined();
    expect(screen.getByText('Generated .spec.ts')).toBeDefined();
    expect(screen.getByRole('button', { name: /Run Scenario/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Submit/i })).toBeDefined();

    // Syntax Palette
    expect(screen.getByRole('region', { name: 'Block Syntax Palette' })).toBeDefined();

    // Visual step
    expect(screen.getByRole('region', { name: 'Visual Step Plan Editor' })).toBeDefined();
    expect(screen.getAllByText(/Navigate to Route/i).length).toBeGreaterThanOrEqual(1);

    // Mini App preview
    expect(screen.getByRole('region', { name: 'Client Scenario Runner Preview' })).toBeDefined();
  });

  it('adds a new block when clicking an item from syntax palette and compiles code', () => {
    const onCodeChange = vi.fn();
    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={onCodeChange}
        onSubmit={vi.fn()}
      />,
    );

    const clickBlockBtn = screen.getByRole('button', { name: /Add Click \(click\) block/i });
    fireEvent.click(clickBlockBtn);

    // Code change should be called with updated code including click action
    expect(onCodeChange).toHaveBeenCalled();
    const lastCallArg = onCodeChange.mock.calls[onCodeChange.mock.calls.length - 1][0];
    expect(lastCallArg).toContain('.click();');
  });

  it('switches to generated Playwright code tab on toggle', () => {
    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const codeTabBtn = screen.getByRole('button', { name: /Generated \.spec\.ts/i });
    fireEvent.click(codeTabBtn);

    expect(screen.getByText(/Generated Playwright Code \(Read-Only\)/i)).toBeDefined();
    expect(screen.getByTestId('monaco-mock')).toBeDefined();
  });

  it('renders mobile tab switcher and switches sections on 375px mobile viewport', () => {
    // Set viewport to mobile 375px
    act(() => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
    });

    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const paletteBtn = screen.getByRole('button', { name: 'Palette' });
    const stepsBtn = screen.getByRole('button', { name: 'Steps' });
    const previewBtn = screen.getByRole('button', { name: 'Preview' });

    expect(paletteBtn).toBeDefined();
    expect(stepsBtn).toBeDefined();
    expect(previewBtn).toBeDefined();

    // Switch to Palette
    act(() => {
      fireEvent.click(paletteBtn);
    });
    expect(screen.getByRole('region', { name: 'Block Syntax Palette' })).toBeDefined();

    // Switch to Preview
    act(() => {
      fireEvent.click(previewBtn);
    });
    expect(screen.getByRole('region', { name: 'Client Scenario Runner Preview' })).toBeDefined();

    // Reset window width back
    act(() => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
    });
  });

  it('correctly parses Playwright TypeScript code to declarative automation steps', () => {
    const playwrightCode = `
      await page.goto('/orders');
      await page.locator('#search').fill('ORD-123');
      await page.locator('#filter-btn').click();
      await page.locator('#remember').check();
      await page.locator('#status-select').selectOption('delivered');
      await expect(page.locator('.order-row')).toBeVisible();
      await expect(page.locator('.order-id')).toHaveText('ORD-123');
      await expect(page).toHaveURL('/orders/ORD-123');
    `;

    const parsed = parsePlaywrightCodeToSteps(playwrightCode);
    expect(parsed).toHaveLength(8);

    expect(parsed[0].blockType).toBe('nav_goto');
    expect(parsed[0].params.route).toBe('/orders');

    expect(parsed[1].blockType).toBe('act_fill');
    expect(parsed[1].params.locator).toBe("page.locator('#search')");
    expect(parsed[1].params.value).toBe('ORD-123');

    expect(parsed[2].blockType).toBe('act_click');
    expect(parsed[2].params.locator).toBe("page.locator('#filter-btn')");

    expect(parsed[3].blockType).toBe('act_check');
    expect(parsed[3].params.locator).toBe("page.locator('#remember')");

    expect(parsed[4].blockType).toBe('act_select_option');
    expect(parsed[4].params.value).toBe('delivered');

    expect(parsed[5].blockType).toBe('assert_visible');
    expect(parsed[6].blockType).toBe('assert_text');
    expect(parsed[6].params.expected).toBe('ORD-123');

    expect(parsed[7].blockType).toBe('assert_url');
    expect(parsed[7].params.url).toBe('/orders/ORD-123');
  });

  it('supports full_code mode with editable Monaco editor and Task Brief drawer', () => {
    const fullCodeLab: PracticeLabV1 = {
      ...mockLab,
      envelope: {
        ...mockLab.envelope,
        config: {
          ...sampleExercise,
          interactionMode: 'full_code' as const,
          scenarioDescription: 'Find and fix the broken locator in the Playwright test script.',
          publicChecks: [
            {
              id: 'chk_1',
              name: 'Order Query Check',
              ruleType: 'block_exists',
              targetBlockType: 'act_click',
            },
          ],
        },
      } as any,
    };

    const onCodeChange = vi.fn();
    render(
      <AutomationV3Workspace
        lab={fullCodeLab}
        code="await page.goto('/orders');"
        onCodeChange={onCodeChange}
        onSubmit={vi.fn()}
      />
    );

    // Initial tab in full_code should be code editor with editable title
    expect(screen.getByText('Playwright TypeScript Test Script')).toBeDefined();
    const monaco = screen.getByTestId('monaco-mock');
    expect(monaco).toBeDefined();

    // Type in code editor
    fireEvent.change(monaco, { target: { value: "await page.goto('/orders');\nawait page.locator('#btn').click();" } });
    expect(onCodeChange).toHaveBeenCalledWith("await page.goto('/orders');\nawait page.locator('#btn').click();");

    // Click Task Brief button
    const taskBriefBtn = screen.getByRole('button', { name: /Task Brief/i });
    expect(taskBriefBtn).toBeDefined();
    fireEvent.click(taskBriefBtn);

    // Sheet should open displaying scenario & checklist
    expect(screen.getByText(/Orders Investigation Lab/i)).toBeDefined();
    expect(screen.getByText(/Find and fix the broken locator in the Playwright test script/i)).toBeDefined();
    expect(screen.getByText('Order Query Check')).toBeDefined();
  });
});
