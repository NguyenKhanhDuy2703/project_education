import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardOverviewView } from '@/pages/dashboard/views/DashboardOverviewView';
import { I18nProvider } from '@/features/preferences/i18n';
import { labApi } from '@/features/lab/api/lab.api';

vi.mock('@/features/lab/api/lab.api', () => ({
  labApi: {
    getDashboardStats: vi.fn(),
  },
}));

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <MemoryRouter>
          <DashboardOverviewView />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe('DashboardOverviewView Component (Task 6 / Subtask 6.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders all 4 KPI cards and series progress bars with accessible progressbar attributes', async () => {
    vi.mocked(labApi.getDashboardStats).mockResolvedValue({
      totalCompleted: 7,
      totalLabs: 10,
      streakDays: 5,
      seriesProgress: [
        {
          seriesId: 'series-sql-01',
          seriesTitle: 'PostgreSQL Mastery',
          completedLabs: 4,
          totalLabs: 5,
          percentComplete: 80,
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('7')).toBeDefined();
    });
    expect(screen.getByText('Completed Labs')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Total Labs')).toBeDefined();
    expect(screen.getByText('5 days')).toBeDefined();
    expect(screen.getByText('Day Streak')).toBeDefined();
    expect(screen.getByText('70%')).toBeDefined();
    expect(screen.getByText('Overall Progress')).toBeDefined();

    // Check accessible progress bars
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(2); // overall + series

    const overallBar = progressBars[0];
    expect(overallBar.getAttribute('aria-valuenow')).toBe('70');
    expect(overallBar.getAttribute('aria-valuemin')).toBe('0');
    expect(overallBar.getAttribute('aria-valuemax')).toBe('100');

    // Check series progress
    expect(screen.getByText('PostgreSQL Mastery')).toBeDefined();
    expect(screen.getByText('4/5 labs (80%)')).toBeDefined();
  });

  it('enforces English dashboard headings and labels even if legacy locale was stored', async () => {
    localStorage.setItem('study_locale', 'vi');

    vi.mocked(labApi.getDashboardStats).mockResolvedValue({
      totalCompleted: 3,
      totalLabs: 10,
      streakDays: 2,
      seriesProgress: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /learner dashboard/i })).toBeDefined();
    });

    expect(screen.getByText('Completed Labs')).toBeDefined();
    expect(screen.getByText('Total Labs')).toBeDefined();
    expect(screen.getByText('Day Streak')).toBeDefined();
    expect(screen.getByText('Overall Progress')).toBeDefined();
  });

  it('renders error banner when stats query fails', async () => {
    vi.mocked(labApi.getDashboardStats).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/could not load learner statistics/i)
      ).toBeDefined();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined();
  });
});
