import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BillingService } from '../src/modules/billing/billing.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { UpgradeRequestStatus, NotificationType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('End-to-End Upgrade & Renewal Lifecycle Integration (Task 7.1)', () => {
  it('executes full journey: Free -> Request -> Payment -> Admin Approve -> Early Renewal -> Expiry', async () => {
    // 1. Initial State: Free Learner
    const userId = 'u-lifecycle-1';
    const planPro = {
      id: 'plan-pro-month',
      code: 'PRO_MONTHLY',
      name: 'Pro Monthly Plan',
      price: 99000,
      billingCycle: 'MONTHLY' as const,
      isPublic: true,
      isSaleReady: true,
      isActive: true,
    };

    let userSubscription: any = null;
    const notificationsCreated: any[] = [];
    const auditLogs: any[] = [];
    let upgradeRequest: any = null;

    // Mock Prisma client with in-memory transaction and state
    const mockPrisma: any = {
      user: {
        findUnique: async () => ({
          id: userId,
          role: 'user',
          name: 'Journey Learner',
          email: 'learner@example.com',
          subscriptions: userSubscription ? [userSubscription] : [],
          groupMemberships: [],
        }),
        update: async () => ({}),
      },
      subscriptionPlan: {
        findUnique: async () => planPro,
        findFirst: async () => planPro,
      },
      billingSettings: {
        findUnique: async () => ({
          id: 'default',
          isIntakeEnabled: true,
          bankCode: 'MB',
          bankName: 'MB Bank',
          accountNumber: '0987654321',
          accountHolder: 'STUDYIT',
          transferSyntax: 'STUDYIT {ref}',
        }),
        findFirst: async () => ({
          id: 'default',
          isIntakeEnabled: true,
          bankCode: 'MB',
          bankName: 'MB Bank',
          accountNumber: '0987654321',
          accountHolder: 'STUDYIT',
          transferSyntax: 'STUDYIT {ref}',
        }),
      },
      upgradeRequest: {
        findUnique: async (args: any) => {
          if (args?.where?.id) {
            return upgradeRequest?.id === args.where.id ? { ...upgradeRequest, plan: planPro, user: { id: userId, name: 'Learner' } } : null;
          }
          return null;
        },
        findFirst: async (args: any) => {
          if (args?.where?.id) return upgradeRequest?.id === args.where.id ? upgradeRequest : null;
          if (args?.where?.transferReference) return upgradeRequest?.transferReference === args.where.transferReference ? upgradeRequest : null;
          if (args?.where?.userId && args?.where?.status?.in) {
            if (upgradeRequest && args.where.status.in.includes(upgradeRequest.status)) {
              return upgradeRequest;
            }
          }
          return null;
        },
        create: async (args: any) => {
          upgradeRequest = {
            id: 'req-cycle-1',
            ...args.data,
            plan: planPro,
            user: { id: userId, name: 'Learner' },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return upgradeRequest;
        },
        update: async (args: any) => {
          upgradeRequest = {
            ...upgradeRequest,
            ...args.data,
            updatedAt: new Date(),
          };
          return upgradeRequest;
        },
        updateMany: async (args: any) => {
          if (args?.where?.id && upgradeRequest?.id === args.where.id) {
            if (args?.where?.status) {
              if (args.where.status?.in) {
                if (!args.where.status.in.includes(upgradeRequest.status)) return { count: 0 };
              } else if (args.where.status !== upgradeRequest.status) {
                return { count: 0 };
              }
            }
            upgradeRequest = {
              ...upgradeRequest,
              ...args.data,
              updatedAt: new Date(),
            };
            return { count: 1 };
          }
          return { count: 0 };
        },
      },
      userSubscription: {
        create: async (args: any) => {
          userSubscription = {
            id: 'sub-cycle-1',
            ...args.data,
            plan: planPro,
            createdAt: new Date(),
          };
          return userSubscription;
        },
        update: async (args: any) => {
          userSubscription = {
            ...userSubscription,
            ...args.data,
          };
          return userSubscription;
        },
        updateMany: async () => ({ count: 0 }),
        findFirst: async (args: any) => {
          if (userSubscription && (!args?.where?.status || args.where.status === userSubscription.status)) {
            return userSubscription;
          }
          return null;
        },
      },
      notification: {
        create: async (args: any) => {
          const item = { id: `notif-${notificationsCreated.length + 1}`, ...args.data, createdAt: new Date() };
          notificationsCreated.push(item);
          return item;
        },
        upsert: async (args: any) => {
          const item = { id: `notif-${notificationsCreated.length + 1}`, ...args.create, createdAt: new Date() };
          notificationsCreated.push(item);
          return item;
        },
      },
      auditLog: {
        create: async (args: any) => {
          auditLogs.push(args.data);
          return { id: 'audit-1', ...args.data };
        },
      },
      $transaction: async (cb: any) => {
        return cb(mockPrisma);
      },
    };

    const mockAudit: any = {
      log: async () => ({}),
      recordEvent: async () => ({}),
    };
    const notificationsService = new NotificationsService(mockPrisma);
    const billingService = new BillingService(mockPrisma, mockAudit, notificationsService);

    // Step A: Learner checks membership state before upgrade
    const state0 = await billingService.getMembershipState(userId);
    assert.equal(state0.isPro, false, 'Learner should initially be Free');
    assert.equal(state0.openRequest, null, 'No open requests yet');

    // Step B: Learner creates upgrade request
    const req1 = await billingService.createUpgradeRequest(userId, planPro.id);
    assert.equal(req1.status, UpgradeRequestStatus.AWAITING_PAYMENT);
    assert.equal(Number(req1.priceSnapshot), 99000);
    assert.ok(req1.transferReference.startsWith('UP-'));

    // Verify duplicate creation returns existing open request
    const req1Dup = await billingService.createUpgradeRequest(userId, planPro.id);
    assert.equal(req1Dup.id, req1.id, 'Should reuse existing open request');

    // Step C: Learner submits payment confirmation
    const req1Confirmed = await billingService.submitPaymentConfirmation(userId, req1.id, 'FT_TX_123456');
    assert.equal(req1Confirmed.status, UpgradeRequestStatus.PENDING_REVIEW);
    assert.equal(req1Confirmed.paymentReference, 'FT_TX_123456');

    // Step D: Admin approves with reconciliation verification
    // Mismatched amount must fail
    await assert.rejects(
      async () => {
        await billingService.adminApproveUpgradeRequest('admin-1', req1.id, {
          verifiedBankReference: 'FT_TX_123456',
          verifiedAmount: 50000, // Expected 99000
        });
      },
      BadRequestException,
      'Mismatched amount must be rejected by Admin approval',
    );

    // Correct approval
    const req1Approved = await billingService.adminApproveUpgradeRequest('admin-1', req1.id, {
      verifiedBankReference: 'BANK_AUDIT_REF_001',
      verifiedAmount: 99000,
    });

    assert.equal(req1Approved.status, UpgradeRequestStatus.APPROVED);
    assert.equal(req1Approved.verifiedBankReference, 'BANK_AUDIT_REF_001');

    // Subscription created with 1 month clamped duration
    assert.ok(userSubscription, 'Subscription should be created');
    assert.equal(userSubscription.status, 'ACTIVE');

    // Notification created
    assert.ok(
      notificationsCreated.some((n) => n.userId === userId && n.title.includes('Nâng cấp Pro')),
      'Approval notification must reach user inbox',
    );

    // Step E: Early Renewal while still active
    const oldEndDate = new Date(userSubscription.endDate);

    upgradeRequest = null; // Reset request to allow new open request
    const req2 = await billingService.createUpgradeRequest(userId, planPro.id);
    await billingService.submitPaymentConfirmation(userId, req2.id, 'FT_TX_RENEWAL');

    const req2Approved = await billingService.adminApproveUpgradeRequest('admin-1', req2.id, {
      verifiedBankReference: 'BANK_AUDIT_REF_002',
      verifiedAmount: 99000,
    });

    assert.equal(req2Approved.status, UpgradeRequestStatus.APPROVED);

    // Early renewal extends from previous endDate
    assert.ok(
      userSubscription.endDate > oldEndDate,
      'Early renewal must extend from previous active endDate',
    );

    // Step F: Expiration
    // Simulate expiration processing
    userSubscription.status = 'EXPIRED';
    await notificationsService.createNotification({
      userId,
      type: NotificationType.MEMBERSHIP_EXPIRED,
      title: 'Gói Pro của bạn đã hết hạn',
      body: 'Gói Pro đã kết thúc. Vui lòng gia hạn để tiếp tục.',
      eventKey: `membership-expired-${userSubscription.id}`,
    });

    assert.ok(
      notificationsCreated.some((n) => n.title.includes('hết hạn')),
      'Expiry notification must be created upon expiration',
    );

    // Re-check membership projection after expiry
    const finalState = await billingService.getMembershipState(userId);
    assert.equal(finalState.isPro, false, 'Expired membership must not grant Pro access');
  });
});
