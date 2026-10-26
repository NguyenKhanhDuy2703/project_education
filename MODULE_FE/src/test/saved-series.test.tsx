import { describe, it, expect, vi } from 'vitest';
import { seriesApi } from '@/features/lab/api/series.api';
import { apiClient } from '@/services/api.client';

describe('PB-23: Saved Series API Client', () => {
  it('calls POST /series/:id/save when saving series', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { saved: true, message: 'Series saved successfully' },
    } as any);

    const res = await seriesApi.save('test-series-123');
    expect(postSpy).toHaveBeenCalledWith('/series/test-series-123/save');
    expect(res.saved).toBe(true);

    postSpy.mockRestore();
  });

  it('calls DELETE /series/:id/save when unsaving series', async () => {
    const delSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: { saved: false, message: 'Series unsaved successfully' },
    } as any);

    const res = await seriesApi.unsave('test-series-123');
    expect(delSpy).toHaveBeenCalledWith('/series/test-series-123/save');
    expect(res.saved).toBe(false);

    delSpy.mockRestore();
  });

  it('calls GET /series/user/saved to retrieve user saved series library', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [
        { id: 's1', title: 'React 19 Deep Dive', isSaved: true },
        { id: 's2', title: 'Playwright Automation', isSaved: true },
      ],
    } as any);

    const list = await seriesApi.getSavedSeries();
    expect(getSpy).toHaveBeenCalledWith('/series/user/saved');
    expect(list.length).toBe(2);
    expect(list[0].id).toBe('s1');

    getSpy.mockRestore();
  });
});
