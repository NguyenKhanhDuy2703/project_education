import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LabSummary, LabDetail } from '@/types/lab.types';

export interface UseLabNavigationProps {
  seriesLabs: LabSummary[];
  currentLab: LabDetail | null | undefined;
}

export interface UseLabNavigationReturn {
  currentLabIndex: number;
  prevLab: LabSummary | null;
  nextLab: LabSummary | null;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  labSearchQuery: string;
  setLabSearchQuery: (q: string) => void;
  filteredSeriesLabs: LabSummary[];
  handleSwitchLab: (targetLab: LabSummary) => void;
}

export function useLabNavigation({
  seriesLabs,
  currentLab,
}: UseLabNavigationProps): UseLabNavigationReturn {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');

  const currentLabIndex = useMemo(() => {
    if (!seriesLabs.length || !currentLab) return -1;
    return seriesLabs.findIndex((l) => l.id === currentLab.id || l.slug === currentLab.slug);
  }, [seriesLabs, currentLab]);

  const prevLab = currentLabIndex > 0 ? seriesLabs[currentLabIndex - 1] : null;
  const nextLab =
    currentLabIndex >= 0 && currentLabIndex < seriesLabs.length - 1
      ? seriesLabs[currentLabIndex + 1]
      : null;

  const filteredSeriesLabs = useMemo(() => {
    if (!labSearchQuery.trim()) return seriesLabs;
    const q = labSearchQuery.toLowerCase();
    return seriesLabs.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.sandboxType && l.sandboxType.toLowerCase().includes(q)),
    );
  }, [seriesLabs, labSearchQuery]);

  const handleSwitchLab = useCallback(
    (targetLab: LabSummary) => {
      setIsDrawerOpen(false);
      if (targetLab.slug !== currentLab?.slug && targetLab.id !== currentLab?.id) {
        navigate(`/labs/${targetLab.slug || targetLab.id}`);
      }
    },
    [currentLab, navigate],
  );

  return {
    currentLabIndex,
    prevLab,
    nextLab,
    isDrawerOpen,
    setIsDrawerOpen,
    labSearchQuery,
    setLabSearchQuery,
    filteredSeriesLabs,
    handleSwitchLab,
  };
}
