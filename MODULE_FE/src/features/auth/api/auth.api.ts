import { apiClient } from '@/services/api.client';
import type { ApiResponse } from '@/types/api.types';
import type { AuthResponse, User } from '@/types/user.types';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';
import { isMock } from '@/mocks/mock.adapter';
import { mockLogin, mockGetCurrentUser } from '@/mocks/data/auth.mock';
import { store } from '@/stores/store';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (isMock) {
      // Giả lập latency mạng
      await new Promise((r) => setTimeout(r, 400));
      const result = mockLogin(credentials.phoneOrEmail, credentials.password ?? '');
      return result;
    }
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    if (isMock) {
      await new Promise((r) => setTimeout(r, 400));
      throw new Error('[Mock] Chức năng đăng ký chưa hỗ trợ mock. Dùng tài khoản test sẵn có.');
    }
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    return res.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    if (isMock) {
      const token = store.getState().auth.accessToken;
      await new Promise((r) => setTimeout(r, 200));
      return mockGetCurrentUser(token ?? '');
    }
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    if (isMock) return;
    await apiClient.post('/auth/logout');
  },
};
