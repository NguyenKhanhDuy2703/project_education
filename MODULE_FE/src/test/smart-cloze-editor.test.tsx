import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartClozeEditor } from '@/features/lab/components/SmartClozeEditor';
import type { BlankDefinition, TemplateSegment } from '@/types/lab.types';

describe('SmartClozeEditor Component Suite (Subtask 3.1)', () => {
  const mockBlanks: BlankDefinition[] = [
    {
      id: 'status_code',
      kind: 'http_status',
      label: 'HTTP Status',
      valueType: 'number',
      options: [
        { value: 200, label: '200 OK' },
        { value: 401, label: '401 Unauthorized' },
      ],
    },
    {
      id: 'token_val',
      kind: 'expected_value',
      label: 'Expected Token',
      valueType: 'string',
      placeholder: 'token string',
    },
  ];

  const mockTemplate: TemplateSegment[] = [
    {
      kind: 'managed',
      label: 'Framework Setup',
      summary: '8 hidden lines',
      code: 'const client = createTestClient();',
    },
    { kind: 'readonly', text: 'expect(res.status).toBe(' },
    { kind: 'blank', blankId: 'status_code' },
    { kind: 'readonly', text: ');\nexpect(res.token).toBe(' },
    { kind: 'blank', blankId: 'token_val' },
    { kind: 'readonly', text: ');' },
  ];

  it('renders locked code, line numbers, and inline blank controls', () => {
    render(
      <SmartClozeEditor
        template={mockTemplate}
        blanks={mockBlanks}
        answers={{ status_code: '200', token_val: 'abc' }}
        onAnswerChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/expect\(res\.status\)\.toBe\(/i)).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'HTTP Status' })).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Expected Token' })).toBeDefined();
  });

  it('allows toggling managed blocks fold', () => {
    render(
      <SmartClozeEditor
        template={mockTemplate}
        blanks={mockBlanks}
        answers={{}}
        onAnswerChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/▸ Framework Setup/i)).toBeDefined();
    expect(screen.queryByText('const client = createTestClient();')).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByRole('button', { name: /Framework Setup/i }));
    expect(screen.getByText('const client = createTestClient();')).toBeDefined();

    // Click to collapse
    fireEvent.click(screen.getByRole('button', { name: /Framework Setup/i }));
    expect(screen.queryByText('const client = createTestClient();')).toBeNull();
  });

  it('dispatches onAnswerChange on select and input edits', () => {
    const handleAnswerChange = vi.fn();
    render(
      <SmartClozeEditor
        template={mockTemplate}
        blanks={mockBlanks}
        answers={{ status_code: '200', token_val: '' }}
        onAnswerChange={handleAnswerChange}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'HTTP Status' });
    fireEvent.change(select, { target: { value: '401' } });
    expect(handleAnswerChange).toHaveBeenCalledWith('status_code', 401);

    const input = screen.getByRole('textbox', { name: 'Expected Token' });
    fireEvent.change(input, { target: { value: 'mock_token' } });
    expect(handleAnswerChange).toHaveBeenCalledWith('token_val', 'mock_token');
  });

  it('displays error indicators when validationErrors are present', () => {
    render(
      <SmartClozeEditor
        template={mockTemplate}
        blanks={mockBlanks}
        answers={{ status_code: '200', token_val: '' }}
        onAnswerChange={vi.fn()}
        validationErrors={{ token_val: 'Expected Token is required.' }}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Expected Token' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('correctly numbers the first code line as 1 even when preceded by managed fold', () => {
    const { container } = render(
      <SmartClozeEditor
        template={mockTemplate}
        blanks={mockBlanks}
        answers={{}}
        onAnswerChange={vi.fn()}
      />,
    );

    // The first line number element for code lines should display "1"
    const lineNumbers = container.querySelectorAll('.w-8.shrink-0');
    expect(lineNumbers.length).toBeGreaterThan(0);
    expect(lineNumbers[0].textContent?.trim()).toBe('1');
    if (lineNumbers.length > 1) {
      expect(lineNumbers[1].textContent?.trim()).toBe('2');
    }
  });

  it('provides single blank reset button when onResetBlank is passed', () => {
    const handleResetBlank = vi.fn();
    render(
      <SmartClozeEditor
        template={mockTemplate}
        blanks={mockBlanks}
        answers={{ token_val: 'custom_input' }}
        onAnswerChange={vi.fn()}
        activeBlankId="token_val"
        onResetBlank={handleResetBlank}
      />,
    );

    const resetBtn = screen.getByRole('button', { name: /Reset this blank/i });
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);
    expect(handleResetBlank).toHaveBeenCalledWith('token_val');
  });

  it('renders unique HTML IDs when a blank ID occurs multiple times in template', () => {
    const multiTemplate: TemplateSegment[] = [
      { kind: 'readonly', text: 'expect(a).toBe(' },
      { kind: 'blank', blankId: 'status_code' },
      { kind: 'readonly', text: ');\nexpect(b).toBe(' },
      { kind: 'blank', blankId: 'status_code' },
      { kind: 'readonly', text: ');' },
    ];

    render(
      <SmartClozeEditor
        template={multiTemplate}
        blanks={mockBlanks}
        answers={{ status_code: 200 }}
        onAnswerChange={vi.fn()}
      />,
    );

    const selects = screen.getAllByRole('combobox', { name: 'HTTP Status' });
    expect(selects.length).toBe(2);
    expect(selects[0].id).not.toBe(selects[1].id);
  });
});
