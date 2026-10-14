import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GroupsService } from '../src/modules/groups/groups.service';
import { UsersService } from '../src/modules/users/users.service';
import { UserRole } from '@prisma/client';

async function run() {
  console.log('🚀 Starting Verification: Task 10 (Admin User Groups 2-Panel Split View - WF-10 | B2B/Groups)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const groupsService = app.get(GroupsService);
  const usersService = app.get(UsersService);

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

  let createdGroupId = '';
  let createdTestUserId = '';

  try {
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.admin, isActive: true },
    });
    if (!admin) throw new Error('No active admin user found in database.');

    // -------------------------------------------------------------
    // Subtask 10.1: Left Column Group Directory & Creation
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Group Directory & Creation (Subtask 10.1) ---');
    const uniqueSuffix = Date.now().toString().slice(-6);
    const groupCode = `CORP_TRAINING_${uniqueSuffix}`;
    const groupName = `FPT Software QA Cohort ${uniqueSuffix}`;

    const createdGroup = await groupsService.create(
      {
        code: groupCode,
        name: groupName,
        description: 'B2B Corporate Training Cohort for QA Automation Engineers',
        isActive: true,
      },
      admin.id
    );
    createdGroupId = createdGroup.id;

    assert(createdGroup.code === groupCode, `Group created with exact code: '${createdGroup.code}'`);
    assert(createdGroup.name === groupName, `Group created with exact name: '${createdGroup.name}'`);
    assert(createdGroup.isActive === true, `Group created with isActive=true`);

    // Verify duplicate code rejection
    let duplicateBlocked = false;
    try {
      await groupsService.create({ code: groupCode, name: 'Duplicate Group' }, admin.id);
    } catch (err: any) {
      duplicateBlocked = true;
    }
    assert(duplicateBlocked, `Unique Code Constraint: Duplicate group code is rejected with ConflictException`);

    // Verify Audit Log for CREATE_USER_GROUP
    const auditCreate = await prisma.auditLog.findFirst({
      where: {
        action: 'CREATE_USER_GROUP',
        actorId: admin.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditCreate, `Audit Log recorded 'CREATE_USER_GROUP' action with actor=${admin.name}`);

    // Verify findAll lists the new group
    const allGroups = await groupsService.findAll();
    const foundInList = allGroups.find((g) => g.id === createdGroupId);
    assert(!!foundInList, `Newly created group appears in findAll directory list`);
    assert(foundInList?.memberCount === 0, `Initial memberCount is 0`);

    // -------------------------------------------------------------
    // Subtask 10.2: Right Column Group Details & Member Resolution
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Right Column Group Inspection (Subtask 10.2) ---');
    const groupDetails = await groupsService.findById(createdGroupId);
    assert(groupDetails.id === createdGroupId, `findById retrieves exact group details`);
    assert(Array.isArray(groupDetails.members), `Group details returns members array`);
    assert(groupDetails.members.length === 0, `Initial members list is empty`);

    // -------------------------------------------------------------
    // Subtask 10.3: Adding Member to Group & Realtime Count Increment
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Add Member to Group (Subtask 10.3) ---');
    const testUser = await usersService.createByAdmin({
      name: `Trainee ${uniqueSuffix}`,
      email: `trainee_${uniqueSuffix}@example.com`,
      phone: `0988${uniqueSuffix}`,
      password: 'Password123!',
      role: UserRole.user,
    });
    createdTestUserId = testUser.id;

    const addMemberResult = await groupsService.addMember(createdGroupId, { userId: createdTestUserId }, admin.id);
    assert(!!addMemberResult.message, `Member addition succeeds with confirmation message`);

    // Check Audit Log for ADD_GROUP_MEMBER
    const auditAddMember = await prisma.auditLog.findFirst({
      where: {
        action: 'ADD_GROUP_MEMBER',
        actorId: admin.id,
        targetUserId: createdTestUserId,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditAddMember, `Audit Log recorded 'ADD_GROUP_MEMBER' targeting new trainee`);

    // Duplicate membership prevention
    let duplicateMemberBlocked = false;
    try {
      await groupsService.addMember(createdGroupId, { userId: createdTestUserId }, admin.id);
    } catch (err: any) {
      duplicateMemberBlocked = true;
    }
    assert(duplicateMemberBlocked, `Duplicate Membership Guard: Cannot add identical member twice`);

    // Verify memberCount incremented
    const updatedDetails = await groupsService.findById(createdGroupId);
    assert(updatedDetails.members.length === 1, `Right column members list increments to 1 member`);
    assert(updatedDetails.members[0].userId === createdTestUserId, `Right column member has matching userId`);
    assert(updatedDetails.members[0].name === testUser.name, `Right column member displays trainee name`);

    const refreshedList = await groupsService.findAll();
    const refreshedGroup = refreshedList.find((g) => g.id === createdGroupId);
    assert(refreshedGroup?.memberCount === 1, `Left column directory card reflects memberCount = 1`);

    // -------------------------------------------------------------
    // Subtask 10.4: Removing Member from Group & Count Decrement
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Remove Member from Group (Subtask 10.4) ---');
    const removeResult = await groupsService.removeMember(createdGroupId, createdTestUserId, admin.id);
    assert(!!removeResult.message, `Member removal succeeds with confirmation message`);

    // Check Audit Log for REMOVE_GROUP_MEMBER
    const auditRemoveMember = await prisma.auditLog.findFirst({
      where: {
        action: 'REMOVE_GROUP_MEMBER',
        actorId: admin.id,
        targetUserId: createdTestUserId,
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditRemoveMember, `Audit Log recorded 'REMOVE_GROUP_MEMBER'`);

    // Verify memberCount decremented back to 0
    const detailsAfterRemove = await groupsService.findById(createdGroupId);
    assert(detailsAfterRemove.members.length === 0, `Right column members list decrements back to 0`);

    const finalList = await groupsService.findAll();
    const finalGroup = finalList.find((g) => g.id === createdGroupId);
    assert(finalGroup?.memberCount === 0, `Left column directory card reflects memberCount = 0`);

    console.log('\n=================================================');
    console.log(`TASK 10 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
    console.log('=================================================');
  } finally {
    console.log('\n[Teardown] Cleaning up test group, user and audit logs...');
    if (createdGroupId) {
      await prisma.userGroupMember.deleteMany({ where: { groupId: createdGroupId } });
      await prisma.groupPlan.deleteMany({ where: { groupId: createdGroupId } });
      await prisma.userGroup.deleteMany({ where: { id: createdGroupId } });
    }
    if (createdTestUserId) {
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
  console.error('Task 10 Verification Failure:', err);
  process.exit(1);
});
