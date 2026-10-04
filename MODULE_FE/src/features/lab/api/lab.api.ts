import { apiClient } from '@/services/api.client';
import type { ApiResponse } from '@/types/api.types';
import type { LabDetail, SubmitLabPayload, DashboardStats, CreateLabInput } from '@/types/lab.types';
import {
  isMock,
  mockGetLabById,
  mockSubmitLab,
  mockGetDashboardStats,
} from '@/mocks/mock.adapter';

export const labApi = {
  /** Fetch lab detail by slug (Public / Student view) */
  getBySlug: async (slug: string): Promise<LabDetail> => {
    if (isMock) return mockGetLabById(slug);
    const res = await apiClient.get<any>(`/labs/${slug}`);
    return res.data?.data ?? res.data;
  },

  /** Protected — requires auth + RBAC guard on backend */
  getById: async (labId: string): Promise<LabDetail> => {
    if (isMock) return mockGetLabById(labId);
    const res = await apiClient.get<any>(`/labs/${labId}`);
    return res.data?.data ?? res.data;
  },

  /** Admin: Create new practice / blog lab */
  create: async (data: CreateLabInput): Promise<LabDetail> => {
    const res = await apiClient.post<any>('/labs', data);
    return res.data?.data ?? res.data;
  },

  /** Admin: Update practice / blog lab */
  update: async (id: string, data: Partial<CreateLabInput>): Promise<LabDetail> => {
    const res = await apiClient.put<any>(`/labs/${id}`, data);
    return res.data?.data ?? res.data;
  },

  /** Admin: Delete practice / blog lab */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/labs/${id}`);
  },

  /** Submit user's code result after Web Worker execution */
  submit: (labId: string, payload: SubmitLabPayload): Promise<void> => {
    if (isMock) return mockSubmitLab(labId);
    return apiClient.post(`/labs/${labId}/submit`, payload).then(() => undefined);
  },

  /** Dashboard stats — completed labs, streak, series progress */
  getDashboardStats: (): Promise<DashboardStats> => {
    if (isMock) return mockGetDashboardStats();
    return apiClient
      .get<ApiResponse<DashboardStats>>('/users/me/dashboard-stats')
      .then((r) => r.data.data);
  },
};
