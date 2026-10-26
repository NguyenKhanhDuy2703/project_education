import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '@/stores/slices/auth.slice';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';
import { UserNotificationsView } from '@/pages/dashboard/views/UserNotificationsView';
import { notificationsApi } from '@/features/notifications/api/notificationsApi';

function createMockStore(user: any = { id: 'u1', name: 'Alice', email: 'alice@example.com' }) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user,
        accessToken: 'fake-token',
        refreshToken: null,
        isAuthenticated: Boolean(user),
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, store = createMockStore()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('NotificationDropdown & UserNotificationsView Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders unread badge count when user has unread notifications', async () => {
    vi.spyOn(notificationsApi, 'getUnreadCount').mockResolvedValue({ count: 5 });
    vi.spyOn(notificationsApi, 'getMyNotifications').mockResolvedValue({
      items: [
        {
          id: 'n-1',
          userId: 'u1',
          type: 'BILLING',
          title: 'Yêu cầu nâng cấp Pro đã được phê duyệt',
          body: 'Gói Pro của bạn đã kích hoạt.',
          actionPath: '/user/dashboard/membership',
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
      totalUnread: 5,
    });

    renderWithProviders(<NotificationDropdown />);

    await waitFor(() => {
      const badge = screen.getByTestId('unread-badge-count');
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe('5');
    });
  });

  it('renders empty state when there are no unread notifications', async () => {
    vi.spyOn(notificationsApi, 'getUnreadCount').mockResolvedValue({ count: 0 });

    renderWithProviders(<NotificationDropdown />);

    await waitFor(() => {
      expect(screen.queryByTestId('unread-badge-count')).toBeNull();
    });
  });

  it('renders UserNotificationsView with items, unread badges and action button', async () => {
    vi.spyOn(notificationsApi, 'getMyNotifications').mockResolvedValue({
      items: [
        {
          id: 'n-1',
          userId: 'u1',
          type: 'BILLING',
          title: 'Nâng cấp Pro thành công',
          body: 'Gói Pro của bạn có hạn đến 26/11/2026.',
          actionPath: '/user/dashboard/membership',
          readAt: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'n-2',
          userId: 'u1',
          type: 'SYSTEM',
          title: 'Chào mừng bạn đến với hệ thống',
          body: 'Bắt đầu giải bài lab đầu tiên ngay!',
          actionPath: '/series',
          readAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      nextCursor: null,
      totalUnread: 1,
    });

    const markReadSpy = vi.spyOn(notificationsApi, 'markAsRead').mockResolvedValue({
      id: 'n-1',
      userId: 'u1',
      type: 'BILLING',
      title: 'Nâng cấp Pro thành công',
      body: 'Gói Pro của bạn có hạn đến 26/11/2026.',
      actionPath: '/user/dashboard/membership',
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(<UserNotificationsView />);

    await waitFor(() => {
      expect(screen.getByText('Hộp thư thông báo')).toBeDefined();
      expect(screen.getByText('Nâng cấp Pro thành công')).toBeDefined();
      expect(screen.getByText('Chào mừng bạn đến với hệ thống')).toBeDefined();
    });

    const markBtn = screen.getByRole('button', { name: /^Đánh dấu đã đọc$/i });
    fireEvent.click(markBtn);
    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith('n-1');
    });
  });
});
