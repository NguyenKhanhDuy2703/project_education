import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a new administrative action into the audit trail.
   */
  async log(data: {
    actorId: string;
    targetUserId?: string | null;
    action: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        targetUserId: data.targetUserId || null,
        action: data.action,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Retrieve paginated audit logs with optional filters.
   */
  async findAll(params?: {
    targetUserId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.targetUserId) {
      where.targetUserId = params.targetUserId;
    }
    if (params?.action) {
      where.action = params.action;
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
