import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { store } from '@/stores/store';
import { setTokens, logout } from '@/stores/slices/auth.slice';
import { defaultRefreshCoordinator } from '@/features/auth/services/refreshCoordinator';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken || localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/refresh-token') ||
      requestUrl.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await defaultRefreshCoordinator.requestRefresh(async () => {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {}, // Cookie-first: relies on HttpOnly cookie
            { withCredentials: true }
          );

          const data = response.data?.data || response.data;
          const token = data?.accessToken;
          if (!token) {
            throw new Error('Refresh response missing access token');
          }

          store.dispatch(setTokens({ accessToken: token }));
          return token;
        });

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Only invalidate local session if backend explicitly rejects credentials
        if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
          store.dispatch(logout());
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
