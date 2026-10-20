import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'study_theme';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'system';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

export function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getInitialThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getInitialThemePreference()));

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // ignore
    }
    const resolved = resolveTheme(pref);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  };

  const toggleTheme = () => {
    const next: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemePreference(next);
  };

  useEffect(() => {
    const resolved = resolveTheme(themePreference);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);

    if (themePreference === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyThemeClass(nextResolved);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themePreference]);

  const value = useMemo<ThemeContextValue>(() => ({
    themePreference,
    resolvedTheme,
    setThemePreference,
    toggleTheme,
  }), [themePreference, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themePreference: 'system',
      resolvedTheme: 'light',
      setThemePreference: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
