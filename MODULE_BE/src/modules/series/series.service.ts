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

export const TOPIC_KEY_ALIASES: Record<string, string> = {
  sql: 'database',
  db: 'database',
  docker: 'devops',
  qa: 'testing',
  tester: 'testing',
  test: 'testing',
  auth: 'security',
  sec: 'security',
};

export const CANONICAL_TOPICS = [
  {
    key: 'testing',
    title: 'Tester & QA',
    description: 'Manual testing, automated API testing, regression suites, and unit assertions.',
    tagColor: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  {
    key: 'database',
    title: 'Database & SQL',
    description: 'Relational data modeling, SQL queries, indexing, transactions, and performance tuning.',
    tagColor: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
  },
  {
    key: 'backend',
    title: 'Backend API',
    description: 'RESTful API architecture, JWT authentication, microservices, and server business logic.',
    tagColor: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    key: 'devops',
    title: 'DevOps & Docker',
    description: 'Application containerization, multi-service Docker Compose, and CI/CD pipelines.',
    tagColor: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  {
    key: 'security',
    title: 'Security & Auth',
    description: 'Web application security, OAuth2, RBAC/PBAC access controls, and data encryption.',
    tagColor: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
  },
];


export function isAutomationFeatureEnabled(): boolean {
  return process.env.FEATURE_AUTOMATION_CONTENT_ENABLED === 'true';
}

export function canAccessAutomationContent(user?: { userId?: string; role?: UserRole }): boolean {
  if (isAutomationFeatureEnabled()) return true;
  if (!user) return false;
  return user.role === UserRole.admin || user.role === UserRole.contributor;
}

export function isAutomationSeries(series?: {
  id?: string;
  slug?: string;
  category?: string;
  labs?: Array<{ sandboxType?: string; unitType?: string; slug?: string }>;
} | null): boolean {
  if (!series) return false;
  const slug = (series.slug || '').toLowerCase();
  const id = (series.id || '').toLowerCase();
  const category = (series.category || '').toLowerCase();

  if (
    slug.includes('playwright') ||
    slug.includes('automation') ||
    id.includes('auto') ||
    category === 'automation'
  ) {
    return true;
  }

  if (
    Array.isArray(series.labs) &&
    series.labs.length > 0 &&
    series.labs.every((l) => isAutomationLab(l))
  ) {
    return true;
  }

  return false;
}

export function isAutomationLab(lab?: {
  sandboxType?: string;
  unitType?: string;
  slug?: string;
  seriesId?: string;
  series?: any;
} | null): boolean {
  if (!lab) return false;
  if (lab.sandboxType === 'js_worker' || lab.unitType === 'automation_lab') return true;
  const slug = (lab.slug || '').toLowerCase();
  if (slug.includes('playwright') || slug.includes('auto-syntax') || slug.startsWith('lab-auto-')) {
    return true;
  }
  if (lab.series && isAutomationSeries(lab.series)) {
    return true;
  }
  return false;
}

export function normalizeTopicKey(key?: string): string {
  if (!key) return 'testing';
  const lower = key.toLowerCase().trim();
  return TOPIC_KEY_ALIASES[lower] || lower;
}

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  getTaxonomyTopics() {
    return CANONICAL_TOPICS;
  }

  normalizeCategory(category?: string): string {
    return normalizeTopicKey(category);
  }

  async findAll(includeInactive = false, requestingUser?: { userId?: string; role?: UserRole }) {
    const allowInactive = Boolean(includeInactive && requestingUser?.role === UserRole.admin);
    const where = allowInactive ? {} : { isActive: true, status: ContentLifecycleStatus.published };
    const allSeries = await this.prisma.labSeries.findMany({
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
          where: allowInactive ? {} : { isActive: true, status: ContentLifecycleStatus.published },
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

    if (canAccessAutomationContent(requestingUser)) {
      return allSeries;
    }

    return allSeries
      .filter((s) => !isAutomationSeries(s))
      .map((s) => {
        const filteredLabs = s.labs.filter((l) => !isAutomationLab(l));
        return {
          ...s,
          labs: filteredLabs,
          _count: {
            labs: filteredLabs.length,
          },
        };
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

    // Gatekeeper: Automation series visibility control
    const isPrivilegedForAutomation =
      canAccessAutomationContent(currentUser) ||
      (currentUser && currentUser.userId === series.authorId);
    if (isAutomationSeries(series) && !isPrivilegedForAutomation) {
      throw new NotFoundException(`Topic "${slugOrId}" is temporarily unavailable`);
    }

    // Filter labs: Public students only see published labs; Author/Admin sees all
    let visibleLabs = isAuthorizedAuthorOrAdmin
      ? series.labs
      : series.labs.filter((l) => l.isActive && l.status === ContentLifecycleStatus.published);

    if (!isPrivilegedForAutomation) {
      visibleLabs = visibleLabs.filter((l) => !isAutomationLab(l));
    }

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

    let isSaved = false;
    if (currentUser?.userId && (this.prisma as any).userSavedSeries) {
      const bookmark = await (this.prisma as any).userSavedSeries.findUnique({
        where: {
          userId_seriesId: { userId: currentUser.userId, seriesId: series.id },
        },
      });
      isSaved = Boolean(bookmark);
    }

    return {
      ...series,
      isSaved,
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
        category: this.normalizeCategory(dto.category),
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

    if (updateData.category) {
      updateData.category = this.normalizeCategory(updateData.category);
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

  async saveSeries(userId: string, seriesId: string) {
    const series = await this.prisma.labSeries.findUnique({ where: { id: seriesId } });
    if (!series || !series.isActive) {
      throw new NotFoundException(`Series "${seriesId}" not found`);
    }
    const existing = await (this.prisma as any).userSavedSeries.findUnique({
      where: {
        userId_seriesId: { userId, seriesId },
      },
    });
    if (existing) {
      return { saved: true, message: 'Series already saved' };
    }
    await (this.prisma as any).userSavedSeries.create({
      data: { userId, seriesId },
    });
    return { saved: true, message: 'Series saved successfully' };
  }

  async unsaveSeries(userId: string, seriesId: string) {
    await (this.prisma as any).userSavedSeries.deleteMany({
      where: { userId, seriesId },
    });
    return { saved: false, message: 'Series unsaved successfully' };
  }

  async getSavedSeries(userId: string, requestingUser?: { userId?: string; role?: UserRole }) {
    const saved = await (this.prisma as any).userSavedSeries.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        series: {
          include: {
            author: { select: { id: true, name: true, role: true } },
            _count: { select: { labs: true } },
          },
        },
      },
    });

    const canSeeAuto = canAccessAutomationContent(requestingUser);
    return (saved || [])
      .filter(
        (item: any) =>
          item.series &&
          item.series.isActive &&
          item.series.status === ContentLifecycleStatus.published &&
          (canSeeAuto || !isAutomationSeries(item.series)),
      )
      .map((item: any) => ({
        savedAt: item.createdAt,
        ...item.series,
      }));
  }
}
