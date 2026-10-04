import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/stores/store';
import { setToken, setUser } from '@/stores/slices/auth.slice';
import { authApi } from '@/features/auth/api/auth.api';

/**
 * GoogleCallbackPage
 *
 * Backend redirects here after successful Google OAuth:
 *   /dashboard?token=<accessToken>
 *
 * We pull the token from the query string, fetch the current user,
 * hydrate the Redux store, then navigate to the dashboard.
 */
export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Store the token first so authApi.getCurrentUser can send it in the header
    dispatch(setToken(token));

    authApi
      .getCurrentUser()
      .then((user) => {
        dispatch(setUser(user));
        navigate('/', { replace: true });
      })
      .catch(() => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const parsed = JSON.parse(jsonPayload);
          const data = parsed?.payload || parsed;
          if (data?.userId || data?.id || data?.email) {
            dispatch(
              setUser({
                id: data.userId || data.id || 'google-user',
                name: data.name || data.email?.split('@')[0] || 'User',
                email: data.email || null,
                phone: data.phone || '',
                role: data.role || 'user',
                avatarUrl: data.avatarUrl || null,
                defaultAddress: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            );
            navigate('/', { replace: true });
            return;
          }
        } catch {
          // ignore parsing error and redirect to login
        }
        navigate('/login', { replace: true });
      });
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm animate-pulse">Đang xác thực với Google...</p>
    </div>
  );
}
