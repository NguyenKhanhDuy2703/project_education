import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/stores/slices/auth.slice';
import { Navbar } from '@/components/layout/Navbar';
import { ThemeProvider } from '@/features/preferences/theme';
import { I18nProvider } from '@/features/preferences/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderNavbar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <MemoryRouter>
              <Navbar />
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

describe('Navbar Theme and Language Controls (Subtask 1.3)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = 'en';

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders accessible theme toggle button and enforces English without language switcher', () => {
    renderNavbar();

    const themeBtn = screen.getAllByRole('button', { name: /toggle color theme/i })[0];
    expect(themeBtn).toBeDefined();

    const langBtns = screen.queryAllByRole('button', { name: /switch language/i });
    expect(langBtns.length).toBe(0);
  });

  it('toggles theme when theme button is clicked', () => {
    renderNavbar();

    const themeBtn = screen.getAllByRole('button', { name: /toggle color theme/i })[0];
    fireEvent.click(themeBtn);

    expect(localStorage.getItem('study_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
