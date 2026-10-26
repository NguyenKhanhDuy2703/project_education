import { apiClient } from '@/services/api.client';
import type {
  NotificationsResponse,
  UnreadCountResponse,
  NotificationRecord,
} from '../types/notifications.types';

export const notificationsApi = {
  getMyNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<NotificationsResponse> => {
    const res = await apiClient.get('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationRecord> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },
};
