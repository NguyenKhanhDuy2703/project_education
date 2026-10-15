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
