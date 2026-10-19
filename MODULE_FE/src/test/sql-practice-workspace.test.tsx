import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SqlPracticeWorkspace } from '../features/lab/strategies/SqlPracticeWorkspace';
import { MockSqlEngineAdapter } from '../features/lab/sql-engine/SqlEngineAdapter';
import type { PracticeLabV1 } from '../types/lab.types';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="monaco-sql-mock"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('SqlPracticeWorkspace Component Suite (Subtask 5.7)', () => {
  const mockLab: Partial<PracticeLabV1> = {
    id: 'lab-sql-1',
    slug: 'sql-query-basics',
    title: 'Top Earning Departments',
    sandboxType: 'sql_worker',
    envelope: {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions: '# SQL Instructions',
      initialSnippet: 'SELECT * FROM departments;',
      config: {
        version: '1.0',
        schemaSql: 'CREATE TABLE departments (id int, name text);',
        seedSql: "INSERT INTO departments VALUES (1, 'Engineering');",
        expectedQueryResult: [{ id: 1, name: 'Engineering' }],
        expectedColumns: ['id', 'name'],
      },
    },
  };

  let mockAdapter: MockSqlEngineAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdapter = new MockSqlEngineAdapter(
      [
        {
          tableName: 'departments',
          columns: [
            { name: 'id', type: 'int', isPrimaryKey: true },
            { name: 'name', type: 'text' },
          ],
        },
      ],
      {
        'SELECT * FROM departments': {
          columns: ['id', 'name'],
          rows: [{ id: 1, name: 'Engineering' }],
          rowCount: 1,
          executionTimeMs: 12,
        },
      }
    );
  });

  it('renders top toolbar, editor, and schema info', async () => {
    render(
      <SqlPracticeWorkspace
        lab={mockLab as PracticeLabV1}
        code="SELECT * FROM departments;"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
        customAdapter={mockAdapter}
      />
    );

    expect(screen.getByText(/PostgreSQL Query Editor/i)).toBeDefined();
    expect(await screen.findByText(/PGlite \(in-browser\)/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Run Query/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Submit Lab/i })).toBeDefined();
  });

  it('blocks non-read statements and displays security alert', async () => {
    render(
      <SqlPracticeWorkspace
        lab={mockLab as PracticeLabV1}
        code="DROP TABLE departments;"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
        customAdapter={mockAdapter}
      />
    );

    await screen.findByText(/PGlite \(in-browser\)/i);
    const runBtn = screen.getByRole('button', { name: /Run Query/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Security Warning/i)).toBeDefined();
    });
  });

  it('runs valid query, renders results and matched diff', async () => {
    const onSubmitMock = vi.fn();

    render(
      <SqlPracticeWorkspace
        lab={mockLab as PracticeLabV1}
        code="SELECT * FROM departments"
        onCodeChange={() => {}}
        onSubmit={onSubmitMock}
        customAdapter={mockAdapter}
      />
    );

    // Wait for adapter initialization
    await screen.findByText(/Schema \(1\)/i);

    const runBtn = screen.getByRole('button', { name: /Run Query/i });
    expect(runBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Matched/i)).toBeDefined();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Lab/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });
  });

  it('submits the result produced by the same click without stale state', async () => {
    const onSubmitMock = vi.fn();

    render(
      <SqlPracticeWorkspace
        lab={mockLab as PracticeLabV1}
        code="SELECT * FROM departments"
        onCodeChange={() => {}}
        onSubmit={onSubmitMock}
        customAdapter={mockAdapter}
      />
    );

    await screen.findByText(/Schema \(1\)/i);
    fireEvent.click(screen.getByRole('button', { name: /Submit Lab/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          submittedCode: 'SELECT * FROM departments',
          status: 'passed',
        }),
      );
    });
  });

  it('invalidates displayed grading when the learner edits SQL', async () => {
    render(
      <SqlPracticeWorkspace
        lab={mockLab as PracticeLabV1}
        code="SELECT * FROM departments"
        onCodeChange={() => {}}
        onSubmit={vi.fn()}
        customAdapter={mockAdapter}
      />
    );

    await screen.findByText(/Schema \(1\)/i);
    fireEvent.click(screen.getByRole('button', { name: /Run Query/i }));
    await screen.findByText(/Matched/i);

    fireEvent.change(screen.getByTestId('monaco-sql-mock'), {
      target: { value: 'SELECT name FROM departments' },
    });

    expect(screen.queryByText(/Matched/i)).toBeNull();
  });
});
