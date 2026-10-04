import { apiClient } from '@/services/api.client';
import type { CreateSeriesInput, LabSeries } from '@/types/lab.types';
import {
  isMock,
  mockGetAllSeries,
  mockGetSeriesBySlug,
} from '@/mocks/mock.adapter';

export const seriesApi = {
  /** Public catalog — no auth required */
  getAll: async (includeInactive = false): Promise<LabSeries[]> => {
    if (isMock) return mockGetAllSeries();
    const query = includeInactive ? '?includeInactive=true' : '';
    const res = await apiClient.get<any>(`/series${query}`);
    return res.data?.data ?? res.data;
  },

  /** Series detail with full lab list */
  getBySlug: async (slug: string): Promise<LabSeries> => {
    if (isMock) return mockGetSeriesBySlug(slug);
    const res = await apiClient.get<any>(`/series/${slug}`);
    return res.data?.data ?? res.data;
  },

  /** Admin: Create new topic/series */
  create: async (data: CreateSeriesInput): Promise<LabSeries> => {
    const res = await apiClient.post<any>('/series', data);
    return res.data?.data ?? res.data;
  },

  /** Admin: Update topic/series */
  update: async (id: string, data: Partial<CreateSeriesInput>): Promise<LabSeries> => {
    const res = await apiClient.put<any>(`/series/${id}`, data);
    return res.data?.data ?? res.data;
  },

  /** Admin: Delete topic/series */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/series/${id}`);
  },
};
