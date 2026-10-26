import { apiClient } from '@/services/api.client';
import type { PublicPlansResponse, MembershipState, UpgradeRequestRecord } from '../types/billing.types';

export const billingApi = {
  getPublicPlans: async (): Promise<PublicPlansResponse> => {
    const res = await apiClient.get('/plans/public');
    return res.data;
  },

  getMembershipState: async (): Promise<MembershipState> => {
    const res = await apiClient.get('/membership/me');
    return res.data;
  },

  createUpgradeRequest: async (planId: string): Promise<UpgradeRequestRecord> => {
    const res = await apiClient.post('/upgrade-requests', { planId });
    return res.data;
  },

  getMyUpgradeRequests: async (): Promise<UpgradeRequestRecord[]> => {
    const res = await apiClient.get('/upgrade-requests');
    return res.data;
  },

  submitPaymentConfirmation: async (
    requestId: string,
    paymentReference: string,
  ): Promise<UpgradeRequestRecord> => {
    const res = await apiClient.post(`/upgrade-requests/${requestId}/payment-confirmation`, {
      paymentReference,
    });
    return res.data;
  },

  cancelUpgradeRequest: async (requestId: string): Promise<UpgradeRequestRecord> => {
    const res = await apiClient.post(`/upgrade-requests/${requestId}/cancel`);
    return res.data;
  },
};
