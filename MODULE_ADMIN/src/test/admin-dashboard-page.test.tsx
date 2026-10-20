import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { usersAdminApi } from '@/features/admin/api/users.admin.api';
import { entitlementsAdminApi } from '@/features/admin/api/entitlements.admin.api';
import { seriesApi } from '@/features/lab/api/series.api';

vi.mock('@/features/admin/api/users.admin.api', () => ({
  usersAdminApi: {
    getUsers: vi.fn(),
  },
}));

vi.mock('@/features/admin/api/entitlements.admin.api', () => ({
  entitlementsAdminApi: {
    getPlans: vi.fn(),
    getAuditLogs: vi.fn(),
  },
}));

vi.mock('@/features/lab/api/series.api', () => ({
  seriesApi: {
    getAll: vi.fn(),
  },
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AdminDashboardPage Snapshot Charts Integration (Task 10 / Subtask 10.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usersAdminApi.getUsers).mockResolvedValue({
      users: [],
      meta: { total: 42, page: 1, limit: 1, totalPages: 42 },
    } as any);

    vi.mocked(entitlementsAdminApi.getPlans).mockResolvedValue([
      {
        id: 'plan-free',
        name: 'Free Learner Tier',
        price: 0,
        isDefault: true,
        planFeatures: [{ featureId: 'LAB_RUN' }],
        _count: { subscriptions: 30 },
      },
      {
        id: 'plan-pro',
        name: 'Pro Developer Plan',
        price: 99000,
        isDefault: false,
        planFeatures: [{ featureId: 'LAB_RUN' }, { featureId: 'LAB_PRO' }],
        _count: { subscriptions: 12 },
      },
    ] as any);

    vi.mocked(seriesApi.getAll).mockResolvedValue([
      {
        id: 'series-sql',
        title: 'PostgreSQL Mastery',
        slug: 'sql-mastery',
        category: 'database',
        isProOnly: false,
        _count: { labs: 8 },
      },
      {
        id: 'series-auto',
        title: 'Playwright Automation',
        slug: 'playwright-auto',
        category: 'testing',
        isProOnly: true,
        _count: { labs: 6 },
      },
      {
        id: 'series-quiz',
        title: 'Software Engineering Quiz',
        slug: 'se-quiz',
        category: 'quiz',
        isProOnly: false,
        _count: { labs: 4 },
      },
    ] as any);

    vi.mocked(entitlementsAdminApi.getAuditLogs).mockResolvedValue({
      items: [],
      meta: { total: 15, page: 1, limit: 6, totalPages: 3 },
    } as any);
  });

  it('renders KPI metric cards alongside Platform Distribution Analytics snapshot charts', async () => {
    renderDashboard();

    expect(screen.getByText('Platform Management Dashboard')).toBeDefined();
    expect(await screen.findByText('Platform Distribution Analytics')).toBeDefined();

    // Verify both snapshot chart titles once queries resolve
    expect(await screen.findByRole('heading', { name: 'Curriculum Practice Labs Mix' })).toBeDefined();
    expect(await screen.findByRole('heading', { name: 'Subscriptions by Plan Tier' })).toBeDefined();

    // Verify content mix items
    expect((await screen.findAllByText('SQL Query & Schema Practice')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Playwright & Automation Testing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Quiz & Conceptual Thinking').length).toBeGreaterThanOrEqual(1);

    // Verify plan items exist across dashboard and chart
    expect(screen.getAllByText('Free Learner Tier').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pro Developer Plan').length).toBeGreaterThanOrEqual(1);

    // Verify progressbars exist for both charts
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(5); // 3 for content mix, 2 for plans
  });

  it('allows switching to table view on the curriculum chart', async () => {
    renderDashboard();

    const tableButtons = await screen.findAllByRole('button', { name: /table view/i });
    expect(tableButtons.length).toBe(2);

    // Click table view on first chart
    fireEvent.click(tableButtons[0]);

    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Category').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Share')).toBeDefined();
  });
});
