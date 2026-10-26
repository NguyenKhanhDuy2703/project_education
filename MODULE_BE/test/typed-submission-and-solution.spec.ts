import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LabsService } from '../src/modules/labs/labs.service';
import { BadRequestException } from '@nestjs/common';
import { UserRole, LearningProgressStatus } from '@prisma/client';

describe('PB-11 / PB-12 / PB-13: Typed Submissions and Solution Prerequisite Suite', () => {
  it('LabsService.submit validates submissionType (pull_request requires URL, test_file requires non-empty)', async () => {
    const mockPrisma: any = {
      lab: {
        findUnique: async () => ({
          id: 'lab-pr-1',
          slug: 'github-workflow-lab',
          authorId: 'admin-1',
          status: 'published',
          series: { isProOnly: false },
        }),
      },
      labSubmission: {
        create: async ({ data }: any) => ({ id: 'sub-1', ...data }),
      },
    };

    const mockEntitlements: any = {
      checkUserFeature: async () => ({ hasAccess: true, isBanned: false }),
    };

    const labsService = new LabsService(mockPrisma, mockEntitlements);

    // 1. Invalid PR submission -> throws BadRequestException
    await assert.rejects(
      async () =>
        labsService.submit('lab-pr-1', 'user-1', {
          submissionType: 'pull_request',
          submittedCode: 'not a valid url',
        }),
      (err: any) => err instanceof BadRequestException,
      'Invalid PR URL must throw BadRequestException',
    );

    // 2. Empty test_file submission -> throws BadRequestException
    await assert.rejects(
      async () =>
        labsService.submit('lab-pr-1', 'user-1', {
          submissionType: 'test_file',
          submittedCode: '   ',
        }),
      (err: any) => err instanceof BadRequestException,
      'Empty test_file must throw BadRequestException',
    );
  });

  it('LabsService.findBySlug restricts solution to completed learners or entitled roles', async () => {
    const baseLab = {
      id: 'lab-sql-1',
      slug: 'intro-sql-where',
      title: 'Filtering Rows with WHERE',
      instructions: '# Instructions',
      solution: 'SELECT * FROM customers WHERE country = "Mexico";',
      authorId: 'author-admin',
      isProOnly: false,
      status: 'published',
      series: { id: 's1', title: 'SQL Series', isProOnly: false },
    };

    let userProgressStatus: LearningProgressStatus | null = null;

    const mockPrisma: any = {
      lab: {
        findFirst: async () => baseLab,
        findUnique: async () => baseLab,
      },
      learningUnitProgress: {
        findUnique: async () => {
          if (!userProgressStatus) return null;
          return { status: userProgressStatus, score: 100 };
        },
      },
    };

    const mockEntitlements: any = {
      checkUserFeature: async () => ({ hasAccess: false, isBanned: false }),
    };

    const labsService = new LabsService(mockPrisma, mockEntitlements);

    // Case 1: Regular learner has NOT completed the lab -> solution is null
    userProgressStatus = LearningProgressStatus.IN_PROGRESS;
    const resUnfinished = await labsService.findBySlug('intro-sql-where', {
      userId: 'learner-1',
      role: UserRole.user,
    });
    assert.equal(resUnfinished.solution, null, 'Unfinished learner must not see reference solution');

    // Case 2: Regular learner HAS completed the lab -> solution is revealed
    userProgressStatus = LearningProgressStatus.COMPLETED;
    const resFinished = await labsService.findBySlug('intro-sql-where', {
      userId: 'learner-1',
      role: UserRole.user,
    });
    assert.equal(
      resFinished.solution,
      'SELECT * FROM customers WHERE country = "Mexico";',
      'Completed learner is allowed to view reference solution',
    );

    // Case 3: Admin views lab without completion -> solution is revealed
    userProgressStatus = null;
    const resAdmin = await labsService.findBySlug('intro-sql-where', {
      userId: 'admin-user',
      role: UserRole.admin,
    });
    assert.equal(
      resAdmin.solution,
      'SELECT * FROM customers WHERE country = "Mexico";',
      'Admin can always view reference solution',
    );

    // Case 4 (Task 3.3): Incomplete PRO learner -> solution is null even with PRO entitlement
    userProgressStatus = LearningProgressStatus.IN_PROGRESS;
    mockEntitlements.checkUserFeature = async () => ({ hasAccess: true, isBanned: false });
    const resProIncomplete = await labsService.findBySlug('intro-sql-where', {
      userId: 'pro-learner-1',
      role: UserRole.userPro,
    });
    assert.equal(
      resProIncomplete.solution,
      null,
      'Incomplete Pro learner must NOT view reference solution prior to completion',
    );

    // Case 5: Author views own lab without completion -> solution is revealed
    userProgressStatus = null;
    const resAuthor = await labsService.findBySlug('intro-sql-where', {
      userId: 'author-admin',
      role: UserRole.contributor,
    });
    assert.equal(
      resAuthor.solution,
      'SELECT * FROM customers WHERE country = "Mexico";',
      'Author can view reference solution for own lab',
    );

    // Case 6: Completed learner with explicit solution ban (isBanned: true) -> solution remains null
    userProgressStatus = LearningProgressStatus.COMPLETED;
    mockEntitlements.checkUserFeature = async () => ({ hasAccess: false, isBanned: true });
    const resBannedLearner = await labsService.findBySlug('intro-sql-where', {
      userId: 'banned-learner-1',
      role: UserRole.user,
    });
    assert.equal(
      resBannedLearner.solution,
      null,
      'Learner with solution ban must NOT view reference solution even after completion',
    );
  });
});
