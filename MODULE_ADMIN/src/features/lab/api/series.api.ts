import { apiClient } from '@/services/api.client';
import type { CreateSeriesInput, LabSeries } from '@/types/lab.types';

export const seriesApi = {
  /** Public catalog — no auth required */
  getAll: async (includeInactive = false): Promise<LabSeries[]> => {
    const query = includeInactive ? '?includeInactive=true' : '';
    const res = await apiClient.get<any>(`/series${query}`);
    return res.data?.data ?? res.data;
  },

  /** Series detail with full lab list */
  getBySlug: async (slug: string): Promise<LabSeries> => {
    const res = await apiClient.get<any>(`/series/${slug}`);
    return res.data?.data ?? res.data;
  },

  /** Contributor: Get series authored by current user */
  getMySeries: async (): Promise<LabSeries[]> => {
    const res = await apiClient.get<any>('/series/contributor/my-series');
    return res.data?.data ?? res.data ?? [];
  },

  /** Contributor: Submit series for admin review */
  submitForReview: async (id: string): Promise<any> => {
    const res = await apiClient.post<any>(`/series/${id}/submit-for-review`);
    return res.data?.data ?? res.data;
  },

  /** Admin / Contributor: Create new topic/series */
  create: async (data: CreateSeriesInput): Promise<LabSeries> => {
    const res = await apiClient.post<any>('/series', data);
    return res.data?.data ?? res.data;
  },

  /** Admin / Contributor: Update topic/series */
  update: async (id: string, data: Partial<CreateSeriesInput>): Promise<LabSeries> => {
    const res = await apiClient.put<any>(`/series/${id}`, data);
    return res.data?.data ?? res.data;
  },

  /** Admin / Contributor: Delete topic/series */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/series/${id}`);
  },

  /** Sections management */
  createSection: async (
    seriesId: string,
    data: { title: string; description?: string; orderIndex?: number },
  ): Promise<any> => {
    const res = await apiClient.post<any>(`/series/${seriesId}/sections`, data);
    return res.data?.data ?? res.data;
  },

  updateSection: async (
    seriesId: string,
    sectionId: string,
    data: { title?: string; description?: string; orderIndex?: number },
  ): Promise<any> => {
    const res = await apiClient.put<any>(`/series/${seriesId}/sections/${sectionId}`, data);
    return res.data?.data ?? res.data;
  },

  deleteSection: async (seriesId: string, sectionId: string): Promise<void> => {
    await apiClient.delete(`/series/${seriesId}/sections/${sectionId}`);
  },
};
