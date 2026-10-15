import { apiClient } from '@/services/api.client';

export type FeedbackCategory = 'bug' | 'feature_request' | 'content_lab' | 'other';

export interface AdminFeedbackItem {
  id: string;
  userId: string | null;
  email: string | null;
  category: FeedbackCategory;
  message: string;
  pageUrl: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
}

export const feedbackAdminApi = {
  getAll: async (): Promise<AdminFeedbackItem[]> => {
    const res = await apiClient.get<any>('/feedback/admin');
    return res.data?.data || res.data || [];
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/feedback/admin/${id}`);
  },
};
