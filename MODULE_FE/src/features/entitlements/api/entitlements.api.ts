import { apiClient } from '@/services/api.client';
import type { UserEntitlementsResponse } from '../types/entitlement.types';

export const entitlementsApi = {
  /**
   * Get current user's effective entitlements.
   */
  getMyEntitlements: async (): Promise<UserEntitlementsResponse> => {
    const res = await apiClient.get<any>('/entitlements/me');
    return res.data?.data ?? res.data;
  },
};
