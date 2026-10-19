import { apiClient } from '@/services/api.client';
import type { ContentLifecycleStatus } from '@/types/lab.types';

export interface ReviewQueueItem {
  id: string;
  title: string;
  type: 'series' | 'lab';
  status: ContentLifecycleStatus;
  authorId?: string;
  authorName?: string;
  author?: { id: string; name?: string; email?: string; role?: string };
  version?: string;
  category?: string;
  slug?: string;
  parentTitle?: string | null;
  description?: string;
  instructions?: string;
  initialSnippet?: string;
  testScript?: string;
  solution?: string;
  reviewFeedback?: string;
  submittedAt?: string;
  sandboxType?: string;
  config?: any;
  envelope?: any;
  sqlSchema?: string;
  sampleData?: any[];
  expectedQueryResult?: any[];
  quizQuestions?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewQueueResponse {
  counts: Record<string, number>;
  total: number;
  items: ReviewQueueItem[];
}

export interface ReviewQueueFilter {
  status?: ContentLifecycleStatus;
  type?: 'all' | 'series' | 'lab';
  search?: string;
}

export const adminReviewApi = {
  getQueue: async (filter?: ReviewQueueFilter): Promise<ReviewQueueResponse> => {
    const res = await apiClient.get<any>('/admin/review/queue', { params: filter });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) {
      return { counts: {}, total: payload.length, items: payload };
    }
    return {
      counts: payload?.counts || {},
      total: payload?.total || (payload?.items?.length ?? 0),
      items: payload?.items || [],
    };
  },

  approve: async (type: 'series' | 'lab', id: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/approve`);
    return res.data?.data || res.data;
  },

  requestChanges: async (type: 'series' | 'lab', id: string, feedback: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/request-changes`, { feedback });
    return res.data?.data || res.data;
  },

  reject: async (type: 'series' | 'lab', id: string, feedback?: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/reject`, { feedback });
    return res.data?.data || res.data;
  },

  publish: async (type: 'series' | 'lab', id: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/publish`);
    return res.data?.data || res.data;
  },

  unpublish: async (type: 'series' | 'lab', id: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/unpublish`);
    return res.data?.data || res.data;
  },

  archive: async (type: 'series' | 'lab', id: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/archive`);
    return res.data?.data || res.data;
  },

  transferOwnership: async (type: 'series' | 'lab', id: string, targetUserId: string): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/review/${type}/${id}/transfer-ownership`, { targetUserId });
    return res.data?.data || res.data;
  },
};
