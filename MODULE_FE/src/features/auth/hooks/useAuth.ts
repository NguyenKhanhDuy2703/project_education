import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setAuth, setUser, logout as logoutAction } from '@/stores/slices/auth.slice';
import { getJwtTimeRemainingMs } from '../utils/jwtHelper';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      dispatch(
        setAuth({
          user: data.user,
          accessToken: data.accessToken,
        })
      );
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data) => {
      dispatch(
        setAuth({
          user: data.user,
          accessToken: data.accessToken,
        })
      );
    },
  });

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (currentUserQuery.data) {
      dispatch(setUser(currentUserQuery.data));
    }
  }, [currentUserQuery.data, dispatch]);

  // Proactive silent refresh: schedule 60s before JWT expiry, resume on visibility change
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      const remainingMs = getJwtTimeRemainingMs(accessToken);
      if (remainingMs > 0) {
        // Refresh 60s before expiry (or minimum 5s if expiring soon)
        const delay = Math.max(remainingMs - 60 * 1000, 5000);
        timerId = setTimeout(async () => {
          try {
            await authApi.refreshToken();
          } catch {}
        }, delay);
      }
    };

    scheduleRefresh();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const remainingMs = getJwtTimeRemainingMs(accessToken);
        if (remainingMs <= 60 * 1000) {
          try {
            await authApi.refreshToken();
          } catch {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, accessToken]);

  const logout = () => {
    authApi.logout().catch(() => {});
    dispatch(logoutAction());
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    currentUser: currentUserQuery.data,
  };
};
