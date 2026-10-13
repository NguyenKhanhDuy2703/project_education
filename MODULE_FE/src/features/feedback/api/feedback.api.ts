import { apiClient } from '@/services/api.client';

export type FeedbackCategory = 'bug' | 'feature_request' | 'content_lab' | 'other';

export interface CreateFeedbackPayload {
  category: FeedbackCategory;
  message: string;
  email?: string;
  pageUrl?: string;
}

export interface FeedbackRecord {
  id: string;
  userId?: string | null;
  email?: string | null;
  category: FeedbackCategory;
  message: string;
  pageUrl?: string | null;
  status: string;
  createdAt: string;
}

export const feedbackApi = {
  create: async (payload: CreateFeedbackPayload): Promise<FeedbackRecord> => {
    const res = await apiClient.post<FeedbackRecord>('/feedback', payload);
    return res.data;
  },
};
