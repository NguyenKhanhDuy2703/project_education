import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibleBarChart, type BarChartItem } from '@/components/charts/AccessibleBarChart';

describe('AccessibleBarChart Primitive (Task 10 / Subtask 10.2)', () => {
  const sampleItems: BarChartItem[] = [
    { id: 'sql', label: 'SQL Query Practice', value: 12, colorClass: 'bg-blue-500' },
    { id: 'quiz', label: 'Quiz & Flashcards', value: 8, colorClass: 'bg-purple-500', badge: 'PRO' },
    { id: 'auto', label: 'Playwright Automation', value: 4, colorClass: 'bg-emerald-500' },
  ];

  it('renders title, description, categories, and progress bars with aria attributes', () => {
    render(
      <AccessibleBarChart
        title="Content Mix"
        description="Distribution of learning formats"
        items={sampleItems}
        valueUnit="labs"
      />
    );

    expect(screen.getByRole('heading', { name: 'Content Mix' })).toBeDefined();
    expect(screen.getByText('Distribution of learning formats')).toBeDefined();
    expect(screen.getAllByText('SQL Query Practice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Quiz & Flashcards').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Playwright Automation').length).toBeGreaterThanOrEqual(1);

    // Verify progressbar roles and aria-valuenow
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(3);
    expect(progressBars[0].getAttribute('aria-valuenow')).toBe('12');
    expect(progressBars[0].getAttribute('aria-valuetext')).toContain('12 labs (50%)');

    // Verify screen-reader table equivalent
    expect(screen.getByText('Content Mix - Screen Reader Summary')).toBeDefined();
  });

  it('toggles to visual table view and back to chart view', () => {
    render(
      <AccessibleBarChart
        title="Plan Distribution"
        items={sampleItems}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /table view/i });
    expect(toggleBtn).toBeDefined();

    // Switch to table view
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Chart view')).toBeDefined();
    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('Category')).toBeDefined();
    expect(screen.getByText('Share')).toBeDefined();

    // Switch back to chart view
    fireEvent.click(screen.getByRole('button', { name: /chart view/i }));
    expect(screen.getByText('Table view')).toBeDefined();
    expect(screen.getAllByRole('progressbar').length).toBe(3);
  });

  it('renders clean empty state when no items exist', () => {
    render(
      <AccessibleBarChart
        title="Empty Metrics"
        items={[]}
        emptyMessage="No metric items recorded."
      />
    );

    expect(screen.getByText('No metric items recorded.')).toBeDefined();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('renders skeleton loading state when isLoading is true', () => {
    const { container } = render(
      <AccessibleBarChart
        title="Loading Metrics"
        items={sampleItems}
        isLoading={true}
      />
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('SQL Query Practice')).toBeNull();
  });
});
