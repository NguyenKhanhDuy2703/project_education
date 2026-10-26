export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingCycle: string;
  isSaleReady: boolean;
  isAvailableForPurchase: boolean;
  benefits: string[];
}

export interface ReceivingBankInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string | null;
}

export interface PublicPlansResponse {
  intakeEnabled: boolean;
  receivingBank: ReceivingBankInfo | null;
  plans: PublicPlan[];
}

export interface UpgradeRequestRecord {
  id: string;
  userId: string;
  planId: string;
  status: 'AWAITING_PAYMENT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  transferReference: string;
  priceSnapshot: number;
  currency: string;
  period: string;
  bankSnapshot: ReceivingBankInfo;
  paymentReference: string | null;
  paymentSubmittedAt: string | null;
  reviewReason: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: PublicPlan;
}

export interface MembershipState {
  userId: string;
  isPro: boolean;
  provenance: string;
  planName: string;
  planCode: string;
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  canPurchase: boolean;
  purchaseIneligibilityReason: string | null;
  openRequest: UpgradeRequestRecord | null;
}
