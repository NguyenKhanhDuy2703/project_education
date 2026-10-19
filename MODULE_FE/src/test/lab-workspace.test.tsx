import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/stores/slices/auth.slice';
import { LabWorkspacePage } from '@/pages/lab/LabWorkspacePage';
import { labApi } from '@/features/lab/api/lab.api';
import { seriesApi } from '@/features/lab/api/series.api';

// Mock Monaco Editor to avoid web-worker dependencies in jsdom/happy-dom
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-mock"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

const mockReset = vi.fn();
const mockRun = vi.fn();

// Mock useLabWorker with stable references
vi.mock('@/features/lab/hooks/useLabWorker', () => ({
  useLabWorker: () => ({
    status: 'idle',
    result: null,
    run: mockRun,
    reset: mockReset,
  }),
}));

vi.mock('@/features/lab/api/lab.api', () => ({
  labApi: {
    getById: vi.fn(),
    getBySlug: vi.fn(),
    getSubmissions: vi.fn(),
    submit: vi.fn(),
  },
}));

vi.mock('@/features/lab/api/series.api', () => ({
  seriesApi: {
    getBySlug: vi.fn(),
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
          name: 'Test Student',
          email: 'test@example.com',
          role: role as any,
          phone: '0123456789',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'fake-token',
        refreshToken: null,
        isAuthenticated: true,
      },
    },
  });
}

function renderWorkspace(labId: string = 'test-lab', role: string = 'user') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const store = createTestStore(role);

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/labs/${labId}`]}>
          <Routes>
            <Route path="/labs/:labId" element={<LabWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('LabWorkspacePage Characterization Suite (Subtask 3.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (labApi.getSubmissions as any).mockResolvedValue([]);
    (seriesApi.getBySlug as any).mockResolvedValue({
      id: 'series-1',
      title: 'Testing Series',
      slug: 'testing-series',
      labs: [],
    });
  });

  it('renders loading skeleton while query is in-flight', () => {
    let resolver: any;
    (labApi.getById as any).mockReturnValue(new Promise((res) => { resolver = res; }));

    const { container } = renderWorkspace('loading-lab');
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    resolver?.({ id: 'loading-lab' });
  });

  it('renders error state when lab is not found', async () => {
    (labApi.getById as any).mockRejectedValue(new Error('Lab not found'));

    renderWorkspace('not-found-lab');

    const errorHeading = await screen.findByText(/Unable to load this lab challenge/i);
    expect(errorHeading).toBeDefined();
  });

  it('renders lab workspace with description tabs for JS/automation lab', async () => {
    (labApi.getById as any).mockResolvedValue({
      id: 'test-lab',
      slug: 'test-lab',
      seriesId: 'series-1',
      title: 'Unit Test Basics',
      sandboxType: 'js_worker',
      objective: 'Learn unit test basics',
      instructions: '# Unit Test Basics\nWrite an assertion.',
      initialSnippet: 'const x = 1;',
      testScript: 'assert(x === 1);',
      isProOnly: false,
    });

    renderWorkspace('test-lab');

    expect(await screen.findByRole('tab', { name: /Instructions/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Solution/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Submissions/i })).toBeDefined();
    expect(screen.getAllByText(/Unit Test Basics/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders locked solution state for non-PRO students', async () => {
    (labApi.getById as any).mockResolvedValue({
      id: 'test-lab',
      slug: 'test-lab',
      title: 'Advanced Sorting',
      sandboxType: 'js_worker',
      instructions: '# Advanced Sorting',
      initialSnippet: '// starter code',
      isProOnly: true,
      solution: null,
    });

    renderWorkspace('test-lab', 'user');

    expect(await screen.findByText(/Advanced Sorting/i)).toBeDefined();
    expect(screen.getByText(/Exclusive PRO Lab Workspace/i)).toBeDefined();
  });
});
