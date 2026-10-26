import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ReviewService } from '../src/modules/review/review.service';
import { ContentLifecycleStatus } from '@prisma/client';

describe('PB-21 / PB-14 / Decision D-07: Admin Review Archive & Governance Suite', () => {
  it('ReviewService.archive archives series and records audit log', async () => {
    let updatedStatus: any = null;
    let updatedActive: any = null;
    let auditAction: string | null = null;

    const mockPrisma: any = {
      labSeries: {
        findUnique: async () => ({ id: 'series-1', title: 'PostgreSQL Deep Dive' }),
        update: async ({ data }: any) => {
          updatedStatus = data.status;
          updatedActive = data.isActive;
          return { id: 'series-1', title: 'PostgreSQL Deep Dive', ...data };
        },
      },
    };

    const mockAudit: any = {
      log: async (entry: any) => {
        auditAction = entry.action;
      },
    };

    const reviewService = new ReviewService(mockPrisma, mockAudit, {} as any);

    const res = await reviewService.archive('series', 'series-1', 'admin-id-1', 'Deprecated content');

    assert.equal(res.item.status, ContentLifecycleStatus.archived);
    assert.equal(updatedStatus, ContentLifecycleStatus.archived);
    assert.equal(updatedActive, false, 'Archived content must have isActive=false');
    assert.equal(auditAction, 'ARCHIVE_CONTENT', 'Must record ARCHIVE_CONTENT in audit logs');
  });

  it('ReviewService.archive archives lab and records audit log', async () => {
    let updatedStatus: any = null;
    let updatedActive: any = null;
    let auditAction: string | null = null;

    const mockPrisma: any = {
      lab: {
        findUnique: async () => ({ id: 'lab-1', title: 'Window Functions Practice' }),
        update: async ({ data }: any) => {
          updatedStatus = data.status;
          updatedActive = data.isActive;
          return { id: 'lab-1', title: 'Window Functions Practice', ...data };
        },
      },
    };

    const mockAudit: any = {
      log: async (entry: any) => {
        auditAction = entry.action;
      },
    };

    const reviewService = new ReviewService(mockPrisma, mockAudit, {} as any);

    const res = await reviewService.archive('lab', 'lab-1', 'admin-id-1', 'Superseded by V3');

    assert.equal(res.item.status, ContentLifecycleStatus.archived);
    assert.equal(updatedStatus, ContentLifecycleStatus.archived);
    assert.equal(updatedActive, false, 'Archived lab must have isActive=false');
    assert.equal(auditAction, 'ARCHIVE_CONTENT', 'Must record ARCHIVE_CONTENT in audit logs');
  });
});
