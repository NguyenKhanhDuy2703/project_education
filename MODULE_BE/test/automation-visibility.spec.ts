import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SeriesService } from '../src/modules/series/series.service';
import { LabsService } from '../src/modules/labs/labs.service';
import { UserRole, ContentLifecycleStatus } from '@prisma/client';

describe('Automation Content Reversible Visibility & RBAC Enforcement Suite', () => {
  let prevFlag: string | undefined;

  beforeEach(() => {
    prevFlag = process.env.FEATURE_AUTOMATION_CONTENT_ENABLED;
    delete process.env.FEATURE_AUTOMATION_CONTENT_ENABLED;
  });

  afterEach(() => {
    if (prevFlag !== undefined) {
      process.env.FEATURE_AUTOMATION_CONTENT_ENABLED = prevFlag;
    } else {
      delete process.env.FEATURE_AUTOMATION_CONTENT_ENABLED;
    }
  });

  const mockSeriesData = [
    {
      id: 'series-sql-v3-mastery',
      slug: 'postgresql-business-scenarios',
      title: 'PostgreSQL Business Labs',
      category: 'database',
      isActive: true,
      status: ContentLifecycleStatus.published,
      orderIndex: 1,
      authorId: 'admin-1',
      author: { id: 'admin-1', name: 'Admin User', role: UserRole.admin },
      sections: [],
      labs: [
        {
          id: 'lab-sql-01',
          slug: 'sql-v3-01-failed-orders',
          title: 'SQL Lab 1',
          sandboxType: 'sql_worker',
          unitType: 'sql_practice',
          isActive: true,
          status: ContentLifecycleStatus.published,
          orderIndex: 1,
        },
      ],
      _count: { labs: 1 },
    },
    {
      id: 'series-quiz-v3-certification',
      slug: 'testing-theory-scenario-quiz',
      title: 'Testing Theory Quiz',
      category: 'testing',
      isActive: true,
      status: ContentLifecycleStatus.published,
      orderIndex: 2,
      authorId: 'admin-1',
      author: { id: 'admin-1', name: 'Admin User', role: UserRole.admin },
      sections: [],
      labs: [
        {
          id: 'lab-quiz-01',
          slug: 'quiz-v3-01-principles',
          title: 'Quiz 1',
          sandboxType: 'quizlet',
          unitType: 'quiz_checkpoint',
          isActive: true,
          status: ContentLifecycleStatus.published,
          orderIndex: 1,
        },
      ],
      _count: { labs: 1 },
    },
    {
      id: 'series-auto-v3-playwright',
      slug: 'playwright-low-code-automation',
      title: 'Playwright Automation Labs',
      category: 'testing',
      isActive: true,
      status: ContentLifecycleStatus.published,
      orderIndex: 3,
      authorId: 'contributor-1',
      author: { id: 'contributor-1', name: 'Contributor User', role: UserRole.contributor },
      sections: [],
      labs: [
        {
          id: 'lab-auto-01',
          slug: 'lab-auto-v3-01',
          title: 'Playwright Lab 1',
          sandboxType: 'automation_v3',
          unitType: 'automation_lab',
          isActive: true,
          status: ContentLifecycleStatus.published,
          orderIndex: 1,
        },
      ],
      _count: { labs: 1 },
    },
  ];

  it('filters out automation series in public catalog for ordinary learners', async () => {
    const mockPrisma: any = {
      labSeries: {
        findMany: async () => mockSeriesData,
      },
    };

    const service = new SeriesService(mockPrisma);

    // Anonymous learner
    const publicCatalog = await service.findAll(false, undefined);
    assert.equal(publicCatalog.length, 2);
    assert.deepEqual(
      publicCatalog.map((s) => s.slug),
      ['postgresql-business-scenarios', 'testing-theory-scenario-quiz']
    );

    // Authenticated regular learner
    const learnerCatalog = await service.findAll(false, { userId: 'u1', role: UserRole.user });
    assert.equal(learnerCatalog.length, 2);
    assert.equal(learnerCatalog.some((s) => s.slug === 'playwright-low-code-automation'), false);
  });

  it('allows admins and contributors to view automation series in catalog', async () => {
    const mockPrisma: any = {
      labSeries: {
        findMany: async () => mockSeriesData,
      },
    };

    const service = new SeriesService(mockPrisma);

    // Admin
    const adminCatalog = await service.findAll(false, { userId: 'admin-1', role: UserRole.admin });
    assert.equal(adminCatalog.length, 3);
    assert.ok(adminCatalog.some((s) => s.slug === 'playwright-low-code-automation'));

    // Contributor
    const contribCatalog = await service.findAll(false, { userId: 'contributor-1', role: UserRole.contributor });
    assert.equal(contribCatalog.length, 3);
    assert.ok(contribCatalog.some((s) => s.slug === 'playwright-low-code-automation'));
  });

  it('restricts direct series lookup (findBySlug) for learners while allowing admins and contributors', async () => {
    const autoSeries = mockSeriesData[2];
    const mockPrisma: any = {
      labSeries: {
        findFirst: async () => autoSeries,
      },
      learningUnitProgress: {
        findMany: async () => [],
      },
      userSavedSeries: {
        findUnique: async () => null,
      },
    };

    const service = new SeriesService(mockPrisma);

    // Learner gets 404 Temporarily Unavailable
    await assert.rejects(
      async () => service.findBySlug('playwright-low-code-automation', { userId: 'u1', role: UserRole.user }),
      { message: 'Topic "playwright-low-code-automation" is temporarily unavailable' }
    );

    // Admin succeeds
    const adminResult = await service.findBySlug('playwright-low-code-automation', { userId: 'admin-1', role: UserRole.admin });
    assert.equal(adminResult.id, 'series-auto-v3-playwright');

    // Contributor author succeeds
    const contribResult = await service.findBySlug('playwright-low-code-automation', { userId: 'contributor-1', role: UserRole.contributor });
    assert.equal(contribResult.id, 'series-auto-v3-playwright');
  });

  it('restricts direct lab lookup (findBySlug) for learners while allowing admins and contributors', async () => {
    const autoLab = {
      id: 'lab-auto-01',
      slug: 'lab-auto-v3-01',
      title: 'Playwright Lab 1',
      sandboxType: 'automation_v3',
      unitType: 'automation_lab',
      status: ContentLifecycleStatus.published,
      isProOnly: false,
      isFreePreview: true,
      authorId: 'contributor-1',
      series: { id: 'series-auto-v3-playwright', slug: 'playwright-low-code-automation', isProOnly: false },
      instructions: 'Test instructions',
      solution: 'Test solution',
    };

    const mockPrisma: any = {
      lab: {
        findFirst: async () => autoLab,
        findUnique: async () => autoLab,
      },
      learningUnitProgress: {
        findUnique: async () => null,
      },
    };

    const mockEntitlements: any = {
      checkUserFeature: async () => ({ hasAccess: true, isBanned: false }),
    };

    const service = new LabsService(mockPrisma, mockEntitlements);

    // Learner gets 404 Temporarily Unavailable
    await assert.rejects(
      async () => service.findBySlug('lab-auto-v3-01', { userId: 'u1', role: UserRole.user }),
      { message: 'Practice Lab "lab-auto-v3-01" is temporarily unavailable' }
    );

    // Admin succeeds
    const adminLab = await service.findBySlug('lab-auto-v3-01', { userId: 'admin-1', role: UserRole.admin });
    assert.equal(adminLab.id, 'lab-auto-01');

    // Contributor author succeeds
    const contribLab = await service.findBySlug('lab-auto-v3-01', { userId: 'contributor-1', role: UserRole.contributor });
    assert.equal(contribLab.id, 'lab-auto-01');
  });

  it('filters out automation series in getSavedSeries for learners without deleting the bookmark record', async () => {
    const savedRecords = [
      {
        id: 'bookmark-1',
        userId: 'u1',
        createdAt: new Date(),
        series: mockSeriesData[0], // PostgreSQL
      },
      {
        id: 'bookmark-2',
        userId: 'u1',
        createdAt: new Date(),
        series: mockSeriesData[2], // Playwright
      },
    ];

    const mockPrisma: any = {
      userSavedSeries: {
        findMany: async () => savedRecords,
      },
    };

    const service = new SeriesService(mockPrisma);

    // Learner only sees the SQL series
    const learnerSaved = await service.getSavedSeries('u1', { userId: 'u1', role: UserRole.user });
    assert.equal(learnerSaved.length, 1);
    assert.equal(learnerSaved[0].slug, 'postgresql-business-scenarios');

    // Admin sees both
    const adminSaved = await service.getSavedSeries('u1', { userId: 'admin-1', role: UserRole.admin });
    assert.equal(adminSaved.length, 2);
  });

  it('blocks submissions to hidden automation labs by ordinary learners', async () => {
    const autoLab = {
      id: 'lab-auto-01',
      slug: 'lab-auto-v3-01',
      title: 'Playwright Lab 1',
      sandboxType: 'automation_v3',
      unitType: 'automation_lab',
      status: ContentLifecycleStatus.published,
      isProOnly: false,
      isFreePreview: true,
      authorId: 'contributor-1',
      objective: JSON.stringify({ version: '3.0' }),
      series: { id: 'series-auto-v3-playwright', slug: 'playwright-low-code-automation', isProOnly: false },
    };

    const mockPrisma: any = {
      lab: {
        findUnique: async () => autoLab,
        findFirst: async () => autoLab,
      },
      user: {
        findUnique: async () => ({ id: 'u1', role: UserRole.user }),
      },
      labSubmission: {
        create: async ({ data }: any) => ({ id: 'sub-1', ...data }),
      },
    };

    const mockEntitlements: any = {
      checkUserFeature: async () => ({ hasAccess: true, isBanned: false }),
    };

    const service = new LabsService(mockPrisma, mockEntitlements);

    await assert.rejects(
      async () =>
        service.submit('lab-auto-01', 'u1', {
          submittedCode: 'code',
          submissionType: 'code',
        }, { userId: 'u1', role: UserRole.user }),
      { message: 'Practice Lab "lab-auto-v3-01" is temporarily unavailable for submissions' }
    );
  });

  it('reactivates all automation content for everyone when FEATURE_AUTOMATION_CONTENT_ENABLED is true', async () => {
    process.env.FEATURE_AUTOMATION_CONTENT_ENABLED = 'true';

    const mockPrisma: any = {
      labSeries: {
        findMany: async () => mockSeriesData,
        findFirst: async () => mockSeriesData[2],
      },
      learningUnitProgress: {
        findMany: async () => [],
      },
      userSavedSeries: {
        findUnique: async () => null,
      },
    };

    const service = new SeriesService(mockPrisma);

    // Learner can now see all 3 series in catalog
    const publicCatalog = await service.findAll(false, undefined);
    assert.equal(publicCatalog.length, 3);
    assert.ok(publicCatalog.some((s) => s.slug === 'playwright-low-code-automation'));

    // Learner can now look up the series directly
    const series = await service.findBySlug('playwright-low-code-automation', { userId: 'u1', role: UserRole.user });
    assert.equal(series.id, 'series-auto-v3-playwright');
  });
});
