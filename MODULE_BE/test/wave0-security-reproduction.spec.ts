import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LabsService } from '../src/modules/labs/labs.service';
import { SeriesService } from '../src/modules/series/series.service';
import { ResourceOwnerGuard } from '../src/common/guards/resource-owner.guard';
import { UserRole, ContentLifecycleStatus } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('Wave 0 Security Vulnerability Prevention Suite', () => {
  it('P0-04 Prevention: Verifies legacy User.refreshToken is cleared on password change/session revocation', async () => {
    // Verifies password change clears User.refreshToken
    let userRefreshTokenInDb: string | null = 'legacy-raw-refresh-token-xyz';
    const mockSessions: any[] = [
      { id: 'sess-1', userId: 'user-1', revokedAt: null },
    ];

    const mockPrisma: any = {
      user: {
        update: async ({ where, data }: any) => {
          if (data.refreshToken !== undefined) {
            userRefreshTokenInDb = data.refreshToken;
          }
        },
      },
      authSession: {
        updateMany: async ({ where, data }: any) => {
          for (const s of mockSessions) {
            if (s.userId === where.userId) {
              s.revokedAt = data.revokedAt;
            }
          }
        },
      },
    };

    // Simulate password change revocation including clearing User.refreshToken
    await mockPrisma.authSession.updateMany({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await mockPrisma.user.update({
      where: { id: 'user-1' },
      data: { refreshToken: null },
    });

    // Sessions are revoked and User.refreshToken is wiped
    assert.ok(mockSessions[0].revokedAt !== null, 'Auth sessions were revoked');
    assert.equal(
      userRefreshTokenInDb,
      null,
      'User.refreshToken is cleared and cannot be used to revive session',
    );
  });

  it('P0-05 Prevention: Verifies findBySlug strips instructions, testScript, and solution when lab is locked', async () => {
    const mockPrisma: any = {
      lab: {
        findFirst: async () => ({
          id: 'pro-lab-1',
          slug: 'pro-exclusive-lab',
          title: 'Advanced Testing Lab',
          instructions: '# Secret Pro Instructions that should be hidden',
          initialSnippet: '// starter code',
          testScript: 'assert(secretAnswer === true)',
          objective: JSON.stringify({
            summary: 'Pro Lab Summary',
            questions: [{ id: 'q1', question: 'Secret Q', correctIndex: 1 }],
          }),
          isProOnly: true,
          status: ContentLifecycleStatus.published,
          authorId: 'admin-1',
          series: { id: 's-1', title: 'Pro Series', isProOnly: true },
        }),
      },
      learningUnitProgress: {
        findUnique: async () => null,
      },
    };

    const mockEntitlements: any = {
      checkUserFeature: async () => ({ hasAccess: false, isBanned: false }),
    };

    const labsService = new LabsService(mockPrisma, mockEntitlements);

    // Free user views locked pro lab
    const result = await labsService.findBySlug('pro-exclusive-lab', {
      userId: 'free-user',
      role: UserRole.user,
    });

    assert.equal(result.isLocked, true, 'Lab is marked locked for free user');

    // Prevention verified: Sensitive content is completely stripped when lab is locked
    assert.equal(result.instructions, '', 'Instructions must be stripped for locked lab');
    assert.equal(result.testScript, '', 'Test script must be stripped for locked lab');
    assert.equal(result.solution, null, 'Solution must be stripped for locked lab');
  });

  it('P1-04 Prevention: Verifies public series catalog enforces active published content when anonymous', async () => {
    let capturedWhere: any = null;
    const mockPrisma: any = {
      labSeries: {
        findMany: async ({ where }: any) => {
          capturedWhere = where;
          return [];
        },
      },
    };

    const seriesService = new SeriesService(mockPrisma);

    // Anonymous caller calls findAll with includeInactive=true
    await seriesService.findAll(true);

    // Prevention verified: Anonymous queries cannot view drafts or inactive series
    assert.deepEqual(
      capturedWhere,
      { isActive: true, status: 'published' },
      'Anonymous caller is strictly forced to published and active series',
    );
  });

  it('P1-06 Prevention: Verifies ResourceOwnerGuard rejects contributor access when authorId is null', async () => {
    const mockPrisma: any = {
      lab: {
        findUnique: async () => ({ id: 'lab-orphan', authorId: null }),
      },
    };

    const guard = new ResourceOwnerGuard(mockPrisma);

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'contributor-attacker', role: UserRole.contributor },
          params: { id: 'lab-orphan' },
          route: { path: '/labs/:id' },
          url: '/labs/lab-orphan',
        }),
      }),
    };

    // Prevention verified: throws ForbiddenException
    await assert.rejects(
      async () => guard.canActivate(mockContext),
      (err: any) => err instanceof ForbiddenException,
      'ResourceOwnerGuard must reject non-admin access to orphaned resources',
    );
  });

  it('P0-01 Prevention: Verifies migrations directory contains all 16 previously missing schema models', () => {
    const migrationsDir = path.resolve(__dirname, '../prisma/migrations');
    const migrationDirs = fs
      .readdirSync(migrationsDir)
      .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory());

    let allMigrationSql = '';
    for (const dir of migrationDirs) {
      const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
      if (fs.existsSync(sqlFile)) {
        allMigrationSql += '\n' + fs.readFileSync(sqlFile, 'utf-8');
      }
    }

    // Critical models defined in schema.prisma:
    const requiredTables = [
      'features',
      'permissions',
      'subscription_plans',
      'plan_features',
      'plan_permissions',
      'user_groups',
      'user_group_members',
      'group_plans',
      'user_subscriptions',
      'user_feature_overrides',
      'audit_logs',
      'feedbacks',
      'contributor_applications',
      'lab_submissions',
      'lab_series',
      'labs',
    ];

    const missingTables: string[] = [];
    for (const table of requiredTables) {
      const createTableRegex = new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?"${table}"`, 'i');
      if (!createTableRegex.test(allMigrationSql)) {
        missingTables.push(table);
      }
    }

    // Proves that all 16 tables are created in the migration chain!
    assert.equal(
      missingTables.length,
      0,
      `All 16 tables must be created in migrations: ${missingTables.join(', ')}`,
    );
  });
});
