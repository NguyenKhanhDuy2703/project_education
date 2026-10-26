import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addCalendarMonthsClamped } from '../src/modules/billing/billing.service';
import { EntitlementsService } from '../src/modules/entitlements/entitlements.service';
import { BillingCycle, SubscriptionStatus, UserRole } from '@prisma/client';

describe('Task 3.2: Membership Lifecycle, Calendar-Month Renewal & Entitlements Suite', () => {
  describe('Calendar-month arithmetic with end-of-month clamping', () => {
    it('handles month-end clamping (Jan 31 -> Feb 28 on non-leap year, Jan 31 -> Feb 29 on leap year)', () => {
      // 2026 is non-leap year
      const jan31_2026 = new Date(Date.UTC(2026, 0, 31, 14, 30, 0));
      const feb2026 = addCalendarMonthsClamped(jan31_2026, 1);
      assert.equal(feb2026.getUTCFullYear(), 2026);
      assert.equal(feb2026.getUTCMonth(), 1); // February
      assert.equal(feb2026.getUTCDate(), 28); // Clamped to 28
      assert.equal(feb2026.getUTCHours(), 14);
      assert.equal(feb2026.getUTCMinutes(), 30);

      // 2028 is leap year
      const jan31_2028 = new Date(Date.UTC(2028, 0, 31, 9, 15, 0));
      const feb2028 = addCalendarMonthsClamped(jan31_2028, 1);
      assert.equal(feb2028.getUTCFullYear(), 2028);
      assert.equal(feb2028.getUTCMonth(), 1); // February
      assert.equal(feb2028.getUTCDate(), 29); // Clamped to 29 in leap year
      assert.equal(feb2028.getUTCHours(), 9);
      assert.equal(feb2028.getUTCMinutes(), 15);
    });

    it('handles 31-day to 30-day month rollovers (August 31 -> September 30)', () => {
      const aug31 = new Date(Date.UTC(2026, 7, 31, 18, 0, 0)); // Aug 31
      const sep30 = addCalendarMonthsClamped(aug31, 1);
      assert.equal(sep30.getUTCFullYear(), 2026);
      assert.equal(sep30.getUTCMonth(), 8); // September
      assert.equal(sep30.getUTCDate(), 30); // Clamped to 30
      assert.equal(sep30.getUTCHours(), 18);
    });

    it('handles year-end rollover (December 31 -> January 31 next year)', () => {
      const dec31 = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
      const jan31NextYear = addCalendarMonthsClamped(dec31, 1);
      assert.equal(jan31NextYear.getUTCFullYear(), 2027);
      assert.equal(jan31NextYear.getUTCMonth(), 0); // January
      assert.equal(jan31NextYear.getUTCDate(), 31);
      assert.equal(jan31NextYear.getUTCHours(), 23);
      assert.equal(jan31NextYear.getUTCMinutes(), 59);
      assert.equal(jan31NextYear.getUTCSeconds(), 59);
    });
  });

  describe('Entitlements resolution & access boundaries', () => {
    it('DENY override strictly takes precedence over active Pro subscription', async () => {
      const mockPrisma: any = {
        feature: {
          findUnique: async () => ({ id: 'feat-advanced', code: 'EXECUTE_LAB_ADVANCED', isActive: true }),
        },
        userFeatureOverride: {
          findUnique: async () => ({
            id: 'override-deny-1',
            effect: 'DENY',
            reason: 'Tài khoản vi phạm chính sách',
            expiresAt: null,
          }),
        },
        userSubscription: {
          findFirst: async () => ({
            id: 'sub-active',
            status: SubscriptionStatus.ACTIVE,
            endDate: new Date(Date.now() + 30 * 86400000),
            plan: {
              isActive: true,
              planFeatures: [{ feature: { code: 'EXECUTE_LAB_ADVANCED', isActive: true } }],
            },
          }),
        },
      };

      const entitlementsService = new EntitlementsService(mockPrisma, { log: async () => {} } as any);

      const result = await entitlementsService.checkUserFeature('user-banned', 'EXECUTE_LAB_ADVANCED');
      assert.equal(result.hasAccess, false);
      assert.equal(result.isBanned, true);
      assert.equal(result.provenance?.type, 'DIRECT_OVERRIDE');
    });

    it('stale userPro role does not grant paid access when subscription has expired', async () => {
      const pastDate = new Date(Date.now() - 5 * 86400000); // Expired 5 days ago

      const mockPrisma: any = {
        feature: {
          findUnique: async () => ({ id: 'feat-advanced', code: 'EXECUTE_LAB_ADVANCED', isActive: true }),
        },
        userFeatureOverride: {
          findUnique: async () => null,
        },
        // findFirst will not return expired subscription because of query: OR: [{ endDate: null }, { endDate: { gt: now } }]
        userSubscription: {
          findFirst: async () => null,
        },
        userGroupMember: {
          findMany: async () => [],
        },
        subscriptionPlan: {
          findFirst: async () => ({
            isDefault: true,
            isActive: true,
            planFeatures: [], // Free tier does not have EXECUTE_LAB_ADVANCED
          }),
        },
      };

      const entitlementsService = new EntitlementsService(mockPrisma, { log: async () => {} } as any);

      const result = await entitlementsService.checkUserFeature('user-stale-pro', 'EXECUTE_LAB_ADVANCED');
      assert.equal(result.hasAccess, false);
      assert.equal(result.provenance?.type, 'NONE');
    });

    it('group membership grants Pro when valid without direct subscription', async () => {
      const mockPrisma: any = {
        feature: {
          findUnique: async () => ({ id: 'feat-advanced', code: 'EXECUTE_LAB_ADVANCED', isActive: true }),
        },
        userFeatureOverride: {
          findUnique: async () => null,
        },
        userSubscription: {
          findFirst: async () => null,
        },
        userGroupMember: {
          findMany: async () => [
            {
              group: {
                id: 'grp-vip',
                name: 'VIP Learners',
                isActive: true,
                groupPlans: [
                  {
                    plan: {
                      code: 'PRO_GROUP',
                      isActive: true,
                      planFeatures: [{ feature: { code: 'EXECUTE_LAB_ADVANCED', isActive: true } }],
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      const entitlementsService = new EntitlementsService(mockPrisma, { log: async () => {} } as any);

      const result = await entitlementsService.checkUserFeature('user-vip-group', 'EXECUTE_LAB_ADVANCED');
      assert.equal(result.hasAccess, true);
      assert.equal(result.provenance?.type, 'GROUP_UNION');
      assert.equal(result.provenance?.sourceName, 'VIP Learners');
    });
  });
});
