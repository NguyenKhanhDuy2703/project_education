import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionPath?: string;
  eventKey?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or deduplicate a business notification.
   * Can accept an ongoing Prisma transaction client to ensure atomic creation.
   */
  async createNotification(
    params: CreateNotificationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    if (params.eventKey) {
      // Idempotent upsert by unique eventKey
      return client.notification.upsert({
        where: { eventKey: params.eventKey },
        update: {},
        create: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          body: params.body,
          actionPath: params.actionPath,
          eventKey: params.eventKey,
        },
      });
    }

    return client.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        actionPath: params.actionPath,
      },
    });
  }

  /**
   * Get paginated notifications for the authenticated user.
   */
  async getMyNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number; cursor?: string },
  ) {
    const limit = Math.min(options?.limit || 20, 100);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
    };

    const items = await this.prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: options?.cursor ? { id: options.cursor } : undefined,
      skip: options?.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      items,
      nextCursor,
      totalUnread: await this.getUnreadCount(userId),
    };
  }

  /**
   * Get unread notifications count for badge display.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  /**
   * Mark a single notification as read by owner.
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You cannot modify notifications belonging to another user');
    }

    if (notification.readAt) {
      return notification; // Idempotent
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read up to a server cutoff timestamp.
   */
  async markAllAsRead(userId: string) {
    const cutoff = new Date();
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        createdAt: { lte: cutoff },
      },
      data: {
        readAt: cutoff,
      },
    });

    return {
      updatedCount: result.count,
      markedAt: cutoff,
    };
  }

  // ── Admin Announcements & Batching (Task 4.2) ─────────────────────────────

  async createAndProcessAnnouncement(
    adminId: string,
    dto: { title: string; body: string; actionPath?: string; targetAudience?: string; audience?: string },
  ) {
    if (dto.actionPath) {
      const trimmedPath = dto.actionPath.trim();
      if (!trimmedPath.startsWith('/') || trimmedPath.startsWith('//') || trimmedPath.includes(':')) {
        throw new BadRequestException('actionPath must be a relative internal route starting with /');
      }
    }

    // Resolve audience
    const audience = (dto.targetAudience || dto.audience || 'ALL').trim();
    const userWhere: Prisma.UserWhereInput = { isActive: true };

    if (audience === 'PRO_ONLY' || audience === 'userPro') {
      userWhere.role = 'userPro' as any;
    } else if (audience === 'FREE_ONLY' || audience === 'user') {
      userWhere.role = 'user' as any;
    } else if (audience !== 'ALL') {
      const validRoles = ['user', 'userPro', 'admin', 'contributor'];
      const roles = audience
        .split(',')
        .map((r) => r.trim())
        .filter((r) => validRoles.includes(r)) as any[];
      if (roles.length > 0) {
        userWhere.role = { in: roles };
      }
    }

    const recipients = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        actionPath: dto.actionPath?.trim() || null,
        targetAudience: audience,
        totalRecipients: recipients.length,
        processedRecipients: 0,
        status: 'PROCESSING',
        createdById: adminId,
      },
    });

    // Deliver in batches of 50
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await this.prisma.$transaction(async (tx) => {
        for (const recipient of batch) {
          // Idempotent upsert recipient record
          const eventKey = `announcement-${announcement.id}-${recipient.id}`;
          const notif = await tx.notification.upsert({
            where: { eventKey },
            update: {},
            create: {
              userId: recipient.id,
              type: NotificationType.ANNOUNCEMENT,
              title: announcement.title,
              body: announcement.body,
              actionPath: announcement.actionPath,
              eventKey,
            },
          });

          await tx.announcementRecipient.upsert({
            where: {
              announcementId_userId: {
                announcementId: announcement.id,
                userId: recipient.id,
              },
            },
            update: {
              deliveredAt: new Date(),
              notificationId: notif.id,
            },
            create: {
              announcementId: announcement.id,
              userId: recipient.id,
              deliveredAt: new Date(),
              notificationId: notif.id,
            },
          });
        }

        await tx.announcement.update({
          where: { id: announcement.id },
          data: {
            processedRecipients: Math.min(i + batch.length, recipients.length),
          },
        });
      });
    }

    return this.prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        status: 'COMPLETED',
        processedRecipients: recipients.length,
      },
    });
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ── Database-Leased Expiry Worker (Task 4.2) ──────────────────────────────

  async processMembershipExpirations(workerId = `worker-${process.pid}`) {
    const jobName = 'membership-expiry-check';
    const now = new Date();
    const leaseDurationMs = 60000;
    const expiresAt = new Date(now.getTime() + leaseDurationMs);

    // Coordinate worker lease via database
    const acquired = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.scheduledJobLease.findUnique({ where: { jobName } });
      if (existing && existing.expiresAt > now && existing.lockedBy !== workerId) {
        return false; // Another worker instance is currently holding valid lease
      }

      await tx.scheduledJobLease.upsert({
        where: { jobName },
        update: {
          lockedBy: workerId,
          lockedAt: now,
          expiresAt,
        },
        create: {
          jobName,
          lockedBy: workerId,
          lockedAt: now,
          expiresAt,
        },
      });

      return true;
    });

    if (!acquired) {
      return { skipped: true, reason: 'Lease held by another worker instance' };
    }

    let expiringSoonCount = 0;
    let expiredCount = 0;

    // 1. Notify 3 days before expiry
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000);
    const expiringSoonSubs = await this.prisma.userSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gt: now,
          lte: threeDaysFromNow,
        },
      },
      include: { user: true, plan: true },
    });

    for (const sub of expiringSoonSubs) {
      if (!sub.endDate) continue;
      const dateKey = sub.endDate.toISOString().slice(0, 10);
      const eventKey = `sub-expiring-3d-${sub.id}-${dateKey}`;

      await this.createNotification({
        userId: sub.userId,
        type: NotificationType.MEMBERSHIP_EXPIRING_SOON,
        title: 'Gói Pro của bạn sắp hết hạn',
        body: `Gói ${sub.plan.name} của bạn sẽ hết hạn vào ngày ${sub.endDate.toLocaleDateString('vi-VN')}. Hãy gia hạn sớm để không bị gián đoạn quyền lợi!`,
        actionPath: '/pricing',
        eventKey,
      });
      expiringSoonCount++;
    }

    // 2. Mark expired memberships
    const expiredSubs = await this.prisma.userSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now,
        },
      },
      include: { user: true, plan: true },
    });

    for (const sub of expiredSubs) {
      await this.prisma.$transaction(async (tx) => {
        await tx.userSubscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });

        // Demote userPro role to user if regular user has no remaining active subscriptions
        if (sub.user.role === 'userPro') {
          const remainingActive = await tx.userSubscription.count({
            where: {
              userId: sub.userId,
              status: 'ACTIVE',
              OR: [{ endDate: null }, { endDate: { gt: now } }],
            },
          });

          if (remainingActive === 0) {
            let hasActiveGroupPro = false;
            try {
              const groupMember = await tx.userGroupMember?.findFirst?.({
                where: {
                  userId: sub.userId,
                  group: {
                    isActive: true,
                    groupPlans: {
                      some: {
                        plan: {
                          OR: [
                            { code: { contains: 'PRO' } },
                            { billingCycle: 'LIFETIME' },
                          ],
                        },
                      },
                    },
                  },
                },
              });
              if (groupMember) hasActiveGroupPro = true;
            } catch {}

            if (!hasActiveGroupPro) {
              await tx.user.update({
                where: { id: sub.userId },
                data: { role: 'user' },
              });
            }
          }
        }

        const dateKey = sub.endDate ? sub.endDate.toISOString().slice(0, 10) : 'indefinite';
        const eventKey = `sub-expired-${sub.id}-${dateKey}`;

        await this.createNotification(
          {
            userId: sub.userId,
            type: NotificationType.MEMBERSHIP_EXPIRED,
            title: 'Gói Pro của bạn đã hết hạn',
            body: `Gói ${sub.plan.name} của bạn đã hết hạn. Bạn có thể gia hạn bất kỳ lúc nào để tiếp tục học tập.`,
            actionPath: '/pricing',
            eventKey,
          },
          tx,
        );
      });
      expiredCount++;
    }

    // Update lease with last result
    await this.prisma.scheduledJobLease.update({
      where: { jobName },
      data: {
        lastRunAt: now,
        lastResult: { expiringSoonCount, expiredCount },
      },
    });

    return {
      success: true,
      expiringSoonCount,
      expiredCount,
    };
  }
}
