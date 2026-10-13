import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import type { PermissionCode, UserRole } from '@/types/user.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requiredPermission?: PermissionCode;
}

export function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = user.role || 'user';
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !can(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
