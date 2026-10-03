import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setAuth, logout as logoutAction } from '@/stores/slices/auth.slice';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      dispatch(setAuth({ user: data.user, accessToken: data.accessToken }));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: (data) => {
      dispatch(setAuth({ user: data.user, accessToken: data.accessToken }));
    },
  });

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
  });

  const logout = () => {
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
