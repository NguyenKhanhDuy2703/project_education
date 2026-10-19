import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ContentLifecycleStatus } from '@prisma/client';
import { LabsService } from '../labs/labs.service';

export type ContentType = 'series' | 'lab';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    @Optional() private readonly labsService?: LabsService,
  ) {}

  /**
   * Query the unified Admin Review Queue across both Series and Labs.
   */
  async getReviewQueue(query: {
    status?: ContentLifecycleStatus;
    type?: 'all' | 'series' | 'lab';
    search?: string;
  }) {
    const statusFilter = query.status ? { status: query.status } : {};
    const searchFilter = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { slug: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const includeSeries = query.type !== 'lab';
    const includeLabs = query.type !== 'series';

    const [seriesItems, labItems] = await Promise.all([
      includeSeries
        ? this.prisma.labSeries.findMany({
            where: {
              ...statusFilter,
              ...searchFilter,
            },
            include: {
              author: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
      includeLabs
        ? this.prisma.lab.findMany({
            where: {
              ...statusFilter,
              ...searchFilter,
            },
            include: {
              author: {
                select: { id: true, name: true, email: true, role: true },
              },
              series: {
                select: { id: true, title: true, slug: true },
              },
            },
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Aggregate status counts across all content items for tab badges
    const [allSeries, allLabs] = await Promise.all([
      this.prisma.labSeries.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.lab.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const counts: Record<string, number> = {
      submitted: 0,
      changes_requested: 0,
      approved: 0,
      published: 0,
      archived: 0,
      rejected: 0,
      draft: 0,
    };

    for (const item of [...allSeries, ...allLabs]) {
      if (counts[item.status] !== undefined) {
        counts[item.status] += item._count.status;
      }
    }

    // Normalize and sort merged result
    const items = [
      ...seriesItems.map((s) => ({
        id: s.id,
        type: 'series' as const,
        title: s.title,
        slug: s.slug,
        category: s.category,
        status: s.status,
        version: s.version,
        reviewFeedback: s.reviewFeedback,
        author: s.author,
        authorName: s.author?.name,
        authorId: s.author?.id,
        description: s.description,
        parentTitle: null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      ...labItems.map((l) => {
        let sampleData: any = undefined;
        let expectedQueryResult: any = undefined;
        let quizQuestions: any = undefined;
        let sqlSchema: any = undefined;
        let extractedConfig: any = undefined;

        if (l.objective) {
          try {
            const parsed = JSON.parse(l.objective);
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed)) {
                quizQuestions = parsed;
              } else {
                const config =
                  parsed.config && typeof parsed.config === 'object'
                    ? { ...parsed, ...parsed.config }
                    : parsed;

                if (config.sqlSchema) sqlSchema = config.sqlSchema;
                if (config.sampleData) sampleData = config.sampleData;
                if (config.expectedQueryResult) expectedQueryResult = config.expectedQueryResult;
                if (config.quizList) quizQuestions = config.quizList;
                if (config.quizQuestions) quizQuestions = config.quizQuestions;
                extractedConfig = config;
              }
            }
          } catch {}
        }

        return {
          id: l.id,
          type: 'lab' as const,
          title: l.title,
          slug: l.slug,
          category: l.series?.title || 'lab',
          status: l.status,
          version: l.version,
          reviewFeedback: l.reviewFeedback,
          author: l.author,
          authorName: l.author?.name,
          authorId: l.author?.id,
          parentTitle: l.series?.title || null,
          sandboxType: l.sandboxType,
          instructions: l.instructions,
          initialSnippet: l.initialSnippet,
          solution: l.solution,
          testScript: l.testScript,
          config: extractedConfig,
          sqlSchema,
          sampleData,
          expectedQueryResult,
          quizQuestions,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        };
      }),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return {
      counts,
      total: items.length,
      items,
    };
  }

  /**
   * Action: Approve submitted content (Does NOT auto-publish).
   */
  async approve(type: ContentType, id: string, adminId: string) {
    await this.verifyExists(type, id);

    let updated: any;
    if (type === 'series') {
      updated = await this.prisma.labSeries.update({
        where: { id },
        data: { status: ContentLifecycleStatus.approved },
      });
    } else {
      updated = await this.prisma.lab.update({
        where: { id },
        data: { status: ContentLifecycleStatus.approved },
      });
    }

    await this.auditLogsService.log({
      actorId: adminId,
      action: 'APPROVE_CONTENT',
      details: { type, id, title: updated.title, status: updated.status },
    });

    return { message: `${type.toUpperCase()} approved successfully`, item: updated };
  }

  /**
   * Action: Request changes with specific review feedback.
   */
  async requestChanges(type: ContentType, id: string, feedback: string, adminId: string) {
    await this.verifyExists(type, id);

    let updated: any;
    if (type === 'series') {
      updated = await this.prisma.labSeries.update({
        where: { id },
        data: {
          status: ContentLifecycleStatus.changes_requested,
          reviewFeedback: feedback,
        },
      });
    } else {
      updated = await this.prisma.lab.update({
        where: { id },
        data: {
          status: ContentLifecycleStatus.changes_requested,
          reviewFeedback: feedback,
        },
      });
    }

    await this.auditLogsService.log({
      actorId: adminId,
      action: 'REQUEST_CHANGES',
      details: { type, id, title: updated.title, feedback },
    });

    return { message: 'Changes requested successfully', item: updated };
  }

  /**
   * Action: Reject submission.
   */
  async reject(type: ContentType, id: string, reason: string, adminId: string) {
    await this.verifyExists(type, id);

    let updated: any;
    if (type === 'series') {
      updated = await this.prisma.labSeries.update({
        where: { id },
        data: {
          status: ContentLifecycleStatus.rejected,
          reviewFeedback: reason,
        },
      });
    } else {
      updated = await this.prisma.lab.update({
        where: { id },
        data: {
          status: ContentLifecycleStatus.rejected,
          reviewFeedback: reason,
        },
      });
    }

    await this.auditLogsService.log({
      actorId: adminId,
      action: 'REJECT_CONTENT',
      details: { type, id, title: updated.title, reason },
    });

    return { message: 'Submission rejected', item: updated };
  }

  /**
   * Action: Independent Publish (Separated from Approval).
   */
  async publish(type: ContentType, id: string, adminId: string) {
    const existing = await this.verifyExists(type, id);
    if (type === 'lab' && this.labsService) {
      await this.labsService.validateSqlLabForRelease(existing as {
        sandboxType: string;
        objective: string | null;
        solution: string | null;
      });
    }

    let updated: any;
    if (type === 'series') {
      updated = await this.prisma.labSeries.update({
        where: { id },
        data: {
          status: ContentLifecycleStatus.published,
          isActive: true,
        },
      });
    } else {
      updated = await this.prisma.lab.update({
        where: { id },
        data: {
          status: ContentLifecycleStatus.published,
          isActive: true,
        },
      });
    }

    await this.auditLogsService.log({
      actorId: adminId,
      action: 'PUBLISH_CONTENT',
      details: { type, id, title: updated.title, status: updated.status },
    });

    return { message: `${type.toUpperCase()} published live to students`, item: updated };
  }

  /**
   * Action: Unpublish (Move back to approved or archived).
   */
  async unpublish(type: ContentType, id: string, adminId: string) {
    await this.verifyExists(type, id);

    let updated: any;
    if (type === 'series') {
      updated = await this.prisma.labSeries.update({
        where: { id },
        data: { status: ContentLifecycleStatus.approved },
      });
    } else {
      updated = await this.prisma.lab.update({
        where: { id },
        data: { status: ContentLifecycleStatus.approved },
      });
    }

    await this.auditLogsService.log({
      actorId: adminId,
      action: 'UNPUBLISH_CONTENT',
      details: { type, id, title: updated.title, status: updated.status },
    });

    return { message: `${type.toUpperCase()} unpublished successfully`, item: updated };
  }

  /**
   * Action: Transfer ownership to another user.
   */
  async transferOwnership(
    type: ContentType,
    id: string,
    newAuthorId: string,
    reason: string | undefined,
    adminId: string,
  ) {
    await this.verifyExists(type, id);

    const targetUser = await this.prisma.user.findUnique({
      where: { id: newAuthorId },
    });
    if (!targetUser) {
      throw new NotFoundException(`Target author user with ID ${newAuthorId} not found`);
    }

    let updated: any;
    if (type === 'series') {
      updated = await this.prisma.labSeries.update({
        where: { id },
        data: { authorId: newAuthorId },
        include: { author: true },
      });
    } else {
      updated = await this.prisma.lab.update({
        where: { id },
        data: { authorId: newAuthorId },
        include: { author: true },
      });
    }

    await this.auditLogsService.log({
      actorId: adminId,
      targetUserId: newAuthorId,
      action: 'TRANSFER_CONTENT_OWNERSHIP',
      details: { type, id, title: updated.title, newAuthor: targetUser.name, reason },
    });

    return {
      message: `Ownership transferred to ${targetUser.name} successfully`,
      item: updated,
    };
  }

  private async verifyExists(type: ContentType, id: string) {
    if (type === 'series') {
      const s = await this.prisma.labSeries.findUnique({ where: { id } });
      if (!s) throw new NotFoundException(`Series with ID ${id} not found`);
      return s;
    } else if (type === 'lab') {
      const l = await this.prisma.lab.findUnique({ where: { id } });
      if (!l) throw new NotFoundException(`Lab with ID ${id} not found`);
      return l;
    } else {
      throw new BadRequestException(`Invalid content type '${type}'. Must be 'series' or 'lab'.`);
    }
  }
}
