import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { I18nProvider, useI18n, formatTemplate } from '@/features/preferences/i18n';

describe('I18n Foundation Suite (Subtask 1.1)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('formats templates with parameters correctly', () => {
    expect(formatTemplate('Hello {name}', { name: 'Alex' })).toBe('Hello Alex');
    expect(formatTemplate('Score: {score}%', { score: 95 })).toBe('Score: 95%');
    expect(formatTemplate('No params')).toBe('No params');
    expect(formatTemplate('Missing {missing}', {})).toBe('Missing {missing}');
  });

  it('defaults to English when localStorage is empty', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('nav.home')).toBe('Home');
    expect(result.current.t('common.save')).toBe('Save');
  });

  it('enforces English and sanitizes any attempt to switch to Vietnamese', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );
    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLocale('vi');
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('nav.home')).toBe('Home');
    expect(result.current.t('common.save')).toBe('Save');
    expect(localStorage.getItem('study_locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('sanitizes legacy Vietnamese locale from localStorage and enforces English', () => {
    localStorage.setItem('study_locale', 'vi');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('nav.catalog')).toBe('Series Catalog');
  });

  it('interpolates parameters in translation strings', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <I18nProvider>{children}</I18nProvider>
    );
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.t('footer.copyright', { year: 2026 })).toBe(
      '© 2026 StudyIT.dev. All rights reserved.'
    );
  });

  it('safely provides English fallback when hook is used outside I18nProvider', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.locale).toBe('en');
    expect(result.current.t('common.ok')).toBe('OK');
  });
});
