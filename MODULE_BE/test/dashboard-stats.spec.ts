import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ContentLifecycleStatus } from '@prisma/client';
import { LabsService } from '../src/modules/labs/labs.service';

describe('Learner Dashboard Stats API (Task 6 / Subtask 6.1)', () => {
  it('handles zero labs and zero submissions gracefully', async () => {
    const mockPrisma = {
      lab: {
        count: async () => 0,
      },
      labSubmission: {
        findMany: async () => [],
      },
      labSeries: {
        findMany: async () => [],
      },
    };

    const service = new LabsService(mockPrisma as any, {} as any, {} as any);
    const result = await service.getDashboardStats('user-empty');

    assert.deepEqual(result, {
      totalCompleted: 0,
      totalLabs: 0,
      streakDays: 0,
      seriesProgress: [],
    });
  });

  it('does not count failed submissions toward totalCompleted', async () => {
    const mockPrisma = {
      lab: {
        count: async () => 5,
      },
      labSubmission: {
        findMany: async () => [
          {
            labId: 'lab-1',
            status: 'failed',
            createdAt: new Date(),
            lab: { id: 'lab-1', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
          {
            labId: 'lab-2',
            status: 'failed',
            createdAt: new Date(),
            lab: { id: 'lab-2', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
        ],
      },
      labSeries: {
        findMany: async () => [
          {
            id: 's-1',
            title: 'Series 1',
            labs: [{ id: 'lab-1' }, { id: 'lab-2' }],
          },
        ],
      },
    };

    const service = new LabsService(mockPrisma as any, {} as any, {} as any);
    const result = await service.getDashboardStats('user-fails');

    assert.equal(result.totalCompleted, 0);
    assert.equal(result.totalLabs, 5);
    assert.equal(result.seriesProgress[0].completedLabs, 0);
    assert.equal(result.seriesProgress[0].percentComplete, 0);
  });

  it('deduplicates multiple passed attempts on the same lab', async () => {
    const mockPrisma = {
      lab: {
        count: async () => 10,
      },
      labSubmission: {
        findMany: async () => [
          {
            labId: 'lab-1',
            status: 'passed',
            createdAt: new Date(),
            lab: { id: 'lab-1', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
          {
            labId: 'lab-1',
            status: 'passed',
            createdAt: new Date(Date.now() - 3600000),
            lab: { id: 'lab-1', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
          {
            labId: 'lab-2',
            status: 'passed',
            createdAt: new Date(),
            lab: { id: 'lab-2', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
        ],
      },
      labSeries: {
        findMany: async () => [
          {
            id: 's-1',
            title: 'Series 1',
            labs: [{ id: 'lab-1' }, { id: 'lab-2' }, { id: 'lab-3' }, { id: 'lab-4' }],
          },
        ],
      },
    };

    const service = new LabsService(mockPrisma as any, {} as any, {} as any);
    const result = await service.getDashboardStats('user-multi-pass');

    // lab-1 repeated twice + lab-2 once = 2 unique completed labs
    assert.equal(result.totalCompleted, 2);
    assert.equal(result.totalLabs, 10);
    assert.equal(result.seriesProgress[0].completedLabs, 2);
    assert.equal(result.seriesProgress[0].totalLabs, 4);
    assert.equal(result.seriesProgress[0].percentComplete, 50);
  });

  it('ignores passed submissions on unpublished or inactive labs', async () => {
    const mockPrisma = {
      lab: {
        count: async () => 2,
      },
      labSubmission: {
        findMany: async () => [
          {
            labId: 'lab-draft',
            status: 'passed',
            createdAt: new Date(),
            lab: { id: 'lab-draft', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.draft },
          },
          {
            labId: 'lab-inactive',
            status: 'passed',
            createdAt: new Date(),
            lab: { id: 'lab-inactive', seriesId: 's-1', isActive: false, status: ContentLifecycleStatus.published },
          },
        ],
      },
      labSeries: {
        findMany: async () => [],
      },
    };

    const service = new LabsService(mockPrisma as any, {} as any, {} as any);
    const result = await service.getDashboardStats('user-draft');

    assert.equal(result.totalCompleted, 0);
    assert.equal(result.totalLabs, 2);
  });

  it('calculates consecutive-day streaks correctly across day boundaries', async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const mockPrisma = {
      lab: {
        count: async () => 10,
      },
      labSubmission: {
        findMany: async () => [
          {
            labId: 'lab-1',
            status: 'passed',
            createdAt: now,
            lab: { id: 'lab-1', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
          {
            labId: 'lab-2',
            status: 'passed',
            createdAt: oneDayAgo,
            lab: { id: 'lab-2', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
          {
            labId: 'lab-3',
            status: 'passed',
            createdAt: twoDaysAgo,
            lab: { id: 'lab-3', seriesId: 's-1', isActive: true, status: ContentLifecycleStatus.published },
          },
        ],
      },
      labSeries: {
        findMany: async () => [],
      },
    };

    const service = new LabsService(mockPrisma as any, {} as any, {} as any);
    const result = await service.getDashboardStats('user-streak');

    assert.equal(result.streakDays, 3);
  });
});
