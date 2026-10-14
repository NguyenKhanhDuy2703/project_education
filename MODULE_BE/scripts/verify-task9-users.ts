import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/modules/users/users.service';
import { EntitlementsService } from '../src/modules/entitlements/entitlements.service';
import { UserRole } from '@prisma/client';

async function run() {
  console.log('🚀 Starting Verification: Task 9 (Admin Users & Entitlements Management - WF-09 | PB-04, PB-14)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const usersService = app.get(UsersService);
  const entitlementsService = app.get(EntitlementsService);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  let createdTestUserId = '';

  try {
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.admin, isActive: true },
    });
    if (!admin) throw new Error('No active admin user found in database.');

    // -------------------------------------------------------------
    // Subtask 9.1: Testing User Pagination & Filtering (10 items/page)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing User Listing, Pagination & Search Filters (Subtask 9.1) ---');
    const pagedUsers = await usersService.findAll({ page: 1, limit: 10 });
    assert(pagedUsers.meta.limit === 10, `Pagination respects 10 items per page limit (meta.limit = 10)`);
    assert(Array.isArray(pagedUsers.items), `Items returned as array`);
    assert(pagedUsers.items.length <= 10, `Returned items count is within limit (${pagedUsers.items.length} <= 10)`);
    assert(pagedUsers.meta.total >= pagedUsers.items.length, `Meta total reflects total user count (${pagedUsers.meta.total})`);

    // Filter by role
    const contributorsOnly = await usersService.findAll({ role: UserRole.contributor, limit: 10 });
    const allContributors = contributorsOnly.items.every((u) => u.role === UserRole.contributor);
    assert(allContributors, `Role filter returns exclusively contributors`);

    // Search by name/email/phone
    const searchResult = await usersService.findAll({ search: admin.email || 'admin', limit: 10 });
    const matchFound = searchResult.items.some((u) => u.id === admin.id);
    assert(matchFound, `Keyword search matches admin user by email/name`);

    // -------------------------------------------------------------
    // Subtask 9.2: Testing Role Mutation & Security Guards
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Role Mutation & Self-Demotion Guards (Subtask 9.2) ---');
    const uniqueSuffix = Date.now().toString().slice(-6);
    const testUser = await usersService.createByAdmin({
      name: `Test Member ${uniqueSuffix}`,
      email: `testmember_${uniqueSuffix}@example.com`,
      phone: `0999${uniqueSuffix}`,
      password: 'Password123!',
      role: UserRole.user,
    });
    createdTestUserId = testUser.id;
    assert(testUser.role === UserRole.user, `Newly created user starts with role 'user'`);

    // Promote to contributor
    const promoted = await usersService.updateByAdmin(createdTestUserId, admin.id, {
      role: UserRole.contributor,
    });
    assert(promoted.role === UserRole.contributor, `Admin promoted user to role 'contributor'`);

    // Self-demotion guard: Admin cannot demote themselves
    let selfDemoteBlocked = false;
    try {
      await usersService.updateByAdmin(admin.id, admin.id, { role: UserRole.user });
    } catch (err: any) {
      selfDemoteBlocked = true;
    }
    assert(selfDemoteBlocked, `Security Guard: Admin cannot demote their own account`);

    // -------------------------------------------------------------
    // Subtask 9.3: Testing Feature Entitlements & Direct Overrides
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Feature Overrides & Access Evaluation (Subtask 9.3) ---');
    const proFeatureCode = 'VIEW_SOLUTION';

    // 1. Check before override (free user does NOT have VIEW_SOLUTION)
    const checkBefore = await entitlementsService.checkUserFeature(createdTestUserId, proFeatureCode);
    assert(checkBefore.hasAccess === false, `User initially does not have access to Pro feature '${proFeatureCode}'`);

    // 2. Grant direct ALLOW override
    await entitlementsService.setFeatureOverride(admin.id, createdTestUserId, {
      featureCode: proFeatureCode,
      effect: 'ALLOW',
      reason: 'VIP Special Beta Access Override',
    });

    const checkAfterAllow = await entitlementsService.checkUserFeature(createdTestUserId, proFeatureCode);
    assert(checkAfterAllow.hasAccess === true, `Feature override ALLOW grants access immediately`);
    assert(checkAfterAllow.provenance?.type === 'DIRECT_OVERRIDE', `Provenance correctly reports DIRECT_OVERRIDE`);

    // 3. Remove override
    await entitlementsService.removeFeatureOverride(admin.id, createdTestUserId, proFeatureCode);
    const checkAfterReset = await entitlementsService.checkUserFeature(createdTestUserId, proFeatureCode);
    assert(checkAfterReset.hasAccess === false, `Removing override safely revokes direct access`);

    // 4. Test explicit DENY override on a Free feature
    const freeFeatureCode = 'RUN_JS_WORKER';
    await entitlementsService.setFeatureOverride(admin.id, createdTestUserId, {
      featureCode: freeFeatureCode,
      effect: 'DENY',
      reason: 'Abuse detected - temporarily suspended execution',
    });
    const checkDeny = await entitlementsService.checkUserFeature(createdTestUserId, freeFeatureCode);
    assert(checkDeny.hasAccess === false, `Explicit DENY blocks access even to Free features`);
    assert(checkDeny.isBanned === true, `Explicit DENY marks isBanned=true`);
    await entitlementsService.removeFeatureOverride(admin.id, createdTestUserId, freeFeatureCode);

    // -------------------------------------------------------------
    // Subtask 9.4: Testing User Suspension & Session Revocation
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Account Suspension & Immediate Session Revocation (Subtask 9.4) ---');
    // Set dummy refresh token on test user
    await prisma.user.update({
      where: { id: createdTestUserId },
      data: { refreshToken: 'active-session-token-sample' },
    });

    // Admin soft-deletes / suspends user
    const suspendResult = await usersService.softDeleteByAdmin(createdTestUserId, admin.id);
    assert(!!suspendResult.message, `Deactivation message returned`);

    const suspendedUser = await prisma.user.findUnique({ where: { id: createdTestUserId } });
    assert(suspendedUser?.isActive === false, `User account marked isActive=false`);
    assert(suspendedUser?.refreshToken === null, `User refreshToken revoked (set to null) immediately`);

    // Self-suspension guard: Admin cannot suspend themselves
    let selfSuspendBlocked = false;
    try {
      await usersService.softDeleteByAdmin(admin.id, admin.id);
    } catch (err: any) {
      selfSuspendBlocked = true;
    }
    assert(selfSuspendBlocked, `Security Guard: Admin cannot suspend their own active account`);

    console.log('\n=================================================');
    console.log(`TASK 9 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
    console.log('=================================================');
  } finally {
    console.log('\n[Teardown] Cleaning up test user, audit logs and overrides...');
    if (createdTestUserId) {
      await prisma.userFeatureOverride.deleteMany({ where: { userId: createdTestUserId } });
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { targetUserId: createdTestUserId },
            { actorId: createdTestUserId },
          ],
        },
      });
      await prisma.user.deleteMany({ where: { id: createdTestUserId } });
    }
    await app.close();
    console.log('Teardown complete.');
  }
}

run().catch((err) => {
  console.error('Task 9 Verification Failure:', err);
  process.exit(1);
});
