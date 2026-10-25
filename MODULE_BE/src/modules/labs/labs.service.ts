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
import { ContentLifecycleStatus, LearningProgressStatus, LearningUnitType, UserRole } from '@prisma/client';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { SubmitLabDto } from './dto/submit-lab.dto';
import { SqlLabConfig, DEFAULT_SQL_POLICY } from './domain/sql-lab.types';
import { SqlGradingService } from './sql-grading.service';
import { SqlPreflightDto } from './dto/sql-preflight.dto';
import { validateV3AutomationSubmission } from './automation-v3-validator';
import { UpdatePositionDto, CompleteTheoryDto } from './dto/theory-progress.dto';
import { inferLearningUnitType } from './domain/labContentCodec';
import { QuizGradingService } from './quiz-grading.service';

@Injectable()
export class LabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
    @Optional() private readonly sqlGradingService: SqlGradingService = new SqlGradingService(),
    @Optional() private readonly quizGradingService: QuizGradingService = new QuizGradingService(),
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
            if (config.questions) quizQuestions = config.questions;
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
              delete sanitized.gradingKey;
              delete sanitized.solutionPlan;
              delete sanitized.serverGradingRules;
              extractedConfig = sanitized;
              expectedQueryResult = undefined;
            } else {
              extractedConfig = config;
            }
          }
        }
      } catch {}
    }

    // Sanitize quiz questions for non-author learners (prevent answer leaking)
    if (!isAuthorizedAuthorOrAdmin) {
      const sanitizeQuestionItem = (q: any) => {
        if (!q || typeof q !== 'object') return q;
        const { correctIndex, explanation, hint, gradingKey, ...sanitizedQ } = q;
        return sanitizedQ;
      };

      if (Array.isArray(quizQuestions)) {
        quizQuestions = quizQuestions.map(sanitizeQuestionItem);
      }
      if (extractedConfig?.questions && Array.isArray(extractedConfig.questions)) {
        extractedConfig.questions = extractedConfig.questions.map(sanitizeQuestionItem);
      }
      if (extractedConfig?.quizQuestions && Array.isArray(extractedConfig.quizQuestions)) {
        extractedConfig.quizQuestions = extractedConfig.quizQuestions.map(sanitizeQuestionItem);
      }
      if (extractedConfig?.quizList && Array.isArray(extractedConfig.quizList)) {
        extractedConfig.quizList = extractedConfig.quizList.map(sanitizeQuestionItem);
      }
    }

    const unitType = inferLearningUnitType(lab.unitType, lab.sandboxType);

    let progress = null;
    if (currentUser?.userId && this.prisma.learningUnitProgress) {
      const pr = await this.prisma.learningUnitProgress.findUnique({
        where: {
          userId_labId: {
            userId: currentUser.userId,
            labId: lab.id,
          },
        },
      });
      if (pr) {
        progress = {
          status: pr.status,
          score: pr.score,
          completedAt: pr.completedAt,
          lastPosition: pr.lastPosition,
        };
      }
    }

    return {
      ...publicFields,
      unitType,
      progress,
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
    let authoritativeResult: {
      status: string;
      timeMs: number;
      testLogs?: string | null;
      scorePercentage?: number;
      review?: any;
    } = {
      status: payload.status || 'failed',
      timeMs: payload.timeMs || 0,
      testLogs: payload.testLogs || null,
    };

    if (lab.sandboxType === 'sql_worker' || lab.unitType === LearningUnitType.sql_practice) {
      authoritativeResult = await this.sqlGradingService.grade({
        submittedCode: payload.submittedCode || '',
        solution: lab.solution,
        config: this.getSqlLabConfig(lab.objective),
      });
    } else if (
      lab.sandboxType === 'quizlet' ||
      lab.unitType === LearningUnitType.quiz_checkpoint
    ) {
      const graded = this.quizGradingService.grade({
        submittedCode: payload.submittedCode,
        objective: lab.objective,
      });
      authoritativeResult = {
        status: graded.status,
        timeMs: graded.timeMs,
        testLogs: graded.testLogs,
        scorePercentage: graded.scorePercentage,
        review: graded.review,
      };
    } else if (
      (lab.sandboxType === 'automation_v3' ||
        lab.sandboxType === 'js_worker' ||
        lab.unitType === LearningUnitType.automation_lab) &&
      lab.objective
    ) {
      try {
        const parsed = JSON.parse(lab.objective);
        const config = parsed.config && typeof parsed.config === 'object' ? { ...parsed, ...parsed.config } : parsed;
        if (config.version === '3.0' || lab.sandboxType === 'automation_v3' || lab.unitType === LearningUnitType.automation_lab) {
          authoritativeResult = validateV3AutomationSubmission(payload.submittedCode || '', config);
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
      }
    }

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

    // Synchronize common unit progress
    if (this.prisma.learningUnitProgress) {
      const isPassed = authoritativeResult.status === 'passed';
      const scoreVal = authoritativeResult.scorePercentage ?? (isPassed ? 100 : 0);

      if (isPassed) {
        await this.prisma.learningUnitProgress.upsert({
          where: {
            userId_labId: {
              userId,
              labId: lab.id,
            },
          },
          create: {
            userId,
            labId: lab.id,
            status: LearningProgressStatus.COMPLETED,
            score: scoreVal,
            completedAt: new Date(),
          },
          update: {
            status: LearningProgressStatus.COMPLETED,
            score: scoreVal,
            completedAt: new Date(),
          },
        });
      } else {
        const existing = await this.prisma.learningUnitProgress.findUnique({
          where: {
            userId_labId: {
              userId,
              labId: lab.id,
            },
          },
        });
        if (!existing) {
          await this.prisma.learningUnitProgress.create({
            data: {
              userId,
              labId: lab.id,
              status: LearningProgressStatus.IN_PROGRESS,
              score: scoreVal,
            },
          });
        } else if (existing.status !== LearningProgressStatus.COMPLETED) {
          await this.prisma.learningUnitProgress.update({
            where: { id: existing.id },
            data: {
              status: LearningProgressStatus.IN_PROGRESS,
              score: scoreVal,
            },
          });
        }
      }
    }

    return {
      message: 'Lab attempt submitted successfully',
      id: submission.id,
      labId: lab.id,
      userId,
      status: submission.status,
      timeMs: submission.executionTimeMs,
      testLogs: submission.testLogs,
      review: authoritativeResult.review || null,
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

  async validateAutomationLabForRelease(lab: { sandboxType: string; unitType?: LearningUnitType | null; objective: string | null }) {
    const isAutomation =
      lab.sandboxType === 'automation_v3' ||
      lab.sandboxType === 'js_worker' ||
      lab.unitType === LearningUnitType.automation_lab;
    if (!isAutomation) return;
    if (!lab.objective?.trim()) {
      throw new BadRequestException('Automation lab requires configuration with grading rules or grading key.');
    }
    let config: Record<string, any>;
    try {
      const parsed = JSON.parse(lab.objective);
      config = parsed?.config && typeof parsed.config === 'object' ? { ...parsed, ...parsed.config } : parsed;
    } catch {
      throw new BadRequestException('Automation lab configuration is invalid JSON.');
    }
    const hasGradingRules = Array.isArray(config.gradingRules) && config.gradingRules.length > 0;
    const hasGradingKey =
      config.gradingKey &&
      typeof config.gradingKey === 'object' &&
      ((Array.isArray(config.gradingKey.requiredSteps) && config.gradingKey.requiredSteps.length > 0) ||
        (Array.isArray(config.gradingKey.forbiddenPatterns) && config.gradingKey.forbiddenPatterns.length > 0));
    if (!hasGradingRules && !hasGradingKey) {
      throw new BadRequestException('Automation lab requires grading rules or grading key before review or publication.');
    }
  }

  async validateQuizLabForRelease(lab: { sandboxType: string; unitType?: LearningUnitType | null; objective: string | null }) {
    const isQuiz =
      lab.sandboxType === 'quizlet' ||
      lab.unitType === LearningUnitType.quiz_checkpoint;
    if (!isQuiz) return;
    if (!lab.objective?.trim()) {
      throw new BadRequestException('Quiz checkpoint requires configuration with questions.');
    }
    let parsed: any;
    try {
      parsed = JSON.parse(lab.objective);
    } catch {
      throw new BadRequestException('Quiz checkpoint configuration is invalid JSON.');
    }
    const questions =
      parsed?.config?.questions ||
      parsed?.questions ||
      parsed?.quizQuestions ||
      parsed?.quizList ||
      (Array.isArray(parsed) ? parsed : []);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('Quiz checkpoint requires at least one question before review or publication.');
    }
    for (const q of questions) {
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0) {
        throw new BadRequestException(
          `Quiz question "${q.id || q.question || 'unknown'}" is missing a valid correctIndex.`,
        );
      }
    }
  }

  private async findLabEntity(idOrSlug: string) {
    const lab = await this.prisma.lab.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!lab) {
      throw new NotFoundException(`Lab "${idOrSlug}" not found`);
    }
    return lab;
  }

  async getLearningProgress(labIdOrSlug: string, userId: string) {
    const lab = await this.findLabEntity(labIdOrSlug);
    const progress = await this.prisma.learningUnitProgress.findUnique({
      where: {
        userId_labId: {
          userId,
          labId: lab.id,
        },
      },
    });

    if (!progress) {
      return {
        labId: lab.id,
        userId,
        status: LearningProgressStatus.NOT_STARTED,
        lastPosition: null,
        score: null,
        completedAt: null,
      };
    }

    return progress;
  }

  async startTheoryProgress(labIdOrSlug: string, userId: string) {
    const lab = await this.findLabEntity(labIdOrSlug);
    const existing = await this.prisma.learningUnitProgress.findUnique({
      where: {
        userId_labId: {
          userId,
          labId: lab.id,
        },
      },
    });

    if (existing) {
      if (existing.status === LearningProgressStatus.NOT_STARTED) {
        return this.prisma.learningUnitProgress.update({
          where: { id: existing.id },
          data: { status: LearningProgressStatus.IN_PROGRESS },
        });
      }
      return existing;
    }

    return this.prisma.learningUnitProgress.create({
      data: {
        userId,
        labId: lab.id,
        status: LearningProgressStatus.IN_PROGRESS,
      },
    });
  }

  async updateTheoryPosition(labIdOrSlug: string, userId: string, dto: UpdatePositionDto) {
    const lab = await this.findLabEntity(labIdOrSlug);
    return this.prisma.learningUnitProgress.upsert({
      where: {
        userId_labId: {
          userId,
          labId: lab.id,
        },
      },
      create: {
        userId,
        labId: lab.id,
        status: LearningProgressStatus.IN_PROGRESS,
        lastPosition: dto ? { ...dto } : undefined,
      },
      update: {
        lastPosition: dto ? { ...dto } : undefined,
      },
    });
  }

  async completeTheoryProgress(labIdOrSlug: string, userId: string, dto?: CompleteTheoryDto) {
    const lab = await this.findLabEntity(labIdOrSlug);
    const score = dto?.score !== undefined ? dto.score : 100;

    return this.prisma.learningUnitProgress.upsert({
      where: {
        userId_labId: {
          userId,
          labId: lab.id,
        },
      },
      create: {
        userId,
        labId: lab.id,
        status: LearningProgressStatus.COMPLETED,
        score,
        completedAt: new Date(),
      },
      update: {
        status: LearningProgressStatus.COMPLETED,
        score,
        completedAt: new Date(),
      },
    });
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
    await this.validateAutomationLabForRelease(lab);
    await this.validateQuizLabForRelease(lab);

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

  async getDashboardStats(userId: string) {
    // 1. Total active and published labs
    const totalLabs = await this.prisma.lab.count({
      where: {
        isActive: true,
        status: ContentLifecycleStatus.published,
      },
    });

    // 2. Submissions by this user
    const submissions = await this.prisma.labSubmission.findMany({
      where: { userId },
      select: {
        labId: true,
        status: true,
        createdAt: true,
        lab: {
          select: {
            id: true,
            seriesId: true,
            isActive: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count unique passed labs among published & active labs
    const passedLabIds = new Set<string>();
    submissions.forEach((sub) => {
      if (
        sub.status === 'passed' &&
        sub.lab?.isActive &&
        sub.lab?.status === ContentLifecycleStatus.published
      ) {
        passedLabIds.add(sub.labId);
      }
    });

    // Also include completed learning unit progress (theory lessons and completed units)
    if (this.prisma.learningUnitProgress) {
      const completedProgress = await this.prisma.learningUnitProgress.findMany({
        where: {
          userId,
          status: LearningProgressStatus.COMPLETED,
          lab: {
            isActive: true,
            status: ContentLifecycleStatus.published,
          },
        },
        select: { labId: true },
      });
      completedProgress.forEach((p) => passedLabIds.add(p.labId));
    }

    const totalCompleted = Math.min(passedLabIds.size, totalLabs);

    // 3. Consecutive day streak based on submission dates (UTC calendar day)
    let streakDays = 0;
    if (submissions.length > 0) {
      const uniqueDays = Array.from(
        new Set(
          submissions.map((s) => s.createdAt.toISOString().slice(0, 10)),
        ),
      ).sort((a, b) => b.localeCompare(a)); // desc

      if (uniqueDays.length > 0) {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        let checkDate: Date | null = null;
        if (uniqueDays[0] === todayStr) {
          checkDate = now;
        } else if (uniqueDays[0] === yesterdayStr) {
          checkDate = yesterday;
        }

        if (checkDate) {
          const daySet = new Set(uniqueDays);
          let currentDay = new Date(checkDate);
          while (true) {
            const dateStr = currentDay.toISOString().slice(0, 10);
            if (daySet.has(dateStr)) {
              streakDays++;
              currentDay = new Date(currentDay.getTime() - 24 * 60 * 60 * 1000);
            } else {
              break;
            }
          }
        }
      }
    }

    // 4. Series progress
    const seriesList = await this.prisma.labSeries.findMany({
      where: {
        isActive: true,
        status: ContentLifecycleStatus.published,
      },
      select: {
        id: true,
        title: true,
        labs: {
          where: {
            isActive: true,
            status: ContentLifecycleStatus.published,
          },
          select: { id: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    const seriesProgress = seriesList
      .filter((s) => s.labs.length > 0)
      .map((s) => {
        const seriesTotalLabs = s.labs.length;
        const seriesCompletedLabs = s.labs.filter((l) => passedLabIds.has(l.id)).length;
        const percentComplete =
          seriesTotalLabs > 0
            ? Math.round((seriesCompletedLabs / seriesTotalLabs) * 100)
            : 0;
        return {
          seriesId: s.id,
          seriesTitle: s.title,
          completedLabs: seriesCompletedLabs,
          totalLabs: seriesTotalLabs,
          percentComplete,
        };
      });

    return {
      totalCompleted,
      totalLabs,
      streakDays,
      seriesProgress,
    };
  }
}
