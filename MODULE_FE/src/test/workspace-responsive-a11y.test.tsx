import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LabTheoryPane } from '../pages/lab/_components/LabTheoryPane';
import { CompletionCelebrationDialog } from '../pages/lab/_components/CompletionCelebrationDialog';
import { CurriculumDrawerSheet } from '../pages/lab/_components/CurriculumDrawerSheet';
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

  it('renders CurriculumDrawerSheet with multi-line wrapping and accessible title for long series and lab names', () => {
    const longSeriesTitle = 'Comprehensive Enterprise PostgreSQL Database Architecture and Advanced Indexing Strategy Mastery Series';
    const longLabTitle = 'Challenge 01: Deep Dive Analysis into High-Throughput Partitioning, Query Execution Plans and B-Tree Balancing';

    render(
      <MemoryRouter>
        <CurriculumDrawerSheet
          series={{
            id: 'series-long',
            slug: 'series-long',
            title: longSeriesTitle,
            description: 'Deep dive series for advanced database engineers.',
            level: 'advanced',
            isProOnly: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            labs: [
              {
                id: 'lab-long',
                slug: 'lab-long',
                title: longLabTitle,
                seriesId: 'series-long',
                order: 1,
                isProOnly: true,
                sandboxType: 'sql_worker',
                estimatedMinutes: 30,
              },
            ],
          } as any}
          currentLabId="lab-long"
          isDrawerOpen={true}
          setIsDrawerOpen={() => {}}
          labSearchQuery=""
          setLabSearchQuery={() => {}}
          filteredSeriesLabs={[
            {
              id: 'lab-long',
              slug: 'lab-long',
              title: longLabTitle,
              seriesId: 'series-long',
              order: 1,
              isProOnly: true,
              sandboxType: 'sql_worker',
              estimatedMinutes: 30,
            },
          ]}
          onSwitchLab={() => {}}
        />
      </MemoryRouter>,
    );

    // Verify series title element has break-words and tooltip
    const seriesTitleEl = screen.getByText(longSeriesTitle);
    expect(seriesTitleEl).toBeDefined();
    expect(seriesTitleEl.className).toContain('break-words');
    expect(seriesTitleEl.getAttribute('title')).toBe(longSeriesTitle);

    // Verify lab title element has line-clamp-2 and tooltip
    const labTitleEl = screen.getByText(longLabTitle);
    expect(labTitleEl).toBeDefined();
    expect(labTitleEl.className).toContain('line-clamp-2');
    expect(labTitleEl.className).toContain('break-words');
  });

  it('supports keyboard traversal and activation via Enter key in CurriculumDrawerSheet', () => {
    let switchedLab: any = null;
    const labItem = {
      id: 'lab-kb-1',
      slug: 'lab-kb-1',
      title: 'Accessible Keyboard Navigation Challenge',
      seriesId: 'series-1',
      order: 1,
      isProOnly: false,
      sandboxType: 'sql_worker' as const,
      estimatedMinutes: 10,
    };

    render(
      <MemoryRouter>
        <CurriculumDrawerSheet
          series={{
            id: 'series-1',
            slug: 'series-1',
            title: 'Accessibility Series',
            description: 'Testing keyboard navigation.',
            level: 'beginner',
            isProOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            labs: [labItem],
          } as any}
          currentLabId="lab-kb-1"
          isDrawerOpen={true}
          setIsDrawerOpen={() => {}}
          labSearchQuery=""
          setLabSearchQuery={() => {}}
          filteredSeriesLabs={[labItem]}
          onSwitchLab={(item) => {
            switchedLab = item;
          }}
        />
      </MemoryRouter>,
    );

    const buttonRow = screen.getByRole('button', { name: /Challenge 1: Accessible Keyboard Navigation Challenge/i });
    expect(buttonRow).toBeDefined();
    expect(buttonRow.getAttribute('tabindex')).toBe('0');

    // Simulate pressing Enter key
    buttonRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(switchedLab).toEqual(labItem);
  });
});
