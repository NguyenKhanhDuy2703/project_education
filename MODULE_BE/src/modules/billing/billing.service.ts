import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BillingCycle,
  NotificationType,
  Prisma,
  SubscriptionStatus,
  UpgradeRequestStatus,
  UserRole,
} from '@prisma/client';
import { UpdateBillingSettingsDto } from './dto/update-billing-settings.dto';
import { ApproveUpgradeRequestDto } from './dto/approve-request.dto';
import { RejectUpgradeRequestDto } from './dto/reject-request.dto';

export function addCalendarMonthsClamped(baseDate: Date, months: number): Date {
  const result = new Date(baseDate.getTime());
  const origYear = result.getUTCFullYear();
  const origMonth = result.getUTCMonth();
  const origDay = result.getUTCDate();
  const origHours = result.getUTCHours();
  const origMinutes = result.getUTCMinutes();
  const origSeconds = result.getUTCSeconds();
  const origMs = result.getUTCMilliseconds();

  const targetMonth = origMonth + months;
  const targetYear = origYear + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;

  // Day count in target month
  const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(origDay, daysInTargetMonth);

  return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay, origHours, origMinutes, origSeconds, origMs));
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Public Pricing Catalog ────────────────────────────────────────────────

  async getPublicPlans() {
    const [plans, billingSettings] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        where: {
          isActive: true,
          isPublic: true,
        },
        orderBy: { price: 'asc' },
      }),
      this.getBillingSettings(),
    ]);

    const isIntakeEnabled = Boolean(billingSettings?.isIntakeEnabled);

    const safePlans = plans.map((plan) => {
      const isFree = plan.billingCycle === BillingCycle.FREE;
      const isAvailableForPurchase = isFree ? true : (plan.isSaleReady && isIntakeEnabled);

      let benefits: string[];
      if (isFree) {
        benefits = [
          'Thực hành các bài SQL & Quiz cơ bản',
          'Chạy mã trực tiếp trên trình duyệt',
          'Tự động chấm điểm và đánh giá kết quả',
        ];
      } else {
        benefits = [
          'Mở khóa toàn bộ bài thực hành nâng cao (SQL & Quiz)',
          'Xem đáp án chính thức sau khi hoàn thành bài',
          'AI gợi ý và giải thích chi tiết lỗi kiểm thử',
          'Tải mã nguồn và bộ tài liệu thực hành',
          'Hỗ trợ ưu tiên và cập nhật nội dung liên tục',
        ];
      }

      return {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        currency: 'VND',
        billingCycle: plan.billingCycle,
        isSaleReady: plan.isSaleReady,
        isAvailableForPurchase,
        benefits,
      };
    });

    return {
      intakeEnabled: isIntakeEnabled,
      receivingBank: isIntakeEnabled && billingSettings
        ? {
            bankName: billingSettings.bankName,
            bankCode: billingSettings.bankCode,
            accountNumber: billingSettings.accountNumber,
            accountHolder: billingSettings.accountHolder,
            instructions: billingSettings.instructions,
          }
        : null,
      plans: safePlans,
    };
  }

  // ── Admin Billing Settings ────────────────────────────────────────────────

  async getBillingSettings() {
    let settings = await this.prisma.billingSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.billingSettings.create({
        data: {
          id: 'default',
          bankName: '',
          bankCode: '',
          accountNumber: '',
          accountHolder: '',
          instructions: 'Chuyển khoản chính xác số tiền và ghi mã chuyển khoản vào nội dung giao dịch.',
          isIntakeEnabled: false,
        },
      });
    }

    return settings;
  }

  async updateBillingSettings(
    dto: UpdateBillingSettingsDto,
    adminId: string,
    meta?: { ip?: string; ua?: string },
  ) {
    if (dto.isIntakeEnabled) {
      if (!dto.bankName?.trim() || !dto.accountNumber?.trim() || !dto.accountHolder?.trim()) {
        throw new BadRequestException(
          'Cannot enable sale intake without complete receiving bank details (bankName, accountNumber, accountHolder)',
        );
      }
    }

    const updated = await this.prisma.billingSettings.upsert({
      where: { id: 'default' },
      update: {
        bankName: dto.bankName?.trim() || '',
        bankCode: dto.bankCode?.trim() || '',
        accountNumber: dto.accountNumber?.trim() || '',
        accountHolder: dto.accountHolder?.trim() || '',
        instructions: dto.instructions?.trim() || null,
        isIntakeEnabled: dto.isIntakeEnabled,
        updatedById: adminId,
      },
      create: {
        id: 'default',
        bankName: dto.bankName?.trim() || '',
        bankCode: dto.bankCode?.trim() || '',
        accountNumber: dto.accountNumber?.trim() || '',
        accountHolder: dto.accountHolder?.trim() || '',
        instructions: dto.instructions?.trim() || null,
        isIntakeEnabled: dto.isIntakeEnabled,
        updatedById: adminId,
      },
    });

    await this.auditLogsService.log({
      actorId: adminId,
      action: 'UPDATE_BILLING_SETTINGS',
      details: {
        bankName: updated.bankName,
        accountNumber: updated.accountNumber,
        isIntakeEnabled: updated.isIntakeEnabled,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return updated;
  }

  // ── Learner Upgrade Request Lifecycle ─────────────────────────────────────

  async createUpgradeRequest(userId: string, planId: string) {
    const billingSettings = await this.getBillingSettings();
    if (!billingSettings.isIntakeEnabled) {
      throw new BadRequestException('Subscription purchase intake is currently disabled by administrator');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive || !plan.isPublic) {
      throw new NotFoundException('Selected plan is not available');
    }

    if (!plan.isSaleReady || Number(plan.price) <= 0) {
      throw new BadRequestException('Selected plan is not ready for sale');
    }

    return this.prisma.$transaction(async (tx) => {
      // Check for open request (AWAITING_PAYMENT or PENDING_REVIEW) inside transaction
      const existingOpen = await tx.upgradeRequest.findFirst({
        where: {
          userId,
          status: { in: [UpgradeRequestStatus.AWAITING_PAYMENT, UpgradeRequestStatus.PENDING_REVIEW] },
        },
        include: { plan: true },
      });

      if (existingOpen) {
        // Idempotently return the existing open request
        return existingOpen;
      }

      // Generate unique transfer reference with collision retry
      let transferReference = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        const randPart = Math.floor(1000 + Math.random() * 9000);
        const datePart = Date.now().toString(36).toUpperCase().slice(-4);
        const candidate = `UP-${datePart}-${randPart}`;
        const collision = await tx.upgradeRequest.findUnique({ where: { transferReference: candidate } });
        if (!collision) {
          transferReference = candidate;
          break;
        }
      }
      if (!transferReference) {
        transferReference = `UP-${Date.now().toString(36).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      const priceSnapshot = new Prisma.Decimal(plan.price);
      const bankSnapshot = {
        bankName: billingSettings.bankName,
        bankCode: billingSettings.bankCode,
        accountNumber: billingSettings.accountNumber,
        accountHolder: billingSettings.accountHolder,
        instructions: billingSettings.instructions,
      };

      const created = await tx.upgradeRequest.create({
        data: {
          userId,
          planId: plan.id,
          status: UpgradeRequestStatus.AWAITING_PAYMENT,
          transferReference,
          priceSnapshot,
          currency: 'VND',
          period: plan.billingCycle,
          bankSnapshot,
        },
        include: { plan: true },
      });

      await this.notificationsService.createNotification(
        {
          userId,
          type: NotificationType.UPGRADE_REQUEST_CREATED,
          title: 'Yêu cầu nâng cấp Pro đã được tạo',
          body: `Mã chuyển khoản của bạn là ${transferReference}. Vui lòng chuyển khoản đúng số tiền ${Number(priceSnapshot).toLocaleString('vi-VN')} VND.`,
          actionPath: '/membership',
          eventKey: `upgrade-request-created-${created.id}`,
        },
        tx,
      );

      return created;
    });
  }

  async submitPaymentConfirmation(userId: string, requestId: string, paymentReference: string) {
    if (!paymentReference?.trim()) {
      throw new BadRequestException('Bank payment transaction reference is required');
    }

    const trimmedRef = paymentReference.trim();

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { plan: true },
      });

      if (!request || request.userId !== userId) {
        throw new NotFoundException('Upgrade request not found');
      }

      if (request.status === UpgradeRequestStatus.PENDING_REVIEW && request.paymentReference === trimmedRef) {
        return request; // Idempotent submission
      }

      if (request.status !== UpgradeRequestStatus.AWAITING_PAYMENT) {
        throw new BadRequestException(
          `Cannot submit payment confirmation for request in status "${request.status}"`,
        );
      }

      const updateResult = await tx.upgradeRequest.updateMany({
        where: {
          id: requestId,
          userId,
          status: UpgradeRequestStatus.AWAITING_PAYMENT,
        },
        data: {
          status: UpgradeRequestStatus.PENDING_REVIEW,
          paymentReference: trimmedRef,
          paymentSubmittedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.upgradeRequest.findUnique({ where: { id: requestId }, include: { plan: true } });
        if (current && current.status === UpgradeRequestStatus.PENDING_REVIEW && current.paymentReference === trimmedRef) {
          return current;
        }
        throw new ConflictException('Upgrade request is no longer awaiting payment');
      }

      const updated = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { plan: true },
      });

      await this.notificationsService.createNotification(
        {
          userId,
          type: NotificationType.PAYMENT_SUBMITTED,
          title: 'Đã nhận thông tin chuyển khoản',
          body: `Mã giao dịch ${trimmedRef} đã được ghi nhận. Ban quản trị sẽ đối soát và kích hoạt trong thời gian sớm nhất.`,
          actionPath: '/membership',
          eventKey: `payment-submitted-${requestId}`,
        },
        tx,
      );

      return updated!;
    });
  }

  async cancelUpgradeRequest(userId: string, requestId: string) {
    const request = await this.prisma.upgradeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.userId !== userId) {
      throw new NotFoundException('Upgrade request not found');
    }

    if (request.status !== UpgradeRequestStatus.AWAITING_PAYMENT) {
      throw new BadRequestException('Only requests awaiting payment can be cancelled');
    }

    const result = await this.prisma.upgradeRequest.updateMany({
      where: {
        id: requestId,
        userId,
        status: UpgradeRequestStatus.AWAITING_PAYMENT,
      },
      data: { status: UpgradeRequestStatus.CANCELLED },
    });

    if (result.count === 0) {
      throw new BadRequestException('Only requests awaiting payment can be cancelled');
    }

    return this.prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: { plan: true },
    });
  }

  async getMyUpgradeRequests(userId: string) {
    return this.prisma.upgradeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async getUpgradeRequestById(userId: string, requestId: string) {
    const request = await this.prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: { plan: true },
    });

    if (!request || request.userId !== userId) {
      throw new NotFoundException('Upgrade request not found');
    }

    return request;
  }

  // ── Admin Reconciliation State Machine ────────────────────────────────────

  async adminGetUpgradeRequests(query?: {
    status?: UpgradeRequestStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(query?.page || 1, 1);
    const limit = Math.min(query?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UpgradeRequestWhereInput = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { transferReference: { contains: s, mode: 'insensitive' } },
        { paymentReference: { contains: s, mode: 'insensitive' } },
        { verifiedBankReference: { contains: s, mode: 'insensitive' } },
        { user: { name: { contains: s, mode: 'insensitive' } } },
        { user: { email: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.upgradeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          plan: true,
          reviewedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.upgradeRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminGetUpgradeRequestById(requestId: string) {
    const request = await this.prisma.upgradeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        plan: true,
        reviewedBy: { select: { id: true, name: true } },
        subscription: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Upgrade request not found');
    }

    return request;
  }

  async adminApproveUpgradeRequest(
    adminId: string,
    requestId: string,
    dto: ApproveUpgradeRequestDto,
    meta?: { ip?: string; ua?: string },
  ) {
    const bankRef = (dto.verifiedBankReference || dto.verifiedBankRef || '').trim();
    if (!bankRef) {
      throw new BadRequestException('Verified bank reference is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { plan: true, user: true },
      });

      if (!request) {
        throw new NotFoundException('Upgrade request not found');
      }

      if (request.status === UpgradeRequestStatus.APPROVED) {
        throw new BadRequestException('This upgrade request has already been approved');
      }

      if (
        request.status !== UpgradeRequestStatus.PENDING_REVIEW &&
        request.status !== UpgradeRequestStatus.AWAITING_PAYMENT
      ) {
        throw new BadRequestException(`Cannot approve request in status "${request.status}"`);
      }

      // Exact amount verification
      const expectedAmount = Number(request.priceSnapshot);
      if (Number(dto.verifiedAmount) !== expectedAmount) {
        throw new BadRequestException(
          `Verified amount (${dto.verifiedAmount}) does not match expected snapshot price (${expectedAmount})`,
        );
      }

      // Check verifiedBankReference uniqueness
      const existingRef = await tx.upgradeRequest.findFirst({
        where: {
          verifiedBankReference: bankRef,
          id: { not: requestId },
        },
      });

      if (existingRef) {
        throw new ConflictException(
          `Bank reference "${bankRef}" has already been verified for another upgrade request`,
        );
      }

      const now = new Date();

      // Find current active direct subscription (if any)
      const currentActiveSub = await tx.userSubscription.findFirst({
        where: {
          userId: request.userId,
          status: SubscriptionStatus.ACTIVE,
        },
        orderBy: { endDate: 'desc' },
      });

      // Calendar month extension with end-of-month clamping
      let newStartDate = now;
      let newEndDate: Date;

      if (currentActiveSub?.endDate && currentActiveSub.endDate.getTime() > now.getTime()) {
        // Early renewal adds 1 calendar month to current expiry
        newEndDate = addCalendarMonthsClamped(currentActiveSub.endDate, 1);
      } else {
        // Expired or no prior subscription starts at approval time
        newEndDate = addCalendarMonthsClamped(now, 1);
      }

      // Concurrency guard: atomically lock and update upgrade request status
      const updateResult = await tx.upgradeRequest.updateMany({
        where: {
          id: requestId,
          status: { in: [UpgradeRequestStatus.PENDING_REVIEW, UpgradeRequestStatus.AWAITING_PAYMENT] },
        },
        data: {
          status: UpgradeRequestStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: now,
          verifiedAmount: dto.verifiedAmount,
          verifiedBankReference: bankRef,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'This upgrade request has already been processed or is no longer pending review',
        );
      }

      // Mark older active subscriptions cancelled/superseded
      await tx.userSubscription.updateMany({
        where: {
          userId: request.userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: { status: SubscriptionStatus.CANCELLED },
      });

      // Create new active subscription
      const newSub = await tx.userSubscription.create({
        data: {
          userId: request.userId,
          planId: request.planId,
          status: SubscriptionStatus.ACTIVE,
          startDate: newStartDate,
          endDate: newEndDate,
          autoRenew: false,
        },
      });

      // Link subscription to upgrade request
      await tx.upgradeRequest.update({
        where: { id: requestId },
        data: {
          subscriptionId: newSub.id,
        },
      });

      const updatedRequest = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { plan: true, user: true },
      });

      // Upgrade user role if regular user (preserve admin and contributor roles)
      if (request.user.role === UserRole.user) {
        await tx.user.update({
          where: { id: request.userId },
          data: { role: UserRole.userPro },
        });
      }

      // Audit Log
      await this.auditLogsService.log({
        actorId: adminId,
        targetUserId: request.userId,
        action: 'APPROVE_UPGRADE_REQUEST',
        details: {
          requestId: request.id,
          planCode: request.plan.code,
          verifiedAmount: dto.verifiedAmount,
          verifiedBankReference: bankRef,
          subscriptionId: newSub.id,
          expiry: newEndDate.toISOString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.ua,
      });

      // User notification
      await this.notificationsService.createNotification(
        {
          userId: request.userId,
          type: NotificationType.UPGRADE_APPROVED,
          title: 'Nâng cấp Pro thành công!',
          body: `Giao dịch đối soát thành công. Tài khoản của bạn đã được nâng cấp Pro đến ngày ${newEndDate.toLocaleDateString('vi-VN')}.`,
          actionPath: '/membership',
          eventKey: `upgrade-approved-${request.id}`,
        },
        tx,
      );

      return updatedRequest!;
    });
  }

  async adminRejectUpgradeRequest(
    adminId: string,
    requestId: string,
    dto: RejectUpgradeRequestDto,
    meta?: { ip?: string; ua?: string },
  ) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { plan: true, user: true },
      });

      if (!request) {
        throw new NotFoundException('Upgrade request not found');
      }

      if (request.status === UpgradeRequestStatus.REJECTED) {
        throw new BadRequestException('This upgrade request has already been rejected');
      }

      if (
        request.status !== UpgradeRequestStatus.PENDING_REVIEW &&
        request.status !== UpgradeRequestStatus.AWAITING_PAYMENT
      ) {
        throw new BadRequestException(`Cannot reject request in status "${request.status}"`);
      }

      const now = new Date();
      const updateResult = await tx.upgradeRequest.updateMany({
        where: {
          id: requestId,
          status: { in: [UpgradeRequestStatus.PENDING_REVIEW, UpgradeRequestStatus.AWAITING_PAYMENT] },
        },
        data: {
          status: UpgradeRequestStatus.REJECTED,
          reviewedById: adminId,
          reviewedAt: now,
          reviewReason: dto.reason.trim(),
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'This upgrade request has already been processed or is no longer pending review',
        );
      }

      const updatedRequest = await tx.upgradeRequest.findUnique({
        where: { id: requestId },
        include: { plan: true },
      });

      await this.auditLogsService.log({
        actorId: adminId,
        targetUserId: request.userId,
        action: 'REJECT_UPGRADE_REQUEST',
        details: {
          requestId: request.id,
          reason: dto.reason.trim(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.ua,
      });

      await this.notificationsService.createNotification(
        {
          userId: request.userId,
          type: NotificationType.UPGRADE_REJECTED,
          title: 'Yêu cầu nâng cấp Pro không được duyệt',
          body: `Lý do: ${dto.reason.trim()}. Vui lòng kiểm tra lại thông tin chuyển khoản hoặc liên hệ hỗ trợ.`,
          actionPath: '/membership',
          eventKey: `upgrade-rejected-${request.id}`,
        },
        tx,
      );

      return updatedRequest!;
    });
  }

  // ── Membership State Projection (Task 3.2) ────────────────────────────────

  async getMembershipState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                groupPlans: {
                  include: { plan: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const now = new Date();

    // Direct active subscription
    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });

    let latestExpiredSub = null;
    if (!subscription) {
      latestExpiredSub = await this.prisma.userSubscription.findFirst({
        where: {
          userId,
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED] },
          endDate: { lte: now },
        },
        include: { plan: true },
        orderBy: { endDate: 'desc' },
      });
    }

    // Group memberships with Pro
    const groupProPlan = (user.groupMemberships || [])
      .filter((gm) => gm.group?.isActive)
      .flatMap((gm) => (gm.group?.groupPlans || []).map((gp) => gp.plan))
      .find((p) => p?.code?.includes('PRO') || p?.billingCycle === BillingCycle.LIFETIME);

    const hasDirectPro = Boolean(
      subscription && (subscription.plan.code.includes('PRO') || Number(subscription.plan.price) > 0),
    );
    const hasGroupPro = Boolean(groupProPlan);
    const isPrivilegedRole = user.role === UserRole.admin;

    const isPro = hasDirectPro || hasGroupPro || isPrivilegedRole;

    let provenance = 'FREE';
    if (isPrivilegedRole) {
      provenance = 'ADMIN_ROLE';
    } else if (hasDirectPro) {
      provenance = 'DIRECT_SUBSCRIPTION';
    } else if (hasGroupPro) {
      provenance = 'GROUP_MEMBERSHIP';
    }

    // Open upgrade request
    const openRequest = await this.prisma.upgradeRequest.findFirst({
      where: {
        userId,
        status: { in: [UpgradeRequestStatus.AWAITING_PAYMENT, UpgradeRequestStatus.PENDING_REVIEW] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const isLifetime = hasGroupPro && groupProPlan?.billingCycle === BillingCycle.LIFETIME;
    const canPurchase = !isPrivilegedRole && !isLifetime;
    let purchaseIneligibilityReason: string | null = null;
    if (isPrivilegedRole) {
      purchaseIneligibilityReason = 'Quản trị viên hệ thống có toàn quyền truy cập mà không cần mua gói Pro.';
    } else if (isLifetime) {
      purchaseIneligibilityReason = 'Bạn đã được cấp quyền Pro không giới hạn thời gian qua nhóm IAM.';
    }

    const effectiveSub = subscription || latestExpiredSub;

    return {
      userId,
      isPro,
      provenance,
      planName: subscription?.plan.name || (hasGroupPro ? groupProPlan?.name : latestExpiredSub?.plan.name || 'Free Tier'),
      planCode: subscription?.plan.code || (hasGroupPro ? groupProPlan?.code : latestExpiredSub?.plan.code || 'FREE'),
      startDate: effectiveSub?.startDate || null,
      endDate: effectiveSub?.endDate || null,
      isExpired: Boolean(latestExpiredSub && !subscription),
      canPurchase,
      purchaseIneligibilityReason,
      openRequest,
    };
  }
}
