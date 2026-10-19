import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLabNavigation } from '../features/lab/hooks/useLabNavigation';
import type { LabSummary, LabDetail } from '@/types/lab.types';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('Lab Workspace Hooks Suite (Subtask 3.2)', () => {
  describe('useLabNavigation', () => {
    const mockSeriesLabs: LabSummary[] = [
      { id: 'l1', slug: 'lab-1', seriesId: 'series-1', title: 'Lab 1: Select Basics', order: 1, isProOnly: false, sandboxType: 'sql_worker', estimatedMinutes: 15 },
      { id: 'l2', slug: 'lab-2', seriesId: 'series-1', title: 'Lab 2: Where Clause', order: 2, isProOnly: false, sandboxType: 'sql_worker', estimatedMinutes: 20 },
      { id: 'l3', slug: 'lab-3', seriesId: 'series-1', title: 'Lab 3: Group By', order: 3, isProOnly: true, sandboxType: 'sql_worker', estimatedMinutes: 25 },
    ];

    it('correctly calculates index, prevLab, and nextLab for middle lab', () => {
      const currentLab: Partial<LabDetail> = { id: 'l2', slug: 'lab-2', title: 'Lab 2: Where Clause' };

      const { result } = renderHook(() =>
        useLabNavigation({
          seriesLabs: mockSeriesLabs,
          currentLab: currentLab as LabDetail,
        }),
      );

      expect(result.current.currentLabIndex).toBe(1);
      expect(result.current.prevLab?.id).toBe('l1');
      expect(result.current.nextLab?.id).toBe('l3');
    });

    it('returns null for prevLab at beginning and null for nextLab at end', () => {
      const firstLab: Partial<LabDetail> = { id: 'l1', slug: 'lab-1' };
      const { result: firstResult } = renderHook(() =>
        useLabNavigation({
          seriesLabs: mockSeriesLabs,
          currentLab: firstLab as LabDetail,
        }),
      );
      expect(firstResult.current.prevLab).toBeNull();
      expect(firstResult.current.nextLab?.id).toBe('l2');

      const lastLab: Partial<LabDetail> = { id: 'l3', slug: 'lab-3' };
      const { result: lastResult } = renderHook(() =>
        useLabNavigation({
          seriesLabs: mockSeriesLabs,
          currentLab: lastLab as LabDetail,
        }),
      );
      expect(lastResult.current.prevLab?.id).toBe('l2');
      expect(lastResult.current.nextLab).toBeNull();
    });

    it('filters series labs based on search query', () => {
      const currentLab: Partial<LabDetail> = { id: 'l1', slug: 'lab-1' };
      const { result } = renderHook(() =>
        useLabNavigation({
          seriesLabs: mockSeriesLabs,
          currentLab: currentLab as LabDetail,
        }),
      );

      expect(result.current.filteredSeriesLabs).toHaveLength(3);

      act(() => {
        result.current.setLabSearchQuery('group');
      });

      expect(result.current.filteredSeriesLabs).toHaveLength(1);
      expect(result.current.filteredSeriesLabs[0].slug).toBe('lab-3');
    });

    it('calls navigate when switching to a different lab', () => {
      const currentLab: Partial<LabDetail> = { id: 'l1', slug: 'lab-1' };
      const { result } = renderHook(() =>
        useLabNavigation({
          seriesLabs: mockSeriesLabs,
          currentLab: currentLab as LabDetail,
        }),
      );

      act(() => {
        result.current.handleSwitchLab(mockSeriesLabs[1]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/labs/lab-2');
    });
  });
});
