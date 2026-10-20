import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { en, type TranslationCatalog } from '@/locales/en';
import { vi } from '@/locales/vi';

export type Locale = 'en' | 'vi';

export interface LocaleOption {
  code: Locale;
  label: string;
}

export const AVAILABLE_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English' },
];

const catalogs: Record<Locale, TranslationCatalog> = {
  en,
  vi,
};

// Nested keys helper
type Prev = [never, 0, 1, 2, 3];
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

export type Leaves<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
  : '';

export type TranslationKey = Leaves<TranslationCatalog>;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  availableLocales: LocaleOption[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'study_locale';

function getInitialLocale(): Locale {
  // Enforce English-only mode; sanitize any legacy 'vi' setting
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'vi') {
        localStorage.setItem(STORAGE_KEY, 'en');
      }
    } catch {
      // ignore
    }
  }
  return 'en';
}

function resolveNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function formatTemplate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    // English-only mode: locks target to 'en'
    const targetLocale = newLocale === 'vi' ? 'en' : newLocale;
    setLocaleState(targetLocale);
    try {
      localStorage.setItem(STORAGE_KEY, targetLocale);
      document.documentElement.lang = targetLocale;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      // ignore
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
      const activeCatalog = catalogs[locale];
      let val = resolveNestedValue(activeCatalog, key);
      // Fallback to English catalog if missing
      if (val === undefined) {
        val = resolveNestedValue(catalogs.en, key);
      }
      // Fallback to key itself
      if (val === undefined) {
        return key;
      }
      return formatTemplate(val, params);
    };

    return {
      locale,
      setLocale,
      t,
      availableLocales: AVAILABLE_LOCALES,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider to avoid crashes in tests
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const val = resolveNestedValue(catalogs.en, key) ?? key;
        return formatTemplate(val, params);
      },
      availableLocales: AVAILABLE_LOCALES,
    };
  }
  return context;
}
