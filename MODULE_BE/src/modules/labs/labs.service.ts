import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { slugify } from '../../utils/slug.util';
import { ContentLifecycleStatus, UserRole } from '@prisma/client';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { SubmitLabDto } from './dto/submit-lab.dto';
import { SqlLabConfig, DEFAULT_SQL_POLICY } from './domain/sql-lab.types';
import { SqlGradingService } from './sql-grading.service';
import { SqlPreflightDto } from './dto/sql-preflight.dto';

@Injectable()
export class LabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
    @Optional() private readonly sqlGradingService: SqlGradingService = new SqlGradingService(),
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
            isProOnly: true,
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

    // Pro Access Check (enforce if lab is Pro-only OR if parent series is Pro-only and lab is not a free preview)
    let isLocked = false;
    let lockReason: string | null = null;
    const isProRequired = Boolean(lab.isProOnly || (lab.series?.isProOnly && !lab.isFreePreview));
    if (isProRequired && !isAuthorizedAuthorOrAdmin) {
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

    let sampleData = undefined;
    let expectedQueryResult = undefined;
    let quizQuestions = undefined;
    let sqlSchema = undefined;
    let objectiveText = lab.objective;
    let extractedConfig: Record<string, any> | undefined = undefined;

    if (lab.objective) {
      try {
        const parsed = JSON.parse(lab.objective);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed)) {
            quizQuestions = parsed;
          } else {
            const config = parsed.config && typeof parsed.config === 'object'
              ? { ...parsed, ...parsed.config }
              : parsed;

            if (config.sqlSchema) sqlSchema = config.sqlSchema;
            if (config.sampleData) sampleData = config.sampleData;
            if (config.expectedQueryResult) expectedQueryResult = config.expectedQueryResult;
            if (config.quizList) quizQuestions = config.quizList;
            if (config.quizQuestions) quizQuestions = config.quizQuestions;
            if (config.summary) objectiveText = config.summary;

            // Strip author-only grading rules and hidden checks for non-privileged learners
            if (!isAuthorizedAuthorOrAdmin) {
              const sanitized = { ...config };
              delete sanitized.gradingRules;
              delete sanitized.hiddenChecks;
              delete sanitized.acceptedAnswers;
              delete sanitized.acceptedAnswersOrRules;
              delete sanitized.expectedQueryResult;
              delete sanitized.verificationSql;
              extractedConfig = sanitized;
              expectedQueryResult = undefined;
            } else {
              extractedConfig = config;
            }
          }
        }
      } catch {}
    }

    return {
      ...publicFields,
      objective: objectiveText,
      config: extractedConfig,
      sqlSchema,
      sampleData,
      expectedQueryResult,
      quizQuestions,
      quizList: quizQuestions,
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
    payload: SubmitLabDto,
  ) {
    const lab = await this.findById(labId);
    const authoritativeResult = lab.sandboxType === 'sql_worker'
      ? await this.sqlGradingService.grade({
          submittedCode: payload.submittedCode || '',
          solution: lab.solution,
          config: this.getSqlLabConfig(lab.objective),
        })
      : {
          status: payload.status || 'failed',
          timeMs: payload.timeMs || 0,
          testLogs: payload.testLogs || null,
        };

    const submission = await this.prisma.labSubmission.create({
      data: {
        labId: lab.id,
        userId,
        submittedCode: payload.submittedCode || '',
        status: authoritativeResult.status,
        executionTimeMs: authoritativeResult.timeMs,
        testLogs: authoritativeResult.testLogs,
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

  async preflightSql(dto: SqlPreflightDto) {
    const result = await this.sqlGradingService.grade({
      submittedCode: dto.solution,
      solution: dto.solution,
      config: {
        version: '2.0',
        schemaSql: dto.schemaSql,
        seedSql: dto.seedSql,
        statementPolicy: dto.statementPolicy || 'read_only',
        verificationSql: dto.verificationSql,
        timeoutMs: dto.timeoutMs || DEFAULT_SQL_POLICY.timeoutMs,
        maxResultRows: DEFAULT_SQL_POLICY.maxResultRows,
        maxResultColumns: DEFAULT_SQL_POLICY.maxResultColumns,
      },
    });
    return result;
  }

  async validateSqlLabForRelease(lab: { sandboxType: string; objective: string | null; solution: string | null }) {
    if (lab.sandboxType !== 'sql_worker') return;
    if (!lab.solution?.trim()) {
      throw new BadRequestException('SQL lab requires a reference solution before review or publication.');
    }
    const result = await this.sqlGradingService.grade({
      submittedCode: lab.solution,
      solution: lab.solution,
      config: this.getSqlLabConfig(lab.objective),
    });
    if (result.status !== 'passed') {
      throw new BadRequestException(`SQL lab preflight failed: ${result.testLogs}`);
    }
  }

  private getSqlLabConfig(objective: string | null): SqlLabConfig {
    let parsed: Record<string, any> = {};
    try {
      parsed = objective ? JSON.parse(objective) : {};
    } catch {
      throw new BadRequestException('SQL lab configuration is invalid JSON.');
    }
    const raw = parsed?.config && typeof parsed.config === 'object'
      ? { ...parsed, ...parsed.config }
      : parsed;
    const schemaSql = raw.schemaSql || raw.sqlSchema || '';
    if (!schemaSql.trim()) {
      throw new BadRequestException('SQL lab is missing schema SQL.');
    }
    return {
      version: raw.version === '2.0' ? '2.0' : '1.0',
      schemaSql,
      seedSql: raw.seedSql || '',
      expectedQueryResult: raw.expectedQueryResult,
      expectedColumns: raw.expectedColumns,
      verificationSql: raw.verificationSql,
      orderSensitive: Boolean(raw.orderSensitive),
      sampleRowsVisible: Boolean(raw.sampleRowsVisible),
      statementPolicy: raw.statementPolicy || DEFAULT_SQL_POLICY.statementPolicy,
      timeoutMs: raw.timeoutMs || DEFAULT_SQL_POLICY.timeoutMs,
      maxResultRows: raw.maxResultRows || DEFAULT_SQL_POLICY.maxResultRows,
      maxResultColumns: raw.maxResultColumns || DEFAULT_SQL_POLICY.maxResultColumns,
    };
  }

  async getUserSubmissions(userId: string) {
    const submissions = await this.prisma.labSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            slug: true,
            sandboxType: true,
            durationMinutes: true,
            series: {
              select: {
                id: true,
                title: true,
                slug: true,
                category: true,
                level: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    return submissions.map((sub) => ({
      ...sub,
      lab: sub.lab
        ? {
            ...sub.lab,
            difficulty: sub.lab.series?.level || 'beginner',
          }
        : undefined,
    }));
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

    const mapped = this.mapDtoToLabPersistence(dto);

    return this.prisma.lab.create({
      data: {
        ...mapped,
        slug: targetSlug,
        authorId: user.userId,
        status,
        version: 'v1.0',
      } as any,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  private mapDtoToLabPersistence(dto: CreateLabDto | UpdateLabDto): Record<string, any> {
    const {
      sqlSchema,
      sampleData,
      expectedQueryResult,
      quizQuestions,
      config,
      ...rest
    } = dto;

    let existingObjectiveParsed: Record<string, any> = {};
    if (rest.objective && typeof rest.objective === 'string') {
      try {
        const parsed = JSON.parse(rest.objective);
        if (typeof parsed === 'object' && parsed !== null) {
          existingObjectiveParsed = parsed;
        }
      } catch {
        existingObjectiveParsed = { summary: rest.objective };
      }
    }

    const envelopeConfig: Record<string, any> = {
      ...existingObjectiveParsed,
      ...(config || {}),
    };
    if (sqlSchema) envelopeConfig.sqlSchema = sqlSchema;
    if (sampleData) envelopeConfig.sampleData = sampleData;
    if (expectedQueryResult) envelopeConfig.expectedQueryResult = expectedQueryResult;
    if (quizQuestions) {
      envelopeConfig.quizQuestions = quizQuestions;
      envelopeConfig.quizList = quizQuestions;
    }

    const hasCustomConfig =
      sqlSchema ||
      sampleData ||
      expectedQueryResult ||
      quizQuestions ||
      config;

    const finalObjective = hasCustomConfig
      ? JSON.stringify(envelopeConfig)
      : rest.objective;

    return {
      ...rest,
      objective: finalObjective,
    };
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
    const mapped = this.mapDtoToLabPersistence(dto);
    const updateData: any = { ...mapped };
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

    await this.validateSqlLabForRelease(lab);

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
