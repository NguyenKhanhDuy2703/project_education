import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestingCheatSheet } from '../features/lab/components/TestingCheatSheet';

describe('TestingCheatSheet Component Suite (Subtask 4.4)', () => {
  it('renders all default matchers and examples', () => {
    render(<TestingCheatSheet />);

    expect(screen.getByText('API Automation Testing CheatSheet')).toBeDefined();
    expect(screen.getByText('expect(a).toBe(b)')).toBeDefined();
    expect(screen.getByText('expect(a).toEqual(b)')).toBeDefined();
    expect(screen.getByText('expect(a).toBeDefined()')).toBeDefined();
    expect(screen.getByText('expect(a).toContain(item)')).toBeDefined();
    expect(screen.getByText('expect(response.status).toBe(200);')).toBeDefined();
  });

  it('handles copying snippet to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(<TestingCheatSheet />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);
    expect(writeTextMock).toHaveBeenCalledWith('expect(response.status).toBe(200);');
    expect(await screen.findByText('Copied')).toBeDefined();
  });
});
