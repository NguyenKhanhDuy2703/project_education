import { apiClient } from '@/services/api.client';
import type { ApiResponse } from '@/types/api.types';
import type { LabSeries } from '@/types/lab.types';
import {
  isMock,
  mockGetAllSeries,
  mockGetSeriesBySlug,
} from '@/mocks/mock.adapter';

export const seriesApi = {
  /** Public catalog — no auth required */
  getAll: (): Promise<LabSeries[]> => {
    if (isMock) return mockGetAllSeries();
    return apiClient
      .get<ApiResponse<LabSeries[]>>('/series')
      .then((r) => r.data.data);
  },

  /** Series detail with full lab list */
  getBySlug: (slug: string): Promise<LabSeries> => {
    if (isMock) return mockGetSeriesBySlug(slug);
    return apiClient
      .get<ApiResponse<LabSeries>>(`/series/${slug}`)
      .then((r) => r.data.data);
  },
};
