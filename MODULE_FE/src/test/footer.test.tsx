import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { I18nProvider } from '@/features/preferences/i18n';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nProvider>
  );
}

describe('Footer Component (Task 5 / Subtask 5.1 & 5.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders 3-column information architecture with brand, learn, and legal links', () => {
    render(<Footer />, { wrapper: Wrapper });

    // Column 1: Brand & Tagline
    expect(screen.getByText('StudyIT')).toBeDefined();
    expect(
      screen.getByText('Interactive developer practice series platform')
    ).toBeDefined();

    // Column 2: Learn
    expect(screen.getByRole('heading', { name: /learn/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /series catalog/i }).getAttribute('href')).toBe(
      '/series'
    );
    expect(screen.getByRole('link', { name: /practice labs/i }).getAttribute('href')).toBe(
      '/series?tab=labs'
    );
    expect(
      screen.getByRole('link', { name: /learner dashboard/i }).getAttribute('href')
    ).toBe('/user/dashboard');

    // Column 3: Support & Legal
    expect(
      screen.getByRole('heading', { name: /support & legal/i })
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /give feedback/i })).toBeDefined();
    expect(screen.getAllByRole('link', { name: /terms of service/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /privacy policy/i }).length).toBeGreaterThan(0);

    // Dynamic current year
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} StudyIT\\.dev`))).toBeDefined();
  });

  it('dispatches open-study-feedback event when Give Feedback is clicked', () => {
    const listener = vi.fn();
    window.addEventListener('open-study-feedback', listener);

    render(<Footer />, { wrapper: Wrapper });

    const feedbackBtn = screen.getByRole('button', { name: /give feedback/i });
    fireEvent.click(feedbackBtn);

    expect(listener).toHaveBeenCalled();
    window.removeEventListener('open-study-feedback', listener);
  });

  it('enforces English footer links and headers even if legacy locale was stored', () => {
    localStorage.setItem('study_locale', 'vi');

    render(<Footer />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /learn/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /support & legal/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /give feedback/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /series catalog/i })).toBeDefined();
  });
});
