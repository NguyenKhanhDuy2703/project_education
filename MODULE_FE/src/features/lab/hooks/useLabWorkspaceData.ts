import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { labApi } from '@/features/lab/api/lab.api';
import { seriesApi } from '@/features/lab/api/series.api';
import { normalizeLabDetail } from '@/features/lab/domain/labContentCodec';
import type { LabDetail, PracticeLabV1, LabSubmissionRecord, LabSeries } from '@/types/lab.types';
import type { AxiosError } from 'axios';

export interface UseLabWorkspaceDataReturn {
  rawLab: LabDetail | undefined;
  normalizedLab: PracticeLabV1 | null;
  series: LabSeries | undefined;
  submissions: LabSubmissionRecord[];
  isSolved: boolean;
  solvedLabsCount: number;
  seriesProgressPercent: number;
  isLoading: boolean;
  error: Error | null;
  is403: boolean;
}

export function useLabWorkspaceData(labId: string | undefined): UseLabWorkspaceDataReturn {
  const {
    data: rawLab,
    isLoading: isLabLoading,
    error: labError,
  } = useQuery({
    queryKey: ['lab', labId],
    queryFn: () => labApi.getById(labId!),
    enabled: Boolean(labId),
  });

  const normalizedLab = useMemo(() => {
    if (!rawLab) return null;
    return normalizeLabDetail(rawLab);
  }, [rawLab]);

  const { data: series } = useQuery({
    queryKey: ['series', rawLab?.series?.slug],
    queryFn: () => seriesApi.getBySlug(rawLab!.series!.slug),
    enabled: Boolean(rawLab?.series?.slug),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['lab-submissions', labId],
    queryFn: () => labApi.getSubmissions(labId!),
    enabled: Boolean(labId),
  });

  const isSolved = useMemo(() => {
    return submissions.some((s) => s.status === 'passed');
  }, [submissions]);

  const seriesLabs = series?.labs || [];

  const solvedLabsCount = useMemo(() => {
    return seriesLabs.filter((item) => {
      if (item.userStatus === 'passed') return true;
      if (item.id === rawLab?.id && isSolved) return true;
      return false;
    }).length;
  }, [seriesLabs, rawLab?.id, isSolved]);

  const seriesProgressPercent =
    seriesLabs.length > 0 ? Math.round((solvedLabsCount / seriesLabs.length) * 100) : 0;

  const is403 = (labError as AxiosError)?.response?.status === 403;

  return {
    rawLab,
    normalizedLab,
    series,
    submissions,
    isSolved,
    solvedLabsCount,
    seriesProgressPercent,
    isLoading: isLabLoading,
    error: labError,
    is403,
  };
}
