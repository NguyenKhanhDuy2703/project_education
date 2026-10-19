import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SqlPracticeWorkspace } from '../features/lab/strategies/SqlPracticeWorkspace';
import { AutomationTestWorkspace } from '../features/lab/strategies/AutomationTestWorkspace';
import { MockSqlEngineAdapter } from '../features/lab/sql-engine/SqlEngineAdapter';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import type { PracticeLabV1 } from '@/types/lab.types';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="monaco-mock-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock useLabWorker
vi.mock('@/features/lab/hooks/useLabWorker', () => ({
  useLabWorker: () => ({
    status: 'idle',
    result: null,
    run: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('Resizable Panes Workspace Integration Suite', () => {
  const mockSqlLab: Partial<PracticeLabV1> = {
    id: 'lab-sql-resizable',
    slug: 'sql-resizable-test',
    title: 'SQL Resizable Panes Lab',
    sandboxType: 'sql_worker',
    envelope: {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions: '# SQL Resizable Instructions',
      initialSnippet: 'SELECT * FROM users;',
      config: {
        version: '1.0',
        schemaSql: 'CREATE TABLE users (id int, name text);',
        seedSql: "INSERT INTO users VALUES (1, 'Alice');",
        expectedQueryResult: [{ id: 1, name: 'Alice' }],
        expectedColumns: ['id', 'name'],
      },
    },
  };

  const mockAutomationLab: Partial<PracticeLabV1> = {
    id: 'lab-auto-resizable',
    slug: 'automation-resizable-test',
    title: 'Automation Resizable Panes Lab',
    sandboxType: 'js_worker',
    envelope: {
      version: '1.0',
      sandboxType: 'js_worker',
      instructions: '# Test Instructions',
      initialSnippet: 'expect(true).toBe(true);',
      testScript: 'assert(true);',
    },
  };

  it('renders SqlPracticeWorkspace with vertical resizable panel group and drag separator handle', async () => {
    const mockAdapter = new MockSqlEngineAdapter(
      [{ tableName: 'users', columns: [{ name: 'id', type: 'int' }] }],
      { 'SELECT * FROM users': { columns: ['id'], rows: [{ id: 1 }], rowCount: 1, executionTimeMs: 10 } }
    );

    const { container } = render(
      <MemoryRouter>
        <SqlPracticeWorkspace
          lab={mockSqlLab as PracticeLabV1}
          code="SELECT * FROM users;"
          onCodeChange={() => {}}
          onSubmit={vi.fn()}
          customAdapter={mockAdapter}
        />
      </MemoryRouter>
    );

    await screen.findByText(/PGlite \(in-browser\)/i);

    // Verify vertical panel group
    const panelGroup = container.querySelector('[data-slot="resizable-panel-group"]');
    expect(panelGroup).not.toBeNull();
    expect(panelGroup?.getAttribute('aria-orientation')).toBe('vertical');

    // Verify panels (Monaco editor panel and results panel)
    const panels = container.querySelectorAll('[data-slot="resizable-panel"]');
    expect(panels.length).toBe(2);

    // Verify resizable handle separator with handle pill
    const handle = container.querySelector('[data-slot="resizable-handle"][role="separator"]');
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('renders AutomationTestWorkspace with vertical resizable panel group and drag separator handle', () => {
    const { container } = render(
      <MemoryRouter>
        <AutomationTestWorkspace
          lab={mockAutomationLab as PracticeLabV1}
          code="expect(true).toBe(true);"
          onCodeChange={() => {}}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>
    );

    // Verify vertical panel group
    const panelGroup = container.querySelector('[data-slot="resizable-panel-group"]');
    expect(panelGroup).not.toBeNull();
    expect(panelGroup?.getAttribute('aria-orientation')).toBe('vertical');

    // Verify panels
    const panels = container.querySelectorAll('[data-slot="resizable-panel"]');
    expect(panels.length).toBe(2);

    // Verify resizable handle separator
    const handle = container.querySelector('[data-slot="resizable-handle"][role="separator"]');
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('renders ResizablePanelGroup with horizontal orientation for theory and workspace split', () => {
    const { container } = render(
      <ResizablePanelGroup direction="horizontal" autoSaveId="test-horizontal">
        <ResizablePanel defaultSize="40%"><div>Theory</div></ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="60%"><div>Workspace</div></ResizablePanel>
      </ResizablePanelGroup>
    );

    const group = container.querySelector('[data-slot="resizable-panel-group"]');
    expect(group?.getAttribute('aria-orientation')).toBe('horizontal');

    const handle = container.querySelector('[data-slot="resizable-handle"]');
    expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
  });
});
