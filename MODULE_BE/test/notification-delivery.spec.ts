import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { ReviewService } from '../src/modules/review/review.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContentLifecycleStatus, NotificationType, UserRole } from '@prisma/client';

describe('Task 4: Persistent Notifications, Business Events & Expiry Worker Suite', () => {
  describe('Subtask 4.1: Owner Inbox, Security & Review Event Integration', () => {
    it('markAsRead strictly denies cross-user access with ForbiddenException', async () => {
      const mockPrisma: any = {
        notification: {
          findUnique: async ({ where }: any) => {
            if (where.id === 'notif-other-user') {
              return { id: 'notif-other-user', userId: 'victim-user-1', readAt: null };
            }
            return null;
          },
        },
      };

      const notificationsService = new NotificationsService(mockPrisma);

      // Attempt by intruder-user to mark victim-user-1's notification as read
      await assert.rejects(
        async () => notificationsService.markAsRead('intruder-user', 'notif-other-user'),
        (err: any) => err instanceof ForbiddenException && err.message.includes('another user'),
        'Must forbid cross-user notification mutation',
      );
    });

    it('createNotification deduplicates events using unique eventKey', async () => {
      const upsertedKeys: string[] = [];
      const mockPrisma: any = {
        notification: {
          upsert: async ({ where, create }: any) => {
            upsertedKeys.push(where.eventKey);
            return { id: 'notif-1', ...create };
          },
        },
      };

      const notificationsService = new NotificationsService(mockPrisma);

      // Call twice with same eventKey
      await notificationsService.createNotification({
        userId: 'user-1',
        type: NotificationType.UPGRADE_APPROVED,
        title: 'Upgrade Success',
        body: 'Your Pro plan is active',
        eventKey: 'unique-upgrade-key-1',
      });

      await notificationsService.createNotification({
        userId: 'user-1',
        type: NotificationType.UPGRADE_APPROVED,
        title: 'Upgrade Success',
        body: 'Your Pro plan is active',
        eventKey: 'unique-upgrade-key-1',
      });

      assert.equal(upsertedKeys.length, 2);
      assert.equal(upsertedKeys[0], 'unique-upgrade-key-1');
      assert.equal(upsertedKeys[1], 'unique-upgrade-key-1');
    });

    it('Review events reach the affected author with correct event types and links', async () => {
      const sentNotifications: any[] = [];
      const mockNotificationsService: any = {
        createNotification: async (params: any) => {
          sentNotifications.push(params);
          return { id: 'notif-rev-1', ...params };
        },
      };

      const mockPrisma: any = {
        lab: {
          findUnique: async () => ({
            id: 'lab-101',
            title: 'Advanced Testing Lab',
            slug: 'advanced-testing-lab',
            authorId: 'contributor-42',
          }),
          update: async ({ data }: any) => ({
            id: 'lab-101',
            title: 'Advanced Testing Lab',
            slug: 'advanced-testing-lab',
            authorId: 'contributor-42',
            status: data.status,
            updatedAt: new Date(1700000000000),
          }),
        },
      };

      const mockAudit: any = { log: async () => {} };
      const reviewService = new ReviewService(mockPrisma, mockAudit, undefined, mockNotificationsService);

      // 1. Approve
      await reviewService.approve('lab', 'lab-101', 'admin-1');
      assert.equal(sentNotifications.length, 1);
      assert.equal(sentNotifications[0].userId, 'contributor-42');
      assert.equal(sentNotifications[0].type, NotificationType.CONTENT_REVIEW_APPROVED);
      assert.ok(sentNotifications[0].actionPath.includes('/studio/labs/lab-101'));

      // 2. Request changes
      await reviewService.requestChanges('lab', 'lab-101', 'Please fix step 3', 'admin-1');
      assert.equal(sentNotifications.length, 2);
      assert.equal(sentNotifications[1].userId, 'contributor-42');
      assert.equal(sentNotifications[1].type, NotificationType.CONTENT_REVIEW_CHANGES_REQUESTED);

      // 3. Reject
      await reviewService.reject('lab', 'lab-101', 'Topic does not fit syllabus', 'admin-1');
      assert.equal(sentNotifications.length, 3);
      assert.equal(sentNotifications[2].userId, 'contributor-42');
      assert.equal(sentNotifications[2].type, NotificationType.CONTENT_REVIEW_REJECTED);

      // 4. Publish
      await reviewService.publish('lab', 'lab-101', 'admin-1');
      assert.equal(sentNotifications.length, 4);
      assert.equal(sentNotifications[3].userId, 'contributor-42');
      assert.equal(sentNotifications[3].type, NotificationType.CONTENT_REVIEW_PUBLISHED);
      assert.ok(sentNotifications[3].actionPath.includes('/labs/advanced-testing-lab'));
    });
  });

  describe('Subtask 4.2: Expiry Worker & Restartable Announcement Batches', () => {
    it('Overlapping workers coordinate via database lease and skip redundant runs', async () => {
      const mockPrisma: any = {
        $transaction: async (fn: any) => fn(mockPrisma),
        scheduledJobLease: {
          findUnique: async () => ({
            jobName: 'membership-expiry-check',
            lockedBy: 'worker-instance-A',
            lockedAt: new Date(),
            expiresAt: new Date(Date.now() + 50000), // Active lease in future
          }),
        },
      };

      const notificationsService = new NotificationsService(mockPrisma);

      // Worker instance B tries to run while instance A holds lease
      const result = await notificationsService.processMembershipExpirations('worker-instance-B');
      assert.equal(result.skipped, true);
      assert.equal(result.reason, 'Lease held by another worker instance');
    });

    it('Notifies subscriptions expiring within 3 days and demotes expired accounts', async () => {
      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 2 * 86400000);
      const yesterday = new Date(now.getTime() - 86400000);

      const createdNotifications: any[] = [];
      const updatedUserRoles: any[] = [];

      const mockPrisma: any = {
        $transaction: async (fn: any) => fn(mockPrisma),
        scheduledJobLease: {
          findUnique: async () => null, // Lease available
          upsert: async () => ({}),
          update: async () => ({}),
        },
        userSubscription: {
          findMany: async ({ where }: any) => {
            if (where.endDate?.gt) {
              // Expiring soon query
              return [
                {
                  id: 'sub-exp-soon-1',
                  userId: 'user-soon-1',
                  endDate: twoDaysFromNow,
                  plan: { name: 'Pro Monthly' },
                  user: { id: 'user-soon-1', role: UserRole.userPro },
                },
              ];
            }
            if (where.endDate?.lte) {
              // Expired query
              return [
                {
                  id: 'sub-expired-1',
                  userId: 'user-expired-1',
                  endDate: yesterday,
                  plan: { name: 'Pro Monthly' },
                  user: { id: 'user-expired-1', role: UserRole.userPro },
                },
              ];
            }
            return [];
          },
          update: async () => ({}),
          count: async () => 0, // No remaining active subscriptions
        },
        user: {
          update: async ({ data }: any) => {
            updatedUserRoles.push(data.role);
          },
        },
        notification: {
          upsert: async ({ create }: any) => {
            createdNotifications.push(create);
            return { id: 'notif-upserted', ...create };
          },
          create: async ({ data }: any) => {
            createdNotifications.push(data);
            return { id: 'notif-created', ...data };
          },
        },
      };

      const notificationsService = new NotificationsService(mockPrisma);

      const result = await notificationsService.processMembershipExpirations('worker-instance-A');
      assert.equal(result.success, true);
      assert.equal(result.expiringSoonCount, 1);
      assert.equal(result.expiredCount, 1);

      // Verify demotion from userPro to user
      assert.equal(updatedUserRoles[0], 'user');

      // Verify created notifications
      assert.ok(
        createdNotifications.some((n) => n.type === NotificationType.MEMBERSHIP_EXPIRING_SOON),
        'Must create 3-day expiring soon notification',
      );
      assert.ok(
        createdNotifications.some((n) => n.type === NotificationType.MEMBERSHIP_EXPIRED),
        'Must create expired notification',
      );
    });

    it('Admin announcements validate relative internal actionPath and deliver in batches', async () => {
      let announcementCreated: any = null;
      const recipientDeliveries: any[] = [];

      const mockPrisma: any = {
        $transaction: async (fn: any) => fn(mockPrisma),
        user: {
          findMany: async () => [
            { id: 'user-1' },
            { id: 'user-2' },
          ],
        },
        announcement: {
          create: async ({ data }: any) => {
            announcementCreated = { id: 'ann-1', ...data };
            return announcementCreated;
          },
          update: async ({ data }: any) => ({ ...announcementCreated, ...data }),
        },
        notification: {
          upsert: async ({ create }: any) => create,
        },
        announcementRecipient: {
          upsert: async ({ create }: any) => {
            recipientDeliveries.push(create);
            return create;
          },
        },
      };

      const notificationsService = new NotificationsService(mockPrisma);

      // 1. Rejects external URL in actionPath
      await assert.rejects(
        async () =>
          notificationsService.createAndProcessAnnouncement('admin-1', {
            title: 'Phishing Attempt',
            body: 'Click here',
            actionPath: 'https://malicious-external-site.com',
          }),
        (err: any) => err instanceof BadRequestException,
        'Must reject external actionPath',
      );

      // 2. Valid relative route succeeds
      const result = await notificationsService.createAndProcessAnnouncement('admin-1', {
        title: 'Chào mừng thành viên mới',
        body: 'Khóa học SQL nâng cao đã mở',
        actionPath: '/series/sql-mastery',
        targetAudience: 'ALL',
      });

      assert.equal(result.status, 'COMPLETED');
      assert.equal(recipientDeliveries.length, 2);
    });
  });
});
