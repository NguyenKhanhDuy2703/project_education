import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminReviewQueue } from '@/pages/admin/_components/AdminReviewQueue';
import { adminReviewApi, type ReviewQueueItem } from '@/features/admin/api/review.admin.api';
import { usersAdminApi } from '@/features/admin/api/users.admin.api';
import { labApi } from '@/features/lab/api/lab.api';

// Mock dependencies
vi.mock('@/features/admin/api/review.admin.api', () => ({
  adminReviewApi: {
    getQueue: vi.fn(),
    approve: vi.fn(),
    requestChanges: vi.fn(),
    reject: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    archive: vi.fn(),
    transferAuthor: vi.fn(),
  },
}));

vi.mock('@/features/admin/api/users.admin.api', () => ({
  usersAdminApi: {
    getUsers: vi.fn(),
  },
}));

vi.mock('@/features/lab/api/lab.api', () => ({
  labApi: {
    getById: vi.fn(),
  },
}));

describe('AdminReviewQueue Component Suite', () => {
  let queryClient: QueryClient;

  const mockItems: ReviewQueueItem[] = [
    {
      id: 'lab-cloze-1',
      title: 'Smart Cloze V2 Automation Lab',
      slug: 'smart-cloze-v2-lab',
      type: 'lab',
      status: 'submitted',
      authorName: 'Senior QA Architect',
      authorId: 'user-qa-1',
      parentTitle: 'Playwright Automation',
      sandboxType: 'js_worker',
      instructions: '# Instructions for Smart Cloze\nFill in the missing assertion methods.',
      initialSnippet: '// Starter automation test\nconst x = {{blank:1}};',
      solution: '// Solution code\nconst x = 42;',
      testScript: 'expect(x).toBe(42);',
      envelope: {
        config: {
          version: '2.0',
          title: 'Smart Cloze Exercise',
          framework: 'playwright',
          interactionMode: 'smart_cloze',
          blanks: [
            {
              id: 'b1',
              kind: 'choice',
              label: 'Assertion Method',
              options: [{ value: 'toBeVisible', label: 'toBeVisible' }],
            },
            {
              id: 'b2',
              kind: 'text',
              label: 'Action Method',
              options: [{ value: 'click', label: 'click' }],
            },
          ],
        },
      },
      createdAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 'lab-quiz-1',
      title: 'Database Architecture Quizlet',
      slug: 'db-arch-quizlet',
      type: 'lab',
      status: 'submitted',
      authorName: 'DBA Lead',
      authorId: 'user-dba-1',
      parentTitle: 'SQL Fundamentals',
      sandboxType: 'quizlet',
      instructions: '# Database Architecture Concepts\nAnswer all conceptual questions.',
      quizQuestions: [
        {
          id: 'q1',
          question: 'What is the primary characteristic of a B-Tree index?',
          options: [
            'Balanced tree with logarithmic lookup time',
            'Unordered key-value store with O(N) scan',
          ],
          correctIndex: 0,
          explanation: 'B-Trees keep keys sorted to allow logarithmic search, sequential access, and range queries.',
        },
      ],
      createdAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 'lab-sql-1',
      title: 'Advanced Window Functions SQL Lab',
      slug: 'adv-window-sql-lab',
      type: 'lab',
      status: 'approved',
      authorName: 'Data Engineer',
      authorId: 'user-de-1',
      parentTitle: 'Advanced SQL Masterclass',
      sandboxType: 'sql_worker',
      instructions: '# Window Functions Practice\nCompute running aggregates using OVER().',
      initialSnippet: 'SELECT emp_id, department, salary FROM employees;',
      solution: 'SELECT emp_id, department, salary, AVG(salary) OVER(PARTITION BY department) FROM employees;',
      sqlSchema: 'CREATE TABLE employees (emp_id INT, department TEXT, salary INT);',
      sampleData: [{ emp_id: 1, department: 'Engineering', salary: 95000 }],
      expectedQueryResult: [
        { emp_id: 1, department: 'Engineering', salary: 95000, avg: 100000 },
      ],
      createdAt: '2026-10-18T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(adminReviewApi.getQueue).mockResolvedValue({
      items: mockItems,
      total: 3,
      counts: {
        submitted: 2,
        approved: 1,
        published: 0,
        changes_requested: 0,
        archived: 0,
        all: 3,
      },
    });

    vi.mocked(usersAdminApi.getUsers).mockResolvedValue({
      items: [
        { id: 'user-qa-1', name: 'Senior QA Architect', email: 'qa@test.com' },
        { id: 'user-admin-1', name: 'Admin Root', email: 'admin@test.com' },
      ],
      total: 2,
      page: 1,
      limit: 100,
      totalPages: 1,
    } as any);

    vi.mocked(labApi.getById).mockResolvedValue(mockItems[0] as any);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AdminReviewQueue />
      </QueryClientProvider>
    );

  it('renders review queue header and queue tabs with count badges', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Review Queue')).toBeTruthy();
    });

    expect(screen.getByText(/Pending Review/i)).toBeTruthy();
    expect(screen.getByText(/Approved/i)).toBeTruthy();
    expect(screen.getByText(/Published/i)).toBeTruthy();
  });

  it('filters items correctly when searching by text query', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Smart Cloze V2 Automation Lab')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/Filter by title/i);
    fireEvent.change(searchInput, { target: { value: 'Database Architecture' } });

    expect(screen.getByText('Database Architecture Quizlet')).toBeTruthy();
    expect(screen.queryByText('Smart Cloze V2 Automation Lab')).toBeNull();
  });

  it('displays approved items when switching to Approved tab', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Smart Cloze V2 Automation Lab')).toBeTruthy();
    });

    const approvedTab = screen.getByRole('tab', { name: /Approved/i });
    fireEvent.pointerDown(approvedTab, { button: 0, ctrlKey: false });
    fireEvent.keyDown(approvedTab, { key: 'Enter' });
    fireEvent.click(approvedTab);

    await waitFor(() => {
      expect(screen.getByText('Advanced Window Functions SQL Lab')).toBeTruthy();
      expect(screen.queryByText('Smart Cloze V2 Automation Lab')).toBeNull();
    });
  });

  it('inspects V2 Smart Cloze envelope in Technical Specs mode', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Smart Cloze V2 Automation Lab')).toBeTruthy();
    });

    // Find and click the Review & Inspect button
    const reviewButtons = screen.getAllByRole('button', { name: /Review & Inspect/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Smart Cloze V2 Envelope')).toBeTruthy();
    });

    expect(screen.getByText(/2 Blank Decisions/i)).toBeTruthy();
    expect(screen.getByText(/playwright Framework/i)).toBeTruthy();
    expect(screen.getByText('Defined Blanks & Options:')).toBeTruthy();
  });

  it('inspects Quizlet questions with answer badges and explanations in modal', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Database Architecture Quizlet')).toBeTruthy();
    });

    // Click Review on the second item
    const reviewButtons = screen.getAllByRole('button', { name: /Review & Inspect/i });
    fireEvent.click(reviewButtons[1]);

    await waitFor(() => {
      expect(screen.getByText(/What is the primary characteristic of a B-Tree index\?/i)).toBeTruthy();
    });

    expect(screen.getByText(/Balanced tree with logarithmic lookup time/i)).toBeTruthy();
    expect(screen.getByText(/Explanation: B-Trees keep keys sorted/i)).toBeTruthy();
  });

  it('inspects SQL sandbox schema, sample data, and expected query results', async () => {
    renderComponent();

    const approvedTab = screen.getByRole('tab', { name: /Approved/i });
    fireEvent.pointerDown(approvedTab, { button: 0, ctrlKey: false });
    fireEvent.keyDown(approvedTab, { key: 'Enter' });
    fireEvent.click(approvedTab);

    await waitFor(() => {
      expect(screen.getByText('Advanced Window Functions SQL Lab')).toBeTruthy();
    });

    const reviewButton = screen.getByRole('button', { name: /Review & Inspect/i });
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/CREATE TABLE employees/i)).toBeTruthy();
    });

    expect(screen.getByText(/Sample Mock Data/i)).toBeTruthy();
    expect(screen.getByText(/Expected Query Result/i)).toBeTruthy();
  });

  it('switches between Technical Specifications and Student Simulation modes', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Smart Cloze V2 Automation Lab')).toBeTruthy();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /Review & Inspect/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Student Simulation/i })).toBeTruthy();
    });

    // Switch to Student Simulation mode
    const studentSimBtn = screen.getByRole('button', { name: /Student Simulation/i });
    fireEvent.click(studentSimBtn);

    await waitFor(() => {
      expect(screen.getByText(/Student View Simulation:/i)).toBeTruthy();
      expect(screen.getByText(/Smart Cloaked Code Exercise Preview/i)).toBeTruthy();
    });
  });

  it('approves content successfully when clicking Approve button', async () => {
    vi.mocked(adminReviewApi.approve).mockResolvedValue({ success: true } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Smart Cloze V2 Automation Lab')).toBeTruthy();
    });

    const reviewButtons = screen.getAllByRole('button', { name: /Review & Inspect/i });
    fireEvent.click(reviewButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Approve$/i })).toBeTruthy();
    });

    const approveButton = screen.getByRole('button', { name: /^Approve$/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(adminReviewApi.approve).toHaveBeenCalledWith('lab', 'lab-cloze-1');
    });
  });
});
