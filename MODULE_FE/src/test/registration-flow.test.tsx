import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/stores/slices/auth.slice';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { LoginForm } from '../features/auth/components/LoginForm';
import { authApi } from '../features/auth/api/auth.api';

describe('PB-01: Registration Contract & Flow (Decision D-01)', () => {
  it('does not store unauthenticated token upon registration and redirects to login with notification', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    // Mock register API to return HTTP 201 contract
    const registerSpy = vi.spyOn(authApi, 'register').mockResolvedValueOnce({
      message: 'User registered successfully',
      nextAction: 'login',
      user: {
        id: 'u-123',
        name: 'Nguyen Van A',
        email: 'nguyenvana@example.com',
        phone: '0987654321',
        role: 'user',
        isActive: true,
      },
    });

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginForm />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Nguyen Van A' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '0987654321' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'nguyenvana@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'StrongPass123!' } });
    fireEvent.click(screen.getByRole('checkbox'));

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitBtn);

    // Verify API called
    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        name: 'Nguyen Van A',
        phone: '0987654321',
        email: 'nguyenvana@example.com',
        password: 'StrongPass123!',
      });
    });

    // Verify Redux state: user is NOT authenticated, accessToken is null
    const authState = store.getState().auth;
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.accessToken).toBeNull();

    // Verify navigated to /login and success banner displayed
    await waitFor(() => {
      expect(screen.getByText(/Tài khoản đã tạo thành công! Vui lòng đăng nhập để tiếp tục./i)).toBeDefined();
    });
  });
});
