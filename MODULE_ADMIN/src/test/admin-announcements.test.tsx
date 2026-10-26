import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '@/stores/slices/auth.slice';
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage';
import { AdminNotificationDropdown } from '@/features/notifications/components/AdminNotificationDropdown';
import { notificationsAdminApi } from '@/features/notifications/api/notifications.admin.api';

vi.mock('@/features/notifications/api/notifications.admin.api', () => ({
  notificationsAdminApi: {
    getAnnouncements: vi.fn(),
    createAnnouncement: vi.fn(),
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

function createStore(user: any = { id: 'admin-1', name: 'Admin', role: 'admin' }) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user,
        accessToken: 'fake-admin-token',
        refreshToken: null,
        isAuthenticated: true,
      },
    },
  });
}

function renderWithClient(ui: React.ReactElement, store = createStore()) {
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

describe('Admin Announcements & Inbox Suite (Subtask 6.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders past announcements with batch progress and status badge', async () => {
    vi.mocked(notificationsAdminApi.getAnnouncements).mockResolvedValue([
      {
        id: 'ann-1',
        title: 'Bảo trì hệ thống định kỳ',
        body: 'Hệ thống sẽ bảo trì vào 0h đêm nay.',
        audience: 'ALL',
        actionPath: '/status',
        status: 'COMPLETED',
        totalRecipients: 100,
        sentRecipients: 100,
        failedRecipients: 0,
        createdById: 'admin-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    renderWithClient(<AdminAnnouncementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Bảo trì hệ thống định kỳ')).toBeDefined();
      expect(screen.getByText('Hoàn tất')).toBeDefined();
      expect(screen.getByText('100%')).toBeDefined();
    });
  });

  it('opens confirmation modal and dispatches announcement creation', async () => {
    vi.mocked(notificationsAdminApi.getAnnouncements).mockResolvedValue([]);
    vi.mocked(notificationsAdminApi.createAnnouncement).mockResolvedValue({} as any);

    renderWithClient(<AdminAnnouncementsPage />);

    // Fill form
    const titleInput = screen.getByPlaceholderText(/Ví dụ: Cập nhật lộ trình/i);
    const bodyInput = screen.getByPlaceholderText(/Nhập nội dung thông báo/i);
    fireEvent.change(titleInput, { target: { value: 'Ra mắt tính năng mới' } });
    fireEvent.change(bodyInput, { target: { value: 'Trải nghiệm giao diện mới ngay hôm nay.' } });

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Xem lại & Gửi thông báo/i });
    fireEvent.click(submitBtn);

    // Confirm dialog opens
    await waitFor(() => {
      expect(screen.getByText('Xác nhận phát thông báo hàng loạt')).toBeDefined();
    });

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận gửi thông báo/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(notificationsAdminApi.createAnnouncement).toHaveBeenCalledWith({
        title: 'Ra mắt tính năng mới',
        body: 'Trải nghiệm giao diện mới ngay hôm nay.',
        audience: 'ALL',
        actionPath: undefined,
      });
    });
  });

  it('renders unread badge count in AdminNotificationDropdown', async () => {
    vi.mocked(notificationsAdminApi.getUnreadCount).mockResolvedValue({ count: 7 });

    renderWithClient(<AdminNotificationDropdown />);

    await waitFor(() => {
      const badge = screen.getByTestId('admin-unread-badge-count');
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe('7');
    });
  });

  it('handles zero recipients without NaN%', async () => {
    vi.mocked(notificationsAdminApi.getAnnouncements).mockResolvedValue([
      {
        id: 'ann-zero',
        title: 'Thông báo mới tạo chưa có recipients',
        body: 'Nội dung',
        audience: 'ALL',
        actionPath: null,
        status: 'PENDING',
        totalRecipients: 0,
        processedRecipients: 0,
        sentRecipients: 0,
        failedRecipients: 0,
        createdById: 'admin-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    renderWithClient(<AdminAnnouncementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Thông báo mới tạo chưa có recipients')).toBeDefined();
      expect(screen.getByText('0%')).toBeDefined();
      expect(screen.queryByText(/NaN/)).toBeNull();
    });
  });
});
