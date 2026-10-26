import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SeriesService } from '../src/modules/series/series.service';
import { ContentLifecycleStatus } from '@prisma/client';

describe('PB-23: Saved Series (Bookmarks) Service Specification', () => {
  it('saves a series idempotently and prevents duplicate error', async () => {
    let createdRecord: any = null;
    const mockPrisma = {
      labSeries: {
        findUnique: async ({ where }: any) => ({
          id: where.id,
          title: 'React Fundamentals',
          isActive: true,
          status: ContentLifecycleStatus.published,
        }),
      },
      userSavedSeries: {
        findUnique: async ({ where }: any) => {
          if (createdRecord && createdRecord.seriesId === where.userId_seriesId.seriesId) {
            return createdRecord;
          }
          return null;
        },
        create: async ({ data }: any) => {
          createdRecord = { id: 'saved-1', ...data, createdAt: new Date() };
          return createdRecord;
        },
      },
    };

    const service = new SeriesService(mockPrisma as any);
    const firstSave = await service.saveSeries('user-1', 'series-100');
    assert.equal(firstSave.saved, true);
    assert.equal(firstSave.message, 'Series saved successfully');

    // Second call (idempotent)
    const secondSave = await service.saveSeries('user-1', 'series-100');
    assert.equal(secondSave.saved, true);
    assert.equal(secondSave.message, 'Series already saved');
  });

  it('unsaves a series idempotently', async () => {
    let deletedCount = 0;
    const mockPrisma = {
      userSavedSeries: {
        deleteMany: async ({ where }: any) => {
          deletedCount++;
          return { count: 1 };
        },
      },
    };

    const service = new SeriesService(mockPrisma as any);
    const result = await service.unsaveSeries('user-1', 'series-100');
    assert.equal(result.saved, false);
    assert.equal(deletedCount, 1);
  });

  it('filters out unpublished or deleted series from saved series library', async () => {
    const mockPrisma = {
      userSavedSeries: {
        findMany: async () => [
          {
            id: 'b1',
            createdAt: new Date(),
            series: {
              id: 's1',
              title: 'Published Series',
              isActive: true,
              status: ContentLifecycleStatus.published,
            },
          },
          {
            id: 'b2',
            createdAt: new Date(),
            series: {
              id: 's2',
              title: 'Draft Series (Unpublished)',
              isActive: true,
              status: ContentLifecycleStatus.draft, // Should be filtered out
            },
          },
          {
            id: 'b3',
            createdAt: new Date(),
            series: null, // Deleted series
          },
        ],
      },
    };

    const service = new SeriesService(mockPrisma as any);
    const list = await service.getSavedSeries('user-1');
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 's1');
    assert.equal(list[0].title, 'Published Series');
  });

  it('rejects saving an inactive or non-existent series with NotFoundException', async () => {
    const mockPrisma = {
      labSeries: {
        findUnique: async () => null,
      },
    };

    const service = new SeriesService(mockPrisma as any);
    await assert.rejects(
      async () => {
        await service.saveSeries('user-1', 'invalid-series-id');
      },
      /not found/i
    );
  });
});
