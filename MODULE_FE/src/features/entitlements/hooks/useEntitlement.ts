import { useQuery } from '@tanstack/react-query';
import { entitlementsAdminApi } from '@/features/admin/api/entitlements.admin.api';
import { useAppSelector } from '@/stores/store';

/**
 * Custom React hook to check feature access and restriction states for current logged-in user.
 *
 * @param featureCode Unique feature identifier (e.g., 'VIEW_SOLUTION', 'SUBMIT_LAB')
 * @returns { hasAccess, isBanned, banReason, isLoading }
 */
export function useEntitlement(featureCode: string) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useQuery({
    queryKey: ['my-entitlements'],
    queryFn: () => entitlementsAdminApi.getMyEntitlements(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false,
  });

  // Administrators retain full client-side access by default
  if (user?.role === 'admin') {
    return {
      hasAccess: true,
      isBanned: false,
      banReason: undefined,
      isLoading: false,
    };
  }

  if (!isAuthenticated) {
    return {
      hasAccess: false,
      isBanned: false,
      banReason: 'Authentication required',
      isLoading: false,
    };
  }

  const feature = data?.effectiveFeatures?.find((f) => f.code === featureCode);

  return {
    hasAccess: feature?.hasAccess ?? false,
    isBanned: feature?.isBanned ?? false,
    banReason: feature?.reason,
    isLoading,
  };
}
