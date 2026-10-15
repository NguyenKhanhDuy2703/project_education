import { apiClient } from '@/services/api.client';

export interface ApplyContributorPayload {
  bio: string;
  portfolioUrl?: string;
  sampleTopic: string;
}

export interface ReviewContributorPayload {
  action: 'APPROVE' | 'REJECT';
  adminNote?: string;
}

export interface ContributorApplicationItem {
  id: string;
  userId: string;
  bio: string;
  portfolioUrl?: string | null;
  sampleTopic: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  adminNote?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string;
    avatarUrl?: string | null;
    role: string;
    isContributor: boolean;
  };
  reviewedBy?: {
    id: string;
    name: string;
  };
}

export const contributorApplicationApi = {
  apply: async (data: ApplyContributorPayload) => {
    const res = await apiClient.post<ContributorApplicationItem>('/contributor/apply', data);
    return res.data;
  },

  getMyApplication: async () => {
    const res = await apiClient.get<{ application: ContributorApplicationItem | null }>('/contributor/my-application');
    return res.data;
  },

  getAdminApplications: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{
      items: ContributorApplicationItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/admin/contributor-applications', { params });
    return res.data;
  },

  reviewApplication: async (id: string, payload: ReviewContributorPayload) => {
    const res = await apiClient.post<ContributorApplicationItem>(`/admin/contributor-applications/${id}/review`, payload);
    return res.data;
  },
};
