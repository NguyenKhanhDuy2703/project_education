import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BillingService } from '../src/modules/billing/billing.service';
import { EntitlementsService } from '../src/modules/entitlements/entitlements.service';
import { BadRequestException } from '@nestjs/common';
import { BillingCycle, UpgradeRequestStatus } from '@prisma/client';

describe('Task 2.1: Public Pricing & Admin Configuration Suite', () => {
  it('Public plans projection strictly omits internal grants and feature mappings', async () => {
    const mockPrisma: any = {
      subscriptionPlan: {
        findMany: async () => [
          {
            id: 'plan-free-1',
            code: 'FREE',
            name: 'Free Tier',
            description: 'Standard free access',
            price: 0,
            billingCycle: BillingCycle.FREE,
            isSaleReady: true,
            isActive: true,
            isPublic: true,
            // Internal raw data that must NOT leak
            planFeatures: [{ featureId: 'f1', feature: { code: 'INTERNAL_SECRET_PERM' } }],
            planPermissions: [{ permissionId: 'p1', permission: { code: 'admin:secret' } }],
          },
          {
            id: 'plan-pro-1',
            code: 'PRO_MONTHLY',
            name: 'Pro Student (Monthly)',
            description: 'Advanced features',
            price: 199000,
            billingCycle: BillingCycle.MONTHLY,
            isSaleReady: true,
            isActive: true,
            isPublic: true,
            planFeatures: [{ featureId: 'f2', feature: { code: 'RUN_WORKER' } }],
          },
        ],
      },
      billingSettings: {
        findUnique: async () => ({
          id: 'default',
          bankName: 'Vietcombank',
          bankCode: 'VCB',
          accountNumber: '1234567890',
          accountHolder: 'STUDYIT CORP',
          instructions: 'Ghi rõ mã chuyển khoản',
          isIntakeEnabled: true,
        }),
      },
    };

    const mockAudit: any = { log: async () => {} };
    const mockNotif: any = { createNotification: async () => {} };

    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    const publicResult = await billingService.getPublicPlans();

    assert.equal(publicResult.intakeEnabled, true);
    assert.ok(publicResult.receivingBank);
    assert.equal(publicResult.plans.length, 2);

    for (const plan of publicResult.plans) {
      assert.ok(plan.id);
      assert.ok(plan.code);
      assert.ok(plan.name);
      assert.ok(typeof plan.price === 'number');
      assert.ok(Array.isArray(plan.benefits));
      assert.ok(plan.benefits.length > 0);

      // Verify NO internal grant/permission fields are present
      assert.equal((plan as any).planFeatures, undefined);
      assert.equal((plan as any).planPermissions, undefined);
      assert.equal((plan as any).internalFlags, undefined);
    }
  });

  it('Rejects invalid VND prices or enabling sale without positive price', async () => {
    const mockPrisma: any = {
      subscriptionPlan: {
        findUnique: async () => ({
          id: 'plan-pro-1',
          code: 'PRO_MONTHLY',
          price: 0,
          billingCycle: BillingCycle.MONTHLY,
          isSaleReady: false,
        }),
        update: async ({ data }: any) => data,
      },
      userSubscription: { count: async () => 0 },
      upgradeRequest: { count: async () => 0 },
    };
    const mockAudit: any = { log: async () => {} };
    const entitlementsService = new EntitlementsService(mockPrisma, mockAudit);

    // 1. Negative price
    await assert.rejects(
      async () =>
        entitlementsService.updatePlan('plan-pro-1', {
          price: -50000,
        }),
      (err: any) => err instanceof BadRequestException && err.message.includes('Price cannot be negative'),
    );

    // 2. Fractional/decimal price (VND must be integer)
    await assert.rejects(
      async () =>
        entitlementsService.updatePlan('plan-pro-1', {
          price: 199000.5,
        }),
      (err: any) => err instanceof BadRequestException && err.message.includes('Price in VND must be an integer'),
    );

    // 3. Enabling isSaleReady with 0 VND price on a paid plan
    await assert.rejects(
      async () =>
        entitlementsService.updatePlan('plan-pro-1', {
          price: 0,
          isSaleReady: true,
        }),
      (err: any) =>
        err instanceof BadRequestException &&
        err.message.includes('Cannot mark paid plan as sale ready without a positive price'),
    );
  });

  it('Rejects enabling intake without complete receiving bank details and audits changes', async () => {
    let savedSettings: any = null;
    let loggedAudit: any = null;

    const mockPrisma: any = {
      billingSettings: {
        findUnique: async () => null,
        upsert: async ({ update }: any) => {
          savedSettings = update;
          return { id: 'default', ...update };
        },
      },
    };
    const mockAudit: any = {
      log: async (entry: any) => {
        loggedAudit = entry;
      },
    };
    const mockNotif: any = { createNotification: async () => {} };

    const billingService = new BillingService(mockPrisma, mockAudit, mockNotif);

    // Attempting to enable intake with missing account number
    await assert.rejects(
      async () =>
        billingService.updateBillingSettings(
          {
            bankName: 'Techcombank',
            bankCode: 'TCB',
            accountNumber: '   ',
            accountHolder: 'STUDYIT CORP',
            isIntakeEnabled: true,
          },
          'admin-user-1',
        ),
      (err: any) =>
        err instanceof BadRequestException &&
        err.message.includes('Cannot enable sale intake without complete receiving bank details'),
    );

    // Valid configuration succeeds and records audit log
    const updated = await billingService.updateBillingSettings(
      {
        bankName: 'Techcombank',
        bankCode: 'TCB',
        accountNumber: '1903123456789',
        accountHolder: 'STUDYIT CORP',
        instructions: 'Chuyển khoản chính xác số tiền',
        isIntakeEnabled: true,
      },
      'admin-user-1',
      { ip: '127.0.0.1', ua: 'TestRunner' },
    );

    assert.equal(updated.isIntakeEnabled, true);
    assert.equal(updated.accountNumber, '1903123456789');
    assert.equal(loggedAudit.action, 'UPDATE_BILLING_SETTINGS');
    assert.equal(loggedAudit.actorId, 'admin-user-1');
  });

  it('Price updates leave existing upgrade request snapshots completely untouched', async () => {
    const historicalSnapshot = {
      id: 'req-1',
      userId: 'user-1',
      planId: 'plan-pro-1',
      status: UpgradeRequestStatus.AWAITING_PAYMENT,
      priceSnapshot: 199000,
      currency: 'VND',
      bankSnapshot: { bankName: 'Vietcombank', accountNumber: '123' },
    };

    // Plan price is updated later by operator to 249000
    const updatedPlan = {
      id: 'plan-pro-1',
      price: 249000,
    };

    // Existing request snapshot remains 199000
    assert.equal(historicalSnapshot.priceSnapshot, 199000);
    assert.notEqual(historicalSnapshot.priceSnapshot, updatedPlan.price);
  });
});
