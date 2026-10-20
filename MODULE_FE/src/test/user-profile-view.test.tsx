import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/stores/slices/auth.slice';
import { UserProfileView } from '../pages/dashboard/views/UserProfileView';

function createMockStore(role: string = 'user') {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'user-123',
          name: 'Jane Learner',
          email: 'jane@example.com',
          role: role as any,
          phone: '+84987654321',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-jwt-token',
        refreshToken: null,
        isAuthenticated: true,
      },
    },
  });
}

describe('UserProfileView Plain Language Copy (Subtask 9.2)', () => {
  it('displays user-friendly plain-language status instead of implementation jargon', () => {
    const store = createMockStore();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UserProfileView />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );

    // Should display plain-language status
    expect(screen.getByText('Signed in')).toBeDefined();
    expect(screen.getByText('Your session is protected')).toBeDefined();

    // Must NOT contain technical implementation jargon
    expect(screen.queryByText('Authentication: Session Active')).toBeNull();
    expect(screen.queryByText('JWT Guarded')).toBeNull();
  });
});
