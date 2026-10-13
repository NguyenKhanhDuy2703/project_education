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
        labs: {
          where: includeInactive ? {} : { isActive: true, status: ContentLifecycleStatus.published },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
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
        labs: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
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

    return {
      ...series,
      labs: visibleLabs,
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

    // Contributors are restricted strictly to draft status
    const status =
      user.role === UserRole.contributor
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
    if (user.role === UserRole.contributor) {
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

    if (user.role === UserRole.contributor && series.authorId !== user.userId) {
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
}
