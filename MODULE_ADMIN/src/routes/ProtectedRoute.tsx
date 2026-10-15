import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';

export function ProtectedRoute() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
