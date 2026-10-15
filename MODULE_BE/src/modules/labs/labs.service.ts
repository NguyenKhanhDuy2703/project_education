import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { slugify } from '../../utils/slug.util';
import { ContentLifecycleStatus, UserRole } from '@prisma/client';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class LabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async findBySlug(slugOrId: string, currentUser?: { userId: string; role: UserRole }) {
    const lab = await this.prisma.lab.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    if (!lab) {
      throw new NotFoundException(`Practice Lab "${slugOrId}" not found`);
    }

    const isAuthorizedAuthorOrAdmin =
      currentUser &&
      (currentUser.role === UserRole.admin || currentUser.userId === lab.authorId);

    // Gatekeeper: If lab is not published, only author or admin can view (Preview mode)
    if (lab.status !== ContentLifecycleStatus.published && !isAuthorizedAuthorOrAdmin) {
      throw new NotFoundException(`Practice Lab "${slugOrId}" not found`);
    }

    // Pro Access Check
    let isLocked = false;
    let lockReason: string | null = null;
    if (lab.isProOnly && !isAuthorizedAuthorOrAdmin) {
      if (!currentUser) {
        isLocked = true;
        lockReason = 'This lab requires authentication and a PRO subscription.';
      } else {
        const proEval = await this.entitlementsService.checkUserFeature(
          currentUser.userId,
          'EXECUTE_LAB_ADVANCED',
        );
        if (!proEval.hasAccess || proEval.isBanned) {
          isLocked = true;
          lockReason = 'This lab is reserved for PRO members.';
        }
      }
    }

    // Dynamic Entitlement Resolution: Check VIEW_SOLUTION feature
    let canViewSolution = false;
    if (currentUser) {
      if (currentUser.role === UserRole.admin || currentUser.userId === lab.authorId) {
        canViewSolution = true;
      } else {
        const evaluation = await this.entitlementsService.checkUserFeature(
          currentUser.userId,
          'VIEW_SOLUTION',
        );
        canViewSolution = evaluation.hasAccess && !evaluation.isBanned;
      }
    }

    const { solution, ...publicFields } = lab;

    return {
      ...publicFields,
      isLocked,
      lockReason,
      solution: canViewSolution && !isLocked ? solution : null,
    };
  }

  async findMyLabs(authorId: string) {
    return this.prisma.lab.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: {
        series: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  async submit(
    labId: string,
    userId: string,
    payload: { submittedCode: string; status: string; timeMs: number; testLogs?: string },
  ) {
    const lab = await this.findById(labId);
    const submission = await this.prisma.labSubmission.create({
      data: {
        labId: lab.id,
        userId,
        submittedCode: payload.submittedCode || '',
        status: payload.status || 'passed',
        executionTimeMs: payload.timeMs || 0,
        testLogs: payload.testLogs || null,
      },
    });

    return {
      message: 'Lab attempt submitted successfully',
      id: submission.id,
      labId: lab.id,
      userId,
      status: submission.status,
      timeMs: submission.executionTimeMs,
      createdAt: submission.createdAt.toISOString(),
    };
  }

  async getSubmissions(labId: string, userId: string) {
    const lab = await this.findById(labId);
    return this.prisma.labSubmission.findMany({
      where: {
        labId: lab.id,
        userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findById(id: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        series: true,
      },
    });

    if (!lab) {
      throw new NotFoundException(`Lab with ID "${id}" not found`);
    }

    return lab;
  }

  async create(dto: CreateLabDto, user: { userId: string; role: UserRole }) {
    // 1. Verify parent topic existence
    const series = await this.prisma.labSeries.findUnique({
      where: { id: dto.seriesId },
    });
    if (!series) {
      throw new NotFoundException(`Topic (Series) with ID "${dto.seriesId}" does not exist.`);
    }

    // 2. Generate normalized slug
    const targetSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);

    const existing = await this.prisma.lab.findUnique({
      where: { slug: targetSlug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${targetSlug}" already exists. Please choose another.`);
    }

    // Contributors & non-admin authors are restricted strictly to draft status
    const status =
      user.role !== UserRole.admin
        ? ContentLifecycleStatus.draft
        : (dto as any).status || ContentLifecycleStatus.draft;

    return this.prisma.lab.create({
      data: {
        ...dto,
        slug: targetSlug,
        authorId: user.userId,
        status,
        version: 'v1.0',
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateLabDto, user: { userId: string; role: UserRole }) {
    const existing = await this.findById(id);

    if (dto.seriesId) {
      const series = await this.prisma.labSeries.findUnique({
        where: { id: dto.seriesId },
      });
      if (!series) {
        throw new NotFoundException(`Topic (Series) with ID "${dto.seriesId}" does not exist.`);
      }
    }

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const conflict = await this.prisma.lab.findFirst({
        where: {
          slug: formattedSlug,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${formattedSlug}" is already in use by another lab.`);
      }
      dto.slug = formattedSlug;
    }

    // Anti-Bypass: Strip unauthorized direct status promotions by Contributor
    const updateData: any = { ...dto };
    if (user.role !== UserRole.admin) {
      delete updateData.status;
      // If content was changes_requested and being edited, reset to draft
      if (existing.status === ContentLifecycleStatus.changes_requested) {
        updateData.status = ContentLifecycleStatus.draft;
      }
    }

    return this.prisma.lab.update({
      where: { id },
      data: updateData,
    });
  }

  async submitForReview(id: string, user: { userId: string; role: UserRole }) {
    const lab = await this.findById(id);

    if (user.role !== UserRole.admin && lab.authorId !== user.userId) {
      throw new ForbiddenException('You can only submit your own labs for review');
    }

    if (
      lab.status !== ContentLifecycleStatus.draft &&
      lab.status !== ContentLifecycleStatus.changes_requested
    ) {
      throw new BadRequestException(
        `Cannot submit lab with status '${lab.status}'. Only draft or changes_requested can be submitted.`,
      );
    }

    // Bump version if resubmitting
    let nextVersion = lab.version || 'v1.0';
    if (lab.status === ContentLifecycleStatus.changes_requested) {
      const parts = nextVersion.replace('v', '').split('.');
      const major = parseInt(parts[0], 10) || 1;
      const minor = (parseInt(parts[1], 10) || 0) + 1;
      nextVersion = `v${major}.${minor}`;
    }

    return this.prisma.lab.update({
      where: { id },
      data: {
        status: ContentLifecycleStatus.submitted,
        version: nextVersion,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.lab.delete({
      where: { id },
    });
  }
}
