import { useState, useCallback } from 'react';

/**
 * useSidebarCollapse — Deterministic fixed-width collapse state hook.
 * Stores user preference in localStorage ('studyweb:sidebar-collapsed').
 * Fixed widths: w-16 (64px) collapsed, w-60 (240px) expanded.
 */
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('studyweb:sidebar-collapsed');
      return saved !== null ? saved === 'true' : true; // Default to collapsed
    } catch {
      return true;
    }
  });

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('studyweb:sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  return {
    collapsed,
    toggleCollapse,
  };
}
