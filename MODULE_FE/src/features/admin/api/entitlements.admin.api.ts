import { apiClient } from '@/services/api.client';

export interface PlanFeatureItem {
  planId: string;
  featureId: string;
  limitValue: number | null;
  feature: FeatureItem;
}

export interface SubscriptionPlanItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  isDefault: boolean;
  isActive: boolean;
  planFeatures: PlanFeatureItem[];
  _count?: { subscriptions: number };
}

export interface FeatureItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: 'lab_execution' | 'content_access' | 'ai_assistant' | 'system_operation';
  isActive: boolean;
}

export interface UserFeatureOverrideItem {
  id: string;
  featureCode: string;
  featureName: string;
  effect: 'ALLOW' | 'DENY';
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface EffectiveFeatureItem {
  featureId: string;
  code: string;
  name: string;
  category: string;
  hasAccess: boolean;
  isBanned: boolean;
  reason?: string;
}

export interface UserEntitlementsResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  currentSubscription: {
    id: string;
    planCode: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string | null;
  } | null;
  overrides: UserFeatureOverrideItem[];
  effectiveFeatures: EffectiveFeatureItem[];
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  targetUserId: string | null;
  action: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  targetUser?: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  } | null;
}

export interface PaginatedAuditLogsResponse {
  items: AuditLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const entitlementsAdminApi = {
  /**
   * Fetch all subscription plans.
   */
  getPlans: async (): Promise<SubscriptionPlanItem[]> => {
    const res = await apiClient.get<any>('/admin/plans');
    return res.data?.data ?? res.data;
  },

  /**
   * Create a new subscription plan.
   */
  createPlan: async (data: {
    code: string;
    name: string;
    description?: string;
    price: number;
    billingCycle: string;
    isDefault?: boolean;
  }): Promise<SubscriptionPlanItem> => {
    const res = await apiClient.post<any>('/admin/plans', data);
    return res.data?.data ?? res.data;
  },

  /**
   * Update subscription plan details (Admin only).
   */
  updatePlan: async (
    planId: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      billingCycle?: string;
      isActive?: boolean;
      isDefault?: boolean;
    },
  ): Promise<SubscriptionPlanItem> => {
    const res = await apiClient.put<any>(`/admin/plans/${planId}`, data);
    return res.data?.data ?? res.data;
  },

  /**
   * Delete a subscription plan (Admin only).
   */
  deletePlan: async (planId: string): Promise<void> => {
    await apiClient.delete(`/admin/plans/${planId}`);
  },

  /**
   * Update mapped features for a subscription plan.
   */
  updatePlanFeatures: async (planId: string, featureIds: string[]): Promise<SubscriptionPlanItem> => {
    const res = await apiClient.put<any>(`/admin/plans/${planId}/features`, { featureIds });
    return res.data?.data ?? res.data;
  },

  /**
   * Fetch all registered platform features.
   */
  getFeatures: async (): Promise<FeatureItem[]> => {
    const res = await apiClient.get<any>('/admin/features');
    return res.data?.data ?? res.data;
  },

  /**
   * Register a new platform feature.
   */
  createFeature: async (data: {
    code: string;
    name: string;
    description?: string;
    category?: string;
  }): Promise<FeatureItem> => {
    const res = await apiClient.post<any>('/admin/features', data);
    return res.data?.data ?? res.data;
  },

  /**
   * Get full entitlement summary and overrides for a target user.
   */
  getUserEntitlements: async (userId: string): Promise<UserEntitlementsResponse> => {
    const res = await apiClient.get<any>(`/admin/users/${userId}/entitlements`);
    return res.data?.data ?? res.data;
  },

  /**
   * Assign or upgrade a subscription plan for a target user.
   */
  assignSubscription: async (
    userId: string,
    data: { planId: string; durationDays?: number; reason?: string },
  ): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/users/${userId}/subscription`, data);
    return res.data?.data ?? res.data;
  },

  /**
   * Grant (ALLOW) or Ban (DENY) a feature for an individual user.
   */
  setFeatureOverride: async (
    userId: string,
    data: {
      featureCode: string;
      effect: 'ALLOW' | 'DENY';
      reason: string;
      expiresAt?: string;
    },
  ): Promise<any> => {
    const res = await apiClient.post<any>(`/admin/users/${userId}/feature-overrides`, data);
    return res.data?.data ?? res.data;
  },

  /**
   * Remove a feature override, restoring normal plan-level resolution.
   */
  removeFeatureOverride: async (userId: string, featureCode: string): Promise<any> => {
    const res = await apiClient.delete<any>(`/admin/users/${userId}/feature-overrides/${featureCode}`);
    return res.data?.data ?? res.data;
  },

  /**
   * Query paginated administrative audit logs.
   */
  getAuditLogs: async (params?: {
    targetUserId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedAuditLogsResponse> => {
    const res = await apiClient.get<any>('/admin/audit-logs', { params });
    return res.data?.data ?? res.data;
  },

  /**
   * Get current user's effective entitlements.
   */
  getMyEntitlements: async (): Promise<UserEntitlementsResponse> => {
    const res = await apiClient.get<any>('/entitlements/me');
    return res.data?.data ?? res.data;
  },
};
