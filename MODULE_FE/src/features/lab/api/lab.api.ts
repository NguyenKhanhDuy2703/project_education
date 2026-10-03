import { apiClient } from '@/services/api.client';
import type { ApiResponse } from '@/types/api.types';
import type { LabDetail, SubmitLabPayload, DashboardStats } from '@/types/lab.types';
import {
  isMock,
  mockGetLabById,
  mockSubmitLab,
  mockGetDashboardStats,
} from '@/mocks/mock.adapter';

export const labApi = {
  /** Protected — requires auth + RBAC guard on backend */
  getById: (labId: string): Promise<LabDetail> => {
    if (isMock) return mockGetLabById(labId);
    return apiClient
      .get<ApiResponse<LabDetail>>(`/labs/${labId}`)
      .then((r) => r.data.data);
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
