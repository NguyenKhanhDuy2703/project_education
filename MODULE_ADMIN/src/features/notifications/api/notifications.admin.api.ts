import { apiClient } from '@/services/api.client';
import type {
  NotificationsResponse,
  UnreadCountResponse,
  NotificationRecord,
  AnnouncementRecord,
  SendAnnouncementDto,
  AnnouncementAudience,
} from '../types/notifications.types';

function normalizeAnnouncement(raw: any): AnnouncementRecord {
  if (!raw) return raw;
  const targetAudience = (raw.targetAudience ?? raw.audience ?? 'ALL') as AnnouncementAudience;
  const processed = raw.processedRecipients ?? raw.sentRecipients ?? 0;
  const total = raw.totalRecipients ?? 0;
  const failed = raw.failedRecipients ?? 0;

  return {
    ...raw,
    audience: targetAudience,
    targetAudience,
    totalRecipients: total,
    processedRecipients: processed,
    sentRecipients: processed,
    failedRecipients: failed,
  };
}

export const notificationsAdminApi = {
  getMyNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<NotificationsResponse> => {
    const res = await apiClient.get('/notifications', { params });
    return res.data?.data ?? res.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data?.data ?? res.data;
  },

  markAsRead: async (id: string): Promise<NotificationRecord> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data?.data ?? res.data;
  },

  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data?.data ?? res.data;
  },

  createAnnouncement: async (dto: SendAnnouncementDto): Promise<AnnouncementRecord> => {
    const payload = {
      ...dto,
      targetAudience: dto.targetAudience ?? dto.audience ?? 'ALL',
      audience: dto.audience ?? dto.targetAudience ?? 'ALL',
    };
    const res = await apiClient.post('/admin/announcements', payload);
    const raw = res.data?.data ?? res.data;
    return normalizeAnnouncement(raw);
  },

  getAnnouncements: async (): Promise<AnnouncementRecord[]> => {
    const res = await apiClient.get('/admin/announcements');
    const rawList = res.data?.data ?? res.data ?? [];
    return Array.isArray(rawList) ? rawList.map(normalizeAnnouncement) : [];
  },
};
