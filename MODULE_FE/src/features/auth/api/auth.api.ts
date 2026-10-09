import { apiClient } from '@/services/api.client';
import type { AuthResponse, User } from '@/types/user.types';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post<any>('/auth/login', {
      identifier: credentials.phoneOrEmail,
      password: credentials.password,
    });
    return res.data?.data ?? res.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post<any>('/auth/register', credentials);
    return res.data?.data ?? res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get<any>('/auth/me');
    const user = res.data?.data?.user ?? res.data?.user ?? res.data?.data ?? res.data;
    return {
      ...user,
      role: user.role || 'user',
    };
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
