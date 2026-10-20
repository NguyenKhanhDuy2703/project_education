import { apiClient } from '@/services/api.client';
import type {
  LabDetail,
  SubmitLabPayload,
  SubmitLabResult,
  LabSubmissionRecord,
  UserLabSubmissionItem,
  DashboardStats,
  CreateLabInput,
} from '@/types/lab.types';

export const labApi = {
  /** Fetch lab detail by slug (Public / Student view) */
  getBySlug: async (slug: string): Promise<LabDetail> => {
    const res = await apiClient.get<any>(`/labs/${slug}`);
    return res.data?.data ?? res.data;
  },

  /** Protected — requires auth + RBAC guard on backend */
  getById: async (labId: string): Promise<LabDetail> => {
    const res = await apiClient.get<any>(`/labs/${labId}`);
    return res.data?.data ?? res.data;
  },

  /** Contributor: Get labs authored by current user */
  getMyLabs: async (): Promise<LabDetail[]> => {
    const res = await apiClient.get<any>('/labs/contributor/my-labs');
    return res.data?.data ?? res.data ?? [];
  },

  /** Contributor: Submit lab for admin review */
  submitForReview: async (id: string): Promise<any> => {
    const res = await apiClient.post<any>(`/labs/${id}/submit-for-review`);
    return res.data?.data ?? res.data;
  },

  /** Admin / Contributor: Create new practice lab */
  create: async (data: CreateLabInput): Promise<LabDetail> => {
    const res = await apiClient.post<any>('/labs', data);
    return res.data?.data ?? res.data;
  },

  /** Admin / Contributor: Update practice lab */
  update: async (id: string, data: Partial<CreateLabInput>): Promise<LabDetail> => {
    const res = await apiClient.put<any>(`/labs/${id}`, data);
    return res.data?.data ?? res.data;
  },

  /** Admin / Contributor: Delete practice lab */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/labs/${id}`);
  },

  /** Submit an attempt and return the backend's authoritative result. */
  submit: async (labId: string, payload: SubmitLabPayload): Promise<SubmitLabResult> => {
    const res = await apiClient.post<any>(`/labs/${labId}/submit`, payload);
    return res.data?.data ?? res.data;
  },

  /** Get current user's submission history for a lab */
  getSubmissions: async (labId: string): Promise<LabSubmissionRecord[]> => {
    const res = await apiClient.get<any>(`/labs/${labId}/submissions`);
    return res.data?.data ?? res.data ?? [];
  },

  /** Get all lab submissions history for current user */
  getUserSubmissions: async (): Promise<UserLabSubmissionItem[]> => {
    const res = await apiClient.get<any>('/labs/user/submissions');
    return res.data?.data ?? res.data ?? [];
  },

  /** Dashboard stats — completed labs, streak, series progress */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const res = await apiClient.get<any>('/labs/me/stats');
      return res.data?.data ?? res.data;
    } catch {
      const res = await apiClient.get<any>('/labs/user/dashboard-stats');
      return res.data?.data ?? res.data;
    }
  },
};
