import { apiClient } from '@/services/api.client';

export type UpgradeRequestStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface BillingSettingsRecord {
  id: string;
  isIntakeEnabled: boolean;
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  instructions?: string | null;
  transferSyntax?: string | null;
  qrTemplateUrl?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
  updatedById?: string | null;
}

export interface AdminUpgradeRequestItem {
  id: string;
  userId: string;
  planId: string;
  status: UpgradeRequestStatus;
  amount: number;
  priceSnapshot?: number | string;
  currency: string;
  periodMonths: number;
  period?: string;
  transferRef: string;
  transferReference?: string;
  bankDetails: Record<string, any>;
  bankSnapshot?: Record<string, any>;
  paymentReference: string | null;
  paymentConfirmedAt: string | null;
  paymentSubmittedAt?: string | null;
  reviewedBy: string | null;
  reviewedByUser?: { id: string; name: string } | null;
  reviewedById?: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  reviewReason?: string | null;
  verifiedAmount: number | null;
  verifiedBankRef: string | null;
  verifiedBankReference?: string | null;
  subscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    price: number;
    billingCycle: string;
  };
}

export interface PaginatedUpgradeRequestsResponse {
  items: AdminUpgradeRequestItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function normalizeRequestItem(raw: any): AdminUpgradeRequestItem {
  if (!raw) return raw;
  const transferRef = raw.transferReference ?? raw.transferRef ?? '';
  const amount = Number(raw.priceSnapshot ?? raw.amount ?? 0);
  const periodMonths = raw.periodMonths ?? (raw.period === 'YEARLY' ? 12 : 1);
  const period = raw.period ?? (periodMonths >= 12 ? 'YEARLY' : 'MONTHLY');
  const verifiedBankRef = raw.verifiedBankReference ?? raw.verifiedBankRef ?? null;
  const verifiedAmount = raw.verifiedAmount !== null && raw.verifiedAmount !== undefined ? Number(raw.verifiedAmount) : null;
  const paymentConfirmedAt = raw.paymentSubmittedAt ?? raw.paymentConfirmedAt ?? null;
  const rejectionReason = raw.reviewReason ?? raw.rejectionReason ?? null;
  const bankDetails = raw.bankSnapshot ?? raw.bankDetails ?? {};

  let reviewedByStr: string | null = null;
  let reviewedByUser: { id: string; name: string } | null = null;
  if (raw.reviewedBy && typeof raw.reviewedBy === 'object') {
    reviewedByStr = raw.reviewedBy.name || raw.reviewedBy.id || null;
    reviewedByUser = raw.reviewedBy;
  } else if (typeof raw.reviewedBy === 'string') {
    reviewedByStr = raw.reviewedBy;
  }

  return {
    ...raw,
    amount,
    priceSnapshot: raw.priceSnapshot ?? amount,
    currency: raw.currency ?? 'VND',
    periodMonths,
    period,
    transferRef,
    transferReference: raw.transferReference ?? transferRef,
    bankDetails,
    bankSnapshot: raw.bankSnapshot ?? bankDetails,
    paymentReference: raw.paymentReference ?? null,
    paymentConfirmedAt,
    paymentSubmittedAt: raw.paymentSubmittedAt ?? paymentConfirmedAt,
    reviewedBy: reviewedByStr,
    reviewedByUser,
    reviewedById: raw.reviewedById ?? (typeof raw.reviewedBy === 'object' ? raw.reviewedBy?.id : null),
    reviewedAt: raw.reviewedAt ?? null,
    rejectionReason,
    reviewReason: raw.reviewReason ?? rejectionReason,
    verifiedAmount,
    verifiedBankRef,
    verifiedBankReference: raw.verifiedBankReference ?? verifiedBankRef,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    user: raw.user ?? { id: raw.userId, name: 'Học viên', email: null, phone: null, role: 'user' },
    plan: raw.plan ?? { id: raw.planId, code: 'PRO', name: 'Gói Pro', price: amount, billingCycle: period },
  };
}

export const billingAdminApi = {
  getBillingSettings: async (): Promise<BillingSettingsRecord> => {
    const res = await apiClient.get('/admin/billing-settings');
    return res.data?.data ?? res.data;
  },

  updateBillingSettings: async (
    data: Partial<Omit<BillingSettingsRecord, 'id' | 'updatedAt' | 'updatedBy' | 'updatedById'>>,
  ): Promise<BillingSettingsRecord> => {
    const res = await apiClient.put('/admin/billing-settings', data);
    return res.data?.data ?? res.data;
  },

  getUpgradeRequests: async (params?: {
    status?: UpgradeRequestStatus;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedUpgradeRequestsResponse> => {
    const res = await apiClient.get('/admin/upgrade-requests', { params });
    const rawData = res.data?.data ?? res.data ?? {};
    const rawItems: any[] = Array.isArray(rawData) ? rawData : (rawData.items ?? []);
    const items = rawItems.map(normalizeRequestItem);
    const total = rawData.total ?? rawData.meta?.total ?? items.length;
    const page = rawData.page ?? rawData.meta?.page ?? params?.page ?? 1;
    const limit = rawData.limit ?? rawData.meta?.limit ?? params?.limit ?? 15;
    const totalPages = rawData.totalPages ?? rawData.meta?.totalPages ?? Math.max(1, Math.ceil(total / limit));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  getUpgradeRequestById: async (id: string): Promise<AdminUpgradeRequestItem> => {
    const res = await apiClient.get(`/admin/upgrade-requests/${id}`);
    const raw = res.data?.data ?? res.data;
    return normalizeRequestItem(raw);
  },

  approveUpgradeRequest: async (
    id: string,
    data: { verifiedBankRef?: string; verifiedBankReference?: string; verifiedAmount: number },
  ): Promise<AdminUpgradeRequestItem> => {
    const payload = {
      verifiedBankReference: data.verifiedBankReference ?? data.verifiedBankRef ?? '',
      verifiedBankRef: data.verifiedBankRef ?? data.verifiedBankReference ?? '',
      verifiedAmount: Number(data.verifiedAmount),
    };
    const res = await apiClient.post(`/admin/upgrade-requests/${id}/approve`, payload);
    const raw = res.data?.data ?? res.data;
    return normalizeRequestItem(raw);
  },

  rejectUpgradeRequest: async (
    id: string,
    data: { reason: string },
  ): Promise<AdminUpgradeRequestItem> => {
    const res = await apiClient.post(`/admin/upgrade-requests/${id}/reject`, data);
    const raw = res.data?.data ?? res.data;
    return normalizeRequestItem(raw);
  },
};
