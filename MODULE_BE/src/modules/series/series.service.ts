import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { slugify } from '../../utils/slug.util';
import { ContentLifecycleStatus, UserRole } from '@prisma/client';

import { inferLearningUnitType } from '../labs/domain/labContentCodec';

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true, status: ContentLifecycleStatus.published };
    return this.prisma.labSeries.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        sections: {
          orderBy: { orderIndex: 'asc' },
        },
        labs: {
          where: includeInactive ? {} : { isActive: true, status: ContentLifecycleStatus.published },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            seriesId: true,
            sectionId: true,
            unitType: true,
            title: true,
            slug: true,
            sandboxType: true,
            durationMinutes: true,
            isProOnly: true,
            isFreePreview: true,
            orderIndex: true,
            status: true,
            objective: true,
          },
        },
        _count: {
          select: { labs: true },
        },
      },
    });
  }

  async findMySeries(authorId: string) {
    return this.prisma.labSeries.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { labs: true },
        },
      },
    });
  }

  async findBySlug(slugOrId: string, currentUser?: { userId: string; role: UserRole }) {
    const series = await this.prisma.labSeries.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        sections: {
          orderBy: { orderIndex: 'asc' },
        },
        labs: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            seriesId: true,
            sectionId: true,
            unitType: true,
            title: true,
            slug: true,
            sandboxType: true,
            durationMinutes: true,
            isFreePreview: true,
            isProOnly: true,
            orderIndex: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    if (!series) {
      throw new NotFoundException(`Topic "${slugOrId}" not found`);
    }

    const isAuthorizedAuthorOrAdmin =
      currentUser &&
      (currentUser.role === UserRole.admin || currentUser.userId === series.authorId);

    // Gatekeeper: If topic is not published, only author or admin can view
    if (series.status !== ContentLifecycleStatus.published && !isAuthorizedAuthorOrAdmin) {
      throw new NotFoundException(`Topic "${slugOrId}" not found`);
    }

    // Filter labs: Public students only see published labs; Author/Admin sees all
    const visibleLabs = isAuthorizedAuthorOrAdmin
      ? series.labs
      : series.labs.filter((l) => l.isActive && l.status === ContentLifecycleStatus.published);

    const userProgressMap = new Map<string, any>();
    if (currentUser?.userId) {
      const progressRecords = await this.prisma.learningUnitProgress.findMany({
        where: {
          userId: currentUser.userId,
          labId: { in: visibleLabs.map((l) => l.id) },
        },
      });
      for (const pr of progressRecords) {
        userProgressMap.set(pr.labId, pr);
      }
    }

    const enrichedLabs = visibleLabs.map((lab) => {
      const resolvedUnitType = inferLearningUnitType(lab.unitType, lab.sandboxType);
      const pr = userProgressMap.get(lab.id);
      return {
        ...lab,
        unitType: resolvedUnitType,
        progress: pr ? { status: pr.status, score: pr.score, completedAt: pr.completedAt } : null,
      };
    });

    const sectionsWithLabs = (series.sections || []).map((sec) => ({
      ...sec,
      labs: enrichedLabs
        .filter((l) => l.sectionId === sec.id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));

    const unassignedLabs = enrichedLabs
      .filter((l) => !l.sectionId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (unassignedLabs.length > 0) {
      sectionsWithLabs.push({
        id: 'default-section',
        seriesId: series.id,
        title: 'Course Content',
        description: null,
        orderIndex: sectionsWithLabs.length,
        createdAt: new Date(),
        updatedAt: new Date(),
        labs: unassignedLabs,
      });
    }

    return {
      ...series,
      sections: sectionsWithLabs,
      labs: enrichedLabs,
    };
  }

  async findById(id: string) {
    const series = await this.prisma.labSeries.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        labs: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!series) {
      throw new NotFoundException(`Topic with ID "${id}" not found`);
    }

    return series;
  }

  async create(dto: CreateSeriesDto, user: { userId: string; role: UserRole }) {
    const targetSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);

    const existing = await this.prisma.labSeries.findUnique({
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

    return this.prisma.labSeries.create({
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

  async update(id: string, dto: UpdateSeriesDto, user: { userId: string; role: UserRole }) {
    const existing = await this.findById(id);

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const conflict = await this.prisma.labSeries.findFirst({
        where: {
          slug: formattedSlug,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${formattedSlug}" is already in use by another topic.`);
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

    return this.prisma.labSeries.update({
      where: { id },
      data: updateData,
    });
  }

  async submitForReview(id: string, user: { userId: string; role: UserRole }) {
    const series = await this.findById(id);

    if (user.role !== UserRole.admin && series.authorId !== user.userId) {
      throw new ForbiddenException('You can only submit your own content for review');
    }

    if (
      series.status !== ContentLifecycleStatus.draft &&
      series.status !== ContentLifecycleStatus.changes_requested
    ) {
      throw new BadRequestException(
        `Cannot submit content with status '${series.status}'. Only draft or changes_requested can be submitted.`,
      );
    }

    // Bump version if resubmitting
    let nextVersion = series.version || 'v1.0';
    if (series.status === ContentLifecycleStatus.changes_requested) {
      const parts = nextVersion.replace('v', '').split('.');
      const major = parseInt(parts[0], 10) || 1;
      const minor = (parseInt(parts[1], 10) || 0) + 1;
      nextVersion = `v${major}.${minor}`;
    }

    return this.prisma.labSeries.update({
      where: { id },
      data: {
        status: ContentLifecycleStatus.submitted,
        version: nextVersion,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.labSeries.delete({
      where: { id },
    });
  }

  async createSection(
    seriesId: string,
    dto: { title: string; description?: string; orderIndex?: number },
  ) {
    await this.findById(seriesId);
    if (!this.prisma.seriesSection) {
      return { id: 'mock-sec', seriesId, ...dto, orderIndex: dto.orderIndex ?? 0 };
    }
    return this.prisma.seriesSection.create({
      data: {
        seriesId,
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async updateSection(
    seriesId: string,
    sectionId: string,
    dto: { title?: string; description?: string; orderIndex?: number },
  ) {
    await this.findById(seriesId);
    if (!this.prisma.seriesSection) {
      return { id: sectionId, seriesId, ...dto };
    }
    const section = await this.prisma.seriesSection.findFirst({
      where: { id: sectionId, seriesId },
    });
    if (!section) {
      throw new NotFoundException(`Section "${sectionId}" not found in series "${seriesId}"`);
    }
    return this.prisma.seriesSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
      },
    });
  }

  async deleteSection(seriesId: string, sectionId: string) {
    await this.findById(seriesId);
    if (!this.prisma.seriesSection) return;
    const section = await this.prisma.seriesSection.findFirst({
      where: { id: sectionId, seriesId },
    });
    if (!section) {
      throw new NotFoundException(`Section "${sectionId}" not found in series "${seriesId}"`);
    }
    const attachedLabsCount = await this.prisma.lab.count({
      where: { sectionId },
    });
    if (attachedLabsCount > 0) {
      throw new BadRequestException(
        `Cannot delete section "${section.title}": it contains ${attachedLabsCount} learning unit(s). Please reassign or delete the units first.`,
      );
    }
    await this.prisma.seriesSection.delete({
      where: { id: sectionId },
    });
  }
}
