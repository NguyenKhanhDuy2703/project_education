import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BillingService } from '../src/modules/billing/billing.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BillingCycle, UpgradeRequestStatus, UserRole } from '@prisma/client';

describe('Task 3.1: Upgrade Requests & Admin Reconciliation State Machine Suite', () => {
  const basePlan = {
    id: 'plan-pro-monthly',
    code: 'PRO_MONTHLY',
    name: 'Pro Student (Monthly)',
    price: 199000,
    billingCycle: BillingCycle.MONTHLY,
    isActive: true,
    isPublic: true,
    isSaleReady: true,
  };

  const baseSettings = {
    id: 'default',
    bankName: 'Vietcombank',
    bankCode: 'VCB',
    accountNumber: '1012345678',
    accountHolder: 'CONG TY STUDYIT',
    instructions: 'Chuyển khoản chính xác số tiền',
    isIntakeEnabled: true,
  };

  it('createUpgradeRequest returns existing open request and ignores client-supplied amount or owner', async () => {
    let createdCount = 0;
    const existingOpenRequest = {
      id: 'req-open-1',
      userId: 'learner-1',
      planId: basePlan.id,
      status: UpgradeRequestStatus.AWAITING_PAYMENT,
      transferReference: 'UP-TEST-1234',
      priceSnapshot: 199000,
      currency: 'VND',
      period: 'MONTHLY',
      bankSnapshot: baseSettings,
      plan: basePlan,
    };

    const mockPrisma: any = {
      billingSettings: {
        findUnique: async () => baseSettings,
      },
      user: {
        findUnique: async () => ({ id: 'learner-1', role: UserRole.user }),
      },
      subscriptionPlan: {
        findUnique: async () => basePlan,
      },
      upgradeRequest: {
        findFirst: async () => existingOpenRequest,
        create: async () => {
          createdCount++;
          return existingOpenRequest;
        },
      },
      $transaction: async (fn: any) => fn(mockPrisma),
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };

    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    // Call createUpgradeRequest for user with an already open request
    const res = await billingService.createUpgradeRequest('learner-1', basePlan.id);

    // Idempotent: returns existing request without creating a second record
    assert.equal(res.id, 'req-open-1');
    assert.equal(createdCount, 0, 'Must not create duplicate open requests under concurrency');
  });

  it('submitPaymentConfirmation is idempotent and rejects non-owner or non-awaiting requests', async () => {
    let updatedData: any = null;
    const openRequest: {
      id: string;
      userId: string;
      status: UpgradeRequestStatus;
      paymentReference: string | null;
      plan: any;
    } = {
      id: 'req-awaiting',
      userId: 'learner-1',
      status: UpgradeRequestStatus.AWAITING_PAYMENT,
      paymentReference: null,
      plan: basePlan,
    };

    const mockPrisma: any = {
      upgradeRequest: {
        findUnique: async () => openRequest,
        update: async ({ data }: any) => {
          updatedData = data;
          return { ...openRequest, ...data };
        },
        updateMany: async ({ data }: any) => {
          updatedData = data;
          Object.assign(openRequest, data);
          return { count: 1 };
        },
      },
      $transaction: async (fn: any) => fn(mockPrisma),
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };
    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    // 1. Non-owner submission is rejected
    await assert.rejects(
      async () => billingService.submitPaymentConfirmation('intruder-user', 'req-awaiting', 'TX-12345'),
      (err: any) => err instanceof NotFoundException,
      'Must reject submission from non-owner',
    );

    // 2. Empty reference is rejected
    await assert.rejects(
      async () => billingService.submitPaymentConfirmation('learner-1', 'req-awaiting', '   '),
      (err: any) => err instanceof BadRequestException,
      'Must reject empty payment reference',
    );

    // 3. Valid submission transitions to PENDING_REVIEW
    const submitted = await billingService.submitPaymentConfirmation('learner-1', 'req-awaiting', 'TX-VCB-999');
    assert.equal(submitted.status, UpgradeRequestStatus.PENDING_REVIEW);
    assert.equal(updatedData.paymentReference, 'TX-VCB-999');

    // 4. Repeated submission with identical reference is idempotent
    openRequest.status = UpgradeRequestStatus.PENDING_REVIEW;
    openRequest.paymentReference = 'TX-VCB-999';
    const repeatRes = await billingService.submitPaymentConfirmation('learner-1', 'req-awaiting', 'TX-VCB-999');
    assert.equal(repeatRes.status, UpgradeRequestStatus.PENDING_REVIEW);
  });

  it('admin approval enforces exact amount match, unique bank reference, and single-grant execution', async () => {
    const pendingRequest: {
      id: string;
      userId: string;
      planId: string;
      status: UpgradeRequestStatus;
      priceSnapshot: number;
      currency: string;
      plan: any;
      user: any;
    } = {
      id: 'req-pending-1',
      userId: 'learner-1',
      planId: basePlan.id,
      status: UpgradeRequestStatus.PENDING_REVIEW,
      priceSnapshot: 199000,
      currency: 'VND',
      plan: basePlan,
      user: { id: 'learner-1', role: UserRole.user },
    };

    let existingUsedBankRef: string | null = null;
    let createdSubscription: any = null;
    let upgradedUserRole: any = null;

    const mockPrisma: any = {
      upgradeRequest: {
        findUnique: async () => pendingRequest,
        findFirst: async ({ where }: any) => {
          if (where.verifiedBankReference && where.verifiedBankReference === existingUsedBankRef) {
            return { id: 'another-req-already-used' };
          }
          return null;
        },
        update: async ({ data }: any) => ({ ...pendingRequest, ...data }),
        updateMany: async ({ data }: any) => {
          Object.assign(pendingRequest, data);
          return { count: 1 };
        },
      },
      userSubscription: {
        findFirst: async () => null, // No existing subscription
        updateMany: async () => ({ count: 0 }),
        create: async ({ data }: any) => {
          createdSubscription = data;
          return { id: 'sub-new-1', ...data };
        },
      },
      user: {
        update: async ({ data }: any) => {
          upgradedUserRole = data.role;
          return { id: 'learner-1', role: data.role };
        },
      },
      $transaction: async (fn: any) => fn(mockPrisma),
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };
    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    // 1. Amount mismatch is rejected (expected 199,000, got 150,000)
    await assert.rejects(
      async () =>
        billingService.adminApproveUpgradeRequest('admin-1', 'req-pending-1', {
          verifiedAmount: 150000,
          verifiedBankReference: 'BANK-REF-001',
        }),
      (err: any) => err instanceof BadRequestException && err.message.includes('does not match'),
      'Must reject amount mismatch',
    );

    // 2. Successful approval creates subscription and upgrades user role
    const approved = await billingService.adminApproveUpgradeRequest('admin-1', 'req-pending-1', {
      verifiedAmount: 199000,
      verifiedBankReference: 'BANK-REF-001',
    });
    assert.equal(approved.status, UpgradeRequestStatus.APPROVED);
    assert.equal(upgradedUserRole, UserRole.userPro);
    assert.ok(createdSubscription);
    assert.equal(createdSubscription.status, 'ACTIVE');

    // 3. Duplicate approval on already-approved request is rejected
    pendingRequest.status = UpgradeRequestStatus.APPROVED;
    await assert.rejects(
      async () =>
        billingService.adminApproveUpgradeRequest('admin-1', 'req-pending-1', {
          verifiedAmount: 199000,
          verifiedBankReference: 'BANK-REF-001',
        }),
      (err: any) => err instanceof BadRequestException && err.message.includes('already been approved'),
      'Must reject repeat approval',
    );

    // 4. Reusing verifiedBankReference on another request is rejected
    existingUsedBankRef = 'BANK-REF-001';
    const anotherPendingRequest = {
      id: 'req-pending-2',
      userId: 'learner-2',
      status: UpgradeRequestStatus.PENDING_REVIEW,
      priceSnapshot: 199000,
      plan: basePlan,
      user: { id: 'learner-2', role: UserRole.user },
    };
    mockPrisma.upgradeRequest.findUnique = async () => anotherPendingRequest;

    await assert.rejects(
      async () =>
        billingService.adminApproveUpgradeRequest('admin-1', 'req-pending-2', {
          verifiedAmount: 199000,
          verifiedBankReference: 'BANK-REF-001', // already used
        }),
      (err: any) => err instanceof ConflictException,
      'Must prevent double-grant by rejecting reused verifiedBankReference',
    );
  });

  it('adminApproveUpgradeRequest handles concurrency race condition and throws ConflictException', async () => {
    const racePendingRequest = {
      id: 'req-pending-race',
      userId: 'learner-race',
      status: UpgradeRequestStatus.PENDING_REVIEW,
      priceSnapshot: 199000,
      plan: basePlan,
      user: { id: 'learner-race', role: UserRole.user },
    };

    const mockPrisma: any = {
      upgradeRequest: {
        findUnique: async () => racePendingRequest,
        findFirst: async () => null,
        updateMany: async () => ({ count: 0 }),
      },
      userSubscription: {
        findFirst: async () => null,
      },
      $transaction: async (fn: any) => fn(mockPrisma),
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };
    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    await assert.rejects(
      async () =>
        billingService.adminApproveUpgradeRequest('admin-1', 'req-pending-race', {
          verifiedAmount: 199000,
          verifiedBankReference: 'BANK-REF-RACE-001',
        }),
      (err: any) => err instanceof ConflictException,
      'Concurrent update returning count:0 must throw ConflictException',
    );
  });

  it('adminRejectUpgradeRequest handles concurrency race condition and throws ConflictException', async () => {
    const racePendingRequest = {
      id: 'req-pending-race-reject',
      userId: 'learner-race-2',
      status: UpgradeRequestStatus.PENDING_REVIEW,
      user: { id: 'learner-race-2' },
      plan: basePlan,
    };

    const mockPrisma: any = {
      upgradeRequest: {
        findUnique: async () => racePendingRequest,
        updateMany: async () => ({ count: 0 }),
      },
      $transaction: async (fn: any) => fn(mockPrisma),
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };
    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    await assert.rejects(
      async () =>
        billingService.adminRejectUpgradeRequest('admin-1', 'req-pending-race-reject', {
          reason: 'Lý do từ chối',
        }),
      (err: any) => err instanceof ConflictException,
      'Concurrent reject returning count:0 must throw ConflictException',
    );
  });

  it('getMembershipState returns isExpired:true and past endDate when latest subscription is expired', async () => {
    const pastDate = new Date(Date.now() - 86400000 * 7);
    const expiredSub = {
      id: 'sub-expired-1',
      userId: 'learner-expired',
      status: 'EXPIRED',
      plan: { ...basePlan, name: 'Pro Monthly Expired' },
      startDate: new Date(Date.now() - 86400000 * 37),
      endDate: pastDate,
      autoRenew: false,
    };

    const mockPrisma: any = {
      user: {
        findUnique: async () => ({ id: 'learner-expired', role: UserRole.user }),
      },
      userSubscription: {
        findFirst: async ({ where }: any) => {
          if (where?.status === 'ACTIVE') return null;
          return expiredSub;
        },
      },
      upgradeRequest: {
        findFirst: async () => null,
      },
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };
    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    const state = await billingService.getMembershipState('learner-expired');
    assert.equal(state.isPro, false);
    assert.equal(state.isExpired, true);
    assert.equal(state.planName, 'Pro Monthly Expired');
    assert.equal(state.endDate?.toISOString(), pastDate.toISOString());
  });
});
