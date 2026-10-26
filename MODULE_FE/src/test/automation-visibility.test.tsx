import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/stores/slices/auth.slice';
import { SeriesHubPage } from '@/pages/lab/SeriesHubPage';
import { SeriesDetailPage } from '@/pages/lab/SeriesDetailPage';
import { LabWorkspacePage } from '@/pages/lab/LabWorkspacePage';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: any) => <textarea data-testid="monaco-mock" value={value} readOnly />,
}));

vi.mock('@/features/lab/hooks/useLabWorker', () => ({
  useLabWorker: () => ({
    status: 'idle',
    result: null,
    run: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/auth/api/auth.api', () => ({
  authApi: {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('@/features/lab/api/series.api', () => ({
  seriesApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
    save: vi.fn(),
    unsave: vi.fn(),
  },
}));

vi.mock('@/features/lab/api/lab.api', () => ({
  labApi: {
    getById: vi.fn(),
    getBySlug: vi.fn(),
    getSubmissions: vi.fn().mockResolvedValue([]),
    submit: vi.fn(),
  },
}));

function createTestStore(role: string = 'user') {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'test-user',
          name: 'Test Learner',
          email: 'test@studyit.dev',
          role: role as any,
          emailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'test-token',
        refreshToken: null,
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, { role = 'user', initialRoute = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  const store = createTestStore(role);

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

const MOCK_SERIES = [
  {
    id: 'series-sql',
    title: 'PostgreSQL Business Labs',
    slug: 'postgresql-business-scenarios',
    category: 'database',
    level: 'intermediate',
    status: 'published',
    labs: [
      { id: 'lab-sql-1', title: 'Cohort Retention', slug: 'cohort-retention', sandboxType: 'sql_worker' },
    ],
  },
  {
    id: 'series-quiz',
    title: 'Testing Theory Quiz',
    slug: 'testing-theory-scenario-quiz',
    category: 'testing',
    level: 'beginner',
    status: 'published',
    labs: [
      { id: 'lab-quiz-1', title: 'Equivalence Partitioning', slug: 'eq-partitioning', sandboxType: 'quizlet' },
    ],
  },
  {
    id: 'series-auto',
    title: 'Playwright Automation Labs',
    slug: 'playwright-low-code-automation',
    category: 'automation',
    level: 'intermediate',
    status: 'published',
    labs: [
      { id: 'lab-auto-1', title: 'Login Flow', slug: 'playwright-v3-login', sandboxType: 'automation_v3' },
    ],
  },
];

describe('Frontend Automation Visibility and Notice Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides automation series and automation format filters from learners on SeriesHubPage', async () => {
    vi.mocked(seriesApi.getAll).mockResolvedValueOnce(MOCK_SERIES as any);

    renderWithProviders(<SeriesHubPage />, { role: 'user', initialRoute: '/series' });

    // Learner should see SQL and Quiz series
    expect(await screen.findByText('PostgreSQL Business Labs')).toBeDefined();
    expect(screen.getByText('Testing Theory Quiz')).toBeDefined();

    // Learner should NOT see Playwright Automation Labs
    expect(screen.queryByText('Playwright Automation Labs')).toBeNull();

    // Check format pills: js_worker and hybrid should not be rendered
    expect(screen.queryByText('JS Code Lab')).toBeNull();
    expect(screen.queryByText('Hybrid')).toBeNull();
  });

  it('displays "Topic Temporarily Unavailable" when learner accesses an automation series URL directly', async () => {
    vi.mocked(seriesApi.getBySlug).mockRejectedValueOnce(new Error('Topic temporarily unavailable'));

    renderWithProviders(
      <Routes>
        <Route path="/series/:slug" element={<SeriesDetailPage />} />
      </Routes>,
      { role: 'user', initialRoute: '/series/playwright-low-code-automation' }
    );

    expect(await screen.findByText('Topic Temporarily Unavailable')).toBeDefined();
    expect(screen.getByText(/Automation testing series are temporarily unavailable in this release/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Browse Active Catalog/i })).toBeDefined();
  });

  it('displays "Lab Challenge Temporarily Unavailable" when learner navigates directly to an automation lab', async () => {
    vi.mocked(labApi.getBySlug).mockRejectedValueOnce(new Error('Practice lab temporarily unavailable'));
    vi.mocked(labApi.getById).mockRejectedValueOnce(new Error('Practice lab temporarily unavailable'));

    renderWithProviders(
      <Routes>
        <Route path="/labs/:labId" element={<LabWorkspacePage />} />
      </Routes>,
      { role: 'user', initialRoute: '/labs/playwright-v3-login' }
    );

    expect(await screen.findByText('Lab Challenge Temporarily Unavailable')).toBeDefined();
    expect(screen.getByText(/Automation testing challenges are temporarily unavailable in this release/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Browse Active Catalog/i })).toBeDefined();
  });

  it('allows admin role to view Playwright Automation Labs in catalog', async () => {
    vi.mocked(seriesApi.getAll).mockResolvedValueOnce(MOCK_SERIES as any);

    renderWithProviders(<SeriesHubPage />, { role: 'admin', initialRoute: '/series' });

    expect(await screen.findByText('Playwright Automation Labs')).toBeDefined();
    expect(screen.getByText('PostgreSQL Business Labs')).toBeDefined();
    expect(screen.getByText('Testing Theory Quiz')).toBeDefined();
  });
});
