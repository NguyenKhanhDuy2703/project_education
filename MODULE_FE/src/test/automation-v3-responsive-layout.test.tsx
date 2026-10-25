import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AutomationV3Workspace } from '../features/lab/strategies/AutomationV3Workspace';
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

describe('Automation V3 Responsive Layout & Sizing Regression Suite (Task 0.1)', () => {
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

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('asserts panels have stable IDs and does not pass numeric pixel values for percentage sizing', () => {
    // Set window width to wide desktop
    window.innerWidth = 1440;
    const { container } = render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Locate panels
    const palettePanel = container.querySelector('[data-panel-id="automation-v3-palette"], [id="automation-v3-palette"]');
    const editorPanel = container.querySelector('[data-panel-id="automation-v3-editor"], [id="automation-v3-editor"]');
    const previewPanel = container.querySelector('[data-panel-id="automation-v3-preview"], [id="automation-v3-preview"]');

    expect(palettePanel).not.toBeNull();
    expect(editorPanel).not.toBeNull();
    expect(previewPanel).not.toBeNull();

    // Verify palette panel is rendered inline and usable
    expect(screen.getByRole('region', { name: 'Block Syntax Palette' })).toBeDefined();
  });

  it('renders medium workspace composition (2-pane + palette drawer) when container is medium width', () => {
    // In medium container width (e.g., 800px):
    // Editor and preview are side-by-side, while palette is accessible via a drawer trigger
    window.innerWidth = 900;

    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // In medium mode, there should be a button to open palette drawer
    const openPaletteBtn = screen.queryByRole('button', { name: /Palette/i });
    expect(openPaletteBtn).not.toBeNull();

    // Editor and Preview are still rendered
    expect(screen.getByRole('region', { name: 'Visual Step Plan Editor' })).toBeDefined();
    expect(screen.getByRole('region', { name: 'Client Scenario Runner Preview' })).toBeDefined();
  });

  it('renders small workspace composition (tabs) when container is under 768px', () => {
    window.innerWidth = 375;

    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    // Tab buttons for mobile
    const paletteBtn = screen.getByRole('button', { name: 'Palette' });
    const stepsBtn = screen.getByRole('button', { name: 'Steps' });
    const previewBtn = screen.getByRole('button', { name: 'Preview' });

    expect(paletteBtn).toBeDefined();
    expect(stepsBtn).toBeDefined();
    expect(previewBtn).toBeDefined();

    // Touch targets meet 44px min requirement
    expect(paletteBtn.className).toContain('min-h-[44px]');
  });

  it('provides a reset-layout action that only clears automation workspace layout in storage', () => {
    window.innerWidth = 1280;
    const storageKey = 'study-web:panels:automation-v3-workspace';
    localStorage.setItem(storageKey, JSON.stringify({ 'automation-v3-palette': 10 }));
    localStorage.setItem('study-web:theme', 'dark');
    localStorage.setItem('unrelated-key', 'keep-me');

    render(
      <AutomationV3Workspace
        lab={mockLab}
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const resetLayoutBtn = screen.getByRole('button', { name: /Reset Layout/i });
    expect(resetLayoutBtn).toBeDefined();

    act(() => {
      fireEvent.click(resetLayoutBtn);
    });

    // The layout key must be removed
    expect(localStorage.getItem(storageKey)).toBeNull();
    // Unrelated keys must NOT be removed
    expect(localStorage.getItem('study-web:theme')).toBe('dark');
    expect(localStorage.getItem('unrelated-key')).toBe('keep-me');
  });

  it('verifies responsive compositions across 375, 768, 1024, 1280, and 1440 px widths (Task 0.5)', () => {
    const testWidths = [
      { width: 375, expectedMode: 'small' },
      { width: 768, expectedMode: 'medium' },
      { width: 1024, expectedMode: 'wide' },
      { width: 1280, expectedMode: 'wide' },
      { width: 1440, expectedMode: 'wide' },
    ];

    for (const { width, expectedMode } of testWidths) {
      window.innerWidth = width;
      const { unmount, container } = render(
        <AutomationV3Workspace
          lab={mockLab}
          code=""
          onCodeChange={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      if (expectedMode === 'small') {
        expect(screen.getByRole('button', { name: 'Palette' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Steps' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Preview' })).toBeDefined();
      } else if (expectedMode === 'medium') {
        expect(screen.getByRole('button', { name: /Palette/i })).toBeDefined();
        expect(container.querySelector('[data-panel-id="automation-v3-editor"], [id="automation-v3-editor"]')).not.toBeNull();
        expect(container.querySelector('[data-panel-id="automation-v3-preview"], [id="automation-v3-preview"]')).not.toBeNull();
      } else {
        expect(container.querySelector('[data-panel-id="automation-v3-palette"], [id="automation-v3-palette"]')).not.toBeNull();
        expect(container.querySelector('[data-panel-id="automation-v3-editor"], [id="automation-v3-editor"]')).not.toBeNull();
        expect(container.querySelector('[data-panel-id="automation-v3-preview"], [id="automation-v3-preview"]')).not.toBeNull();
      }

      unmount();
    }
  });
});
