import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { SetFeatureOverrideDto } from './dto/set-feature-override.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Evaluate whether a user has access to a specific feature.
   * Priority: Explicit DENY > Direct User ALLOW > Direct Subscription Plan > IAM Group Union Plans > Default Free Plan.
   */
  async checkUserFeature(
    userId: string,
    featureCode: string,
  ): Promise<{
    hasAccess: boolean;
    isBanned: boolean;
    reason?: string;
    provenance?: {
      type: 'DIRECT_OVERRIDE' | 'DIRECT_SUBSCRIPTION' | 'GROUP_UNION' | 'DEFAULT_FREE' | 'NONE';
      sourceId?: string;
      sourceName?: string;
      planCode?: string;
    };
  }> {
    const now = new Date();

    // 1. Check feature existence
    const feature = await this.prisma.feature.findUnique({
      where: { code: featureCode },
    });
    if (!feature || !feature.isActive) {
      return {
        hasAccess: false,
        isBanned: false,
        reason: 'Feature not found or inactive',
        provenance: { type: 'NONE' },
      };
    }

    // 2. Step 1: Check User-Level Overrides
    const override = await this.prisma.userFeatureOverride.findUnique({
      where: {
        userId_featureId: {
          userId,
          featureId: feature.id,
        },
      },
    });

    if (override) {
      const isExpired = override.expiresAt && override.expiresAt < now;
      if (!isExpired) {
        if (override.effect === 'DENY') {
          return {
            hasAccess: false,
            isBanned: true,
            reason: override.reason || 'This feature has been suspended on your account',
            provenance: { type: 'DIRECT_OVERRIDE', sourceId: override.id },
          };
        }
        if (override.effect === 'ALLOW') {
          return {
            hasAccess: true,
            isBanned: false,
            provenance: { type: 'DIRECT_OVERRIDE', sourceId: override.id },
          };
        }
      }
    }

    // 3. Step 2: Check Active Direct User Subscription Plan
    const activeSubscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: {
        plan: {
          include: {
            planFeatures: {
              include: { feature: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSubscription && activeSubscription.plan?.isActive) {
      const hasPlanFeature = activeSubscription.plan.planFeatures.some(
        (pf) => pf.feature.code === featureCode && pf.feature.isActive,
      );
      if (hasPlanFeature) {
        return {
          hasAccess: true,
          isBanned: false,
          provenance: {
            type: 'DIRECT_SUBSCRIPTION',
            sourceId: activeSubscription.id,
            planCode: activeSubscription.plan.code,
          },
        };
      }
    }

    // 4. Step 3: Check IAM Group Union (All active groups user belongs to)
    const userGroupMemberships = await this.prisma.userGroupMember.findMany({
      where: {
        userId,
        group: { isActive: true },
      },
      include: {
        group: {
          include: {
            groupPlans: {
              include: {
                plan: {
                  include: {
                    planFeatures: {
                      include: { feature: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const membership of userGroupMemberships) {
      for (const gp of membership.group.groupPlans) {
        if (gp.plan.isActive) {
          const hasGroupPlanFeature = gp.plan.planFeatures.some(
            (pf) => pf.feature.code === featureCode && pf.feature.isActive,
          );
          if (hasGroupPlanFeature) {
            return {
              hasAccess: true,
              isBanned: false,
              provenance: {
                type: 'GROUP_UNION',
                sourceId: membership.group.id,
                sourceName: membership.group.name,
                planCode: gp.plan.code,
              },
            };
          }
        }
      }
    }

    // 5. Step 4: Fallback to Default Free Plan
    const defaultPlan = await this.prisma.subscriptionPlan.findFirst({
      where: { isDefault: true, isActive: true },
      include: {
        planFeatures: {
          include: { feature: true },
        },
      },
    });

    if (defaultPlan) {
      const hasDefaultFeature = defaultPlan.planFeatures.some(
        (pf) => pf.feature.code === featureCode && pf.feature.isActive,
      );
      if (hasDefaultFeature) {
        return {
          hasAccess: true,
          isBanned: false,
          provenance: {
            type: 'DEFAULT_FREE',
            sourceId: defaultPlan.id,
            planCode: defaultPlan.code,
          },
        };
      }
    }

    return {
      hasAccess: false,
      isBanned: false,
      reason: 'This feature requires an active upgraded subscription plan or group membership',
      provenance: { type: 'NONE' },
    };
  }

  /**
   * Retrieve full entitlement summary for a specific user, including
   * IAM Group Union, Provenance breakdown, and Effective Permissions.
   */
  async getUserEntitlements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                groupPlans: {
                  include: {
                    plan: {
                      include: {
                        planFeatures: { include: { feature: true } },
                        planPermissions: { include: { permission: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const now = new Date();

    // 1. Active direct subscription
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: {
        plan: {
          include: {
            planFeatures: {
              include: { feature: true },
            },
            planPermissions: {
              include: { permission: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Overrides
    const overrides = await this.prisma.userFeatureOverride.findMany({
      where: { userId },
      include: { feature: true },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Extract Group Memberships
    const groups = user.groupMemberships.map((gm) => ({
      groupId: gm.group.id,
      groupCode: gm.group.code,
      groupName: gm.group.name,
      isActive: gm.group.isActive,
      joinedAt: gm.createdAt,
      plans: gm.group.groupPlans.map((gp) => ({
        planId: gp.plan.id,
        planCode: gp.plan.code,
        planName: gp.plan.name,
      })),
    }));

    // 4. Effective Permissions Union (From direct plan + all active group plans)
    const effectivePermissionCodes = new Set<string>();
    if (subscription?.plan?.planPermissions) {
      for (const pp of subscription.plan.planPermissions) {
        effectivePermissionCodes.add(pp.permission.code);
      }
    }
    for (const gm of user.groupMemberships) {
      if (gm.group.isActive) {
        for (const gp of gm.group.groupPlans) {
          if (gp.plan.isActive && gp.plan.planPermissions) {
            for (const pp of gp.plan.planPermissions) {
              effectivePermissionCodes.add(pp.permission.code);
            }
          }
        }
      }
    }

    // 5. All platform features to compute effective status & provenance
    const allFeatures = await this.prisma.feature.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });

    const evaluatedFeatures = await Promise.all(
      allFeatures.map(async (f) => {
        const result = await this.checkUserFeature(userId, f.code);
        return {
          featureId: f.id,
          code: f.code,
          name: f.name,
          category: f.category,
          hasAccess: result.hasAccess,
          isBanned: result.isBanned,
          reason: result.reason,
          provenance: result.provenance,
        };
      }),
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      currentSubscription: subscription
        ? {
            id: subscription.id,
            planCode: subscription.plan.code,
            planName: subscription.plan.name,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
          }
        : null,
      groups,
      effectivePermissions: Array.from(effectivePermissionCodes),
      overrides: overrides.map((o) => ({
        id: o.id,
        featureCode: o.feature.code,
        featureName: o.feature.name,
        effect: o.effect,
        reason: o.reason,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
      })),
      effectiveFeatures: evaluatedFeatures,
    };
  }

  /**
   * Assign or upgrade a user's subscription plan.
   */
  async assignSubscription(
    adminId: string,
    userId: string,
    dto: AssignSubscriptionDto,
    meta?: { ip?: string; ua?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const now = new Date();
    const endDate = dto.durationDays
      ? new Date(now.getTime() + dto.durationDays * 86400000)
      : null;

    // Terminate existing active subscriptions
    await this.prisma.userSubscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    const newSub = await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        endDate,
      },
    });

    // Record audit log
    await this.auditLogsService.log({
      actorId: adminId,
      targetUserId: userId,
      action: 'ASSIGN_SUBSCRIPTION',
      details: {
        planCode: plan.code,
        planName: plan.name,
        durationDays: dto.durationDays ?? 'unlimited',
        reason: dto.reason || 'Manual administrative plan assignment',
      },
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return newSub;
  }

  /**
   * Set or update an explicit feature override (ALLOW or DENY).
   */
  async setFeatureOverride(
    adminId: string,
    userId: string,
    dto: SetFeatureOverrideDto,
    meta?: { ip?: string; ua?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const feature = await this.prisma.feature.findUnique({ where: { code: dto.featureCode } });
    if (!feature) throw new NotFoundException(`Feature "${dto.featureCode}" not found`);

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const override = await this.prisma.userFeatureOverride.upsert({
      where: {
        userId_featureId: {
          userId,
          featureId: feature.id,
        },
      },
      update: {
        effect: dto.effect,
        reason: dto.reason,
        expiresAt,
        createdBy: adminId,
      },
      create: {
        userId,
        featureId: feature.id,
        effect: dto.effect,
        reason: dto.reason,
        expiresAt,
        createdBy: adminId,
      },
    });

    // Record audit log
    await this.auditLogsService.log({
      actorId: adminId,
      targetUserId: userId,
      action: dto.effect === 'DENY' ? 'FEATURE_OVERRIDE_DENY' : 'FEATURE_OVERRIDE_ALLOW',
      details: {
        featureCode: feature.code,
        featureName: feature.name,
        effect: dto.effect,
        reason: dto.reason,
        expiresAt,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return override;
  }

  /**
   * Remove a feature override, restoring normal plan-level resolution.
   */
  async removeFeatureOverride(
    adminId: string,
    userId: string,
    featureCode: string,
    meta?: { ip?: string; ua?: string },
  ) {
    const feature = await this.prisma.feature.findUnique({ where: { code: featureCode } });
    if (!feature) throw new NotFoundException(`Feature "${featureCode}" not found`);

    const deleted = await this.prisma.userFeatureOverride.deleteMany({
      where: { userId, featureId: feature.id },
    });

    if (deleted.count > 0) {
      await this.auditLogsService.log({
        actorId: adminId,
        targetUserId: userId,
        action: 'FEATURE_OVERRIDE_RESET',
        details: {
          featureCode: feature.code,
          featureName: feature.name,
        },
        ipAddress: meta?.ip,
        userAgent: meta?.ua,
      });
    }

    return { message: `Override for ${featureCode} successfully removed` };
  }

  // ── Plan & Feature Registry Management ─────────────────────────────────────

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        planFeatures: {
          include: { feature: true },
        },
        _count: { select: { subscriptions: true } },
      },
    });
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Plan with code "${dto.code}" already exists`);
    }

    if (dto.isDefault) {
      await this.prisma.subscriptionPlan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async updatePlanFeatures(planId: string, featureIds: string[]) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // Remove old mappings
    await this.prisma.planFeature.deleteMany({ where: { planId } });

    // Insert new mappings
    if (featureIds.length > 0) {
      await this.prisma.planFeature.createMany({
        data: featureIds.map((featureId) => ({ planId, featureId })),
      });
    }

    return this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { planFeatures: { include: { feature: true } } },
    });
  }

  async findAllFeatures() {
    return this.prisma.feature.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async createFeature(dto: CreateFeatureDto) {
    const existing = await this.prisma.feature.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Feature with code "${dto.code}" already exists`);
    }

    return this.prisma.feature.create({ data: dto });
  }
}
