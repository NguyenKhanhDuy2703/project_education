import { apiClient } from '@/services/api.client';
import type { ApiResponse } from '@/types/api.types';
import type {
  LabDetail,
  SubmitLabPayload,
  LabSubmissionRecord,
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

  /** Submit user's code result after Web Worker execution */
  submit: (labId: string, payload: SubmitLabPayload): Promise<void> => {
    return apiClient.post(`/labs/${labId}/submit`, payload).then(() => undefined);
  },

  /** Get current user's submission history for a lab */
  getSubmissions: async (labId: string): Promise<LabSubmissionRecord[]> => {
    const res = await apiClient.get<any>(`/labs/${labId}/submissions`);
    return res.data?.data ?? res.data ?? [];
  },

  /** Dashboard stats — completed labs, streak, series progress */
  getDashboardStats: (): Promise<DashboardStats> => {
    return apiClient
      .get<ApiResponse<DashboardStats>>('/users/me/dashboard-stats')
      .then((r) => r.data.data);
  },
};
