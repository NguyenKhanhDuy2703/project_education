import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LabTheoryPane } from '../pages/lab/_components/LabTheoryPane';
import { CompletionCelebrationDialog } from '../pages/lab/_components/CompletionCelebrationDialog';
import type { LabDetail } from '@/types/lab.types';

describe('Workspace Responsive & Accessibility Audit (Subtask 3.6)', () => {
  const mockLab: Partial<LabDetail> = {
    id: 'lab-responsive',
    slug: 'lab-responsive',
    title: 'Accessible Responsive Workspace',
    instructions: '# Responsive Design\nTesting layout breakpoints.',
    sandboxType: 'js_worker',
    isProOnly: false,
  };

  it('renders LabTheoryPane with responsive layout classes (stack on mobile, side-by-side on desktop)', () => {
    const { container } = render(
      <MemoryRouter>
        <LabTheoryPane lab={mockLab as LabDetail} />
      </MemoryRouter>,
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    // Verifies mobile 100% width and desktop proportional width
    expect(aside?.className).toContain('w-full');
    expect(aside?.className).toContain('md:w-[45%]');
    expect(aside?.className).toContain('lg:w-[42%]');
  });

  it('provides accessible ARIA tabs with proper semantics and keyboard targets', () => {
    render(
      <MemoryRouter>
        <LabTheoryPane lab={mockLab as LabDetail} />
      </MemoryRouter>,
    );

    const tabList = screen.getByRole('tablist');
    expect(tabList).toBeDefined();

    const instructionsTab = screen.getByRole('tab', { name: /Instructions/i });
    const solutionTab = screen.getByRole('tab', { name: /Solution/i });
    const submissionsTab = screen.getByRole('tab', { name: /Submissions/i });

    expect(instructionsTab.getAttribute('aria-selected')).toBe('true');
    expect(solutionTab.getAttribute('aria-selected')).toBe('false');
    expect(submissionsTab.getAttribute('aria-selected')).toBe('false');
  });

  it('ensures modal dialogs have accessible names and descriptions', () => {
    render(
      <MemoryRouter>
        <CompletionCelebrationDialog
          open={true}
          onOpenChange={() => {}}
          nextLab={{ id: 'next', slug: 'next', seriesId: 'series-1', title: 'Next Lab Challenge', order: 2, isProOnly: false, sandboxType: 'js_worker', estimatedMinutes: 15 }}
          runtimeMs={42}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Lab Challenge Completed!/i })).toBeDefined();
    expect(screen.getByText(/Next up: "Next Lab Challenge"/i)).toBeDefined();
  });
});
