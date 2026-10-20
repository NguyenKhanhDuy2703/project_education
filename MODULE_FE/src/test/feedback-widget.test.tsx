import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/stores/slices/auth.slice';
import { I18nProvider } from '@/features/preferences/i18n';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { feedbackApi } from '@/features/feedback/api/feedback.api';

vi.mock('@/features/feedback/api/feedback.api', () => ({
  feedbackApi: {
    create: vi.fn(),
  },
}));

function renderWidget(initialAuthState?: any) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: initialAuthState?.user || null,
        accessToken: initialAuthState?.accessToken || null,
        refreshToken: initialAuthState?.refreshToken || null,
        isAuthenticated: !!initialAuthState?.isAuthenticated,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/labs/test-lab-1?mode=preview']}>
        <I18nProvider>
          <FeedbackWidget />
        </I18nProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('FeedbackWidget Localization and Diagnostic Integrity (Task 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders trigger button with accessible label and opens feedback dialog', () => {
    renderWidget();
    const triggerBtn = screen.getByRole('button', { name: /give feedback/i });
    expect(triggerBtn).toBeDefined();

    fireEvent.click(triggerBtn);

    expect(screen.getByRole('heading', { name: 'Send Us Feedback' })).toBeDefined();
    expect(screen.getByText('Report an Issue')).toBeDefined();
    expect(screen.getByText('Feature Suggestion')).toBeDefined();
    expect(screen.getByText('Lab Content Feedback')).toBeDefined();
    expect(screen.getByText('General Feedback')).toBeDefined();
  });

  it('validates minimum message length before submission', async () => {
    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /give feedback/i }));

    const textarea = screen.getByPlaceholderText(/tell us what you liked/i);
    fireEvent.change(textarea, { target: { value: 'abc' } });

    const submitBtn = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please enter at least 5 characters for your feedback.')).toBeDefined();
    expect(feedbackApi.create).not.toHaveBeenCalled();
  });

  it('selects related area, applies suggestion, and embeds machine-readable area tag', async () => {
    vi.mocked(feedbackApi.create).mockResolvedValueOnce({
      id: 'fb-123',
      category: 'bug',
      message: '[Area: series_catalog] Cannot load lab list in series',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /give feedback/i }));

    // Click on 'Series & Roadmaps' feature chip
    const seriesChip = screen.getByRole('button', { name: 'Series & Roadmaps' });
    fireEvent.click(seriesChip);

    // Contextual suggestion appears
    const suggestionBtn = await screen.findByRole('button', { name: '+ Cannot load lab list in series' });
    expect(suggestionBtn).toBeDefined();

    fireEvent.click(suggestionBtn);

    const textarea = screen.getByPlaceholderText(/tell us what you liked/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Cannot load lab list in series');

    // Fill guest email
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'learner@example.com' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(feedbackApi.create).toHaveBeenCalledWith({
        category: 'bug',
        message: '[Area: series_catalog] Cannot load lab list in series',
        email: 'learner@example.com',
        pageUrl: '/labs/test-lab-1?mode=preview',
      });
    });

    // Verification of success screen
    expect(await screen.findByText('Thank you for your feedback!')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Send another response' })).toBeDefined();
  });

  it('enforces English labels and suggestions even if legacy locale was in localStorage', () => {
    localStorage.setItem('study_locale', 'vi');

    renderWidget();
    const triggerBtn = screen.getByRole('button', { name: /give feedback/i });
    expect(triggerBtn).toBeDefined();

    fireEvent.click(triggerBtn);

    expect(screen.getByRole('heading', { name: 'Send Us Feedback' })).toBeDefined();
    expect(screen.getByText('Report an Issue')).toBeDefined();
    expect(screen.getByText('Feature Suggestion')).toBeDefined();
    expect(screen.getByText('Lab Content Feedback')).toBeDefined();
    expect(screen.getByText('General Feedback')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Series & Roadmaps' })).toBeDefined();
  });

  it('displays server error notification and preserves user message on failure for retry', async () => {
    vi.mocked(feedbackApi.create).mockRejectedValueOnce({
      response: { data: { message: 'Database unreachable. Please try again later.' } },
    });

    renderWidget();
    fireEvent.click(screen.getByRole('button', { name: /give feedback/i }));

    const textarea = screen.getByPlaceholderText(/tell us what you liked/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Something is broken on this page' } });

    const submitBtn = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitBtn);

    // Error message should appear in an alert container
    expect(await screen.findByText('Database unreachable. Please try again later.')).toBeDefined();

    // Message must be preserved in textarea for user retry
    expect(textarea.value).toBe('Something is broken on this page');

    // Submit button should be enabled again for retry
    expect(submitBtn).toBeDefined();
    expect(submitBtn.getAttribute('disabled')).toBeNull();
  });
});
