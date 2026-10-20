import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/features/preferences/theme';
import { SqlPracticeWorkspace } from '@/features/lab/strategies/SqlPracticeWorkspace';
import type { PracticeLabV1 } from '@/types/lab.types';

let capturedTheme: string | undefined;

vi.mock('@monaco-editor/react', () => ({
  default: (props: any) => {
    capturedTheme = props.theme;
    return <div data-testid="mock-monaco-editor" data-theme={props.theme} />;
  },
}));

function TestWrapper({ lab, code }: { lab: PracticeLabV1; code: string }) {
  const { setThemePreference } = useTheme();

  return (
    <div>
      <button onClick={() => setThemePreference('light')} data-testid="set-light">Light</button>
      <button onClick={() => setThemePreference('dark')} data-testid="set-dark">Dark</button>
      <SqlPracticeWorkspace
        lab={lab}
        code={code}
        onCodeChange={() => {}}
        onSubmit={async () => ({ status: 'passed' } as any)}
      />
    </div>
  );
}

describe('Monaco Theme Synchronization (Subtask 1.4)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    capturedTheme = undefined;
  });

  const mockLab: PracticeLabV1 = {
    id: 'sql-theme-test',
    slug: 'sql-theme-test',
    title: 'SQL Theme Test Lab',
    seriesId: 'series-sql-01',
    order: 1,
    sandboxType: 'sql_worker',
    isProOnly: false,
    envelope: {
      version: '1.0',
      sandboxType: 'sql_worker',
      instructions: '# Test',
      initialSnippet: 'SELECT 1;',
      config: {
        version: '1.0',
        schemaSql: 'CREATE TABLE t (id INT);',
      },
    },
  };

  it('synchronizes Monaco theme with dark and light preferences', () => {
    localStorage.setItem('study_theme', 'dark');

    render(
      <ThemeProvider>
        <TestWrapper lab={mockLab} code="SELECT * FROM t;" />
      </ThemeProvider>
    );

    expect(capturedTheme).toBe('vs-dark');

    // Switch to light
    act(() => {
      screen.getByTestId('set-light').click();
    });

    expect(capturedTheme).toBe('vs');

    // Switch to dark
    act(() => {
      screen.getByTestId('set-dark').click();
    });

    expect(capturedTheme).toBe('vs-dark');
  });
});
