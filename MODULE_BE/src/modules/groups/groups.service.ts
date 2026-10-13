import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignPlansToGroupDto } from './dto/assign-plans.dto';
import { AddGroupMemberDto } from './dto/add-group-member.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * List all user groups with assigned plans and member counts.
   */
  async findAll() {
    const groups = await this.prisma.userGroup.findMany({
      include: {
        groupPlans: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      description: g.description,
      isActive: g.isActive,
      memberCount: g._count.members,
      plans: g.groupPlans.map((gp) => ({
        id: gp.plan.id,
        code: gp.plan.code,
        name: gp.plan.name,
        price: gp.plan.price,
        billingCycle: gp.plan.billingCycle,
      })),
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  }

  /**
   * Get single group details including active members.
   */
  async findById(id: string) {
    const group = await this.prisma.userGroup.findUnique({
      where: { id },
      include: {
        groupPlans: {
          include: {
            plan: {
              include: {
                planFeatures: {
                  include: { feature: true },
                },
                planPermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return {
      id: group.id,
      code: group.code,
      name: group.name,
      description: group.description,
      isActive: group.isActive,
      plans: group.groupPlans.map((gp) => ({
        id: gp.plan.id,
        code: gp.plan.code,
        name: gp.plan.name,
        features: gp.plan.planFeatures.map((pf) => pf.feature.code),
        permissions: gp.plan.planPermissions.map((pp) => pp.permission.code),
      })),
      members: group.members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        role: m.user.role,
        joinedAt: m.createdAt,
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  /**
   * Create a new IAM User Group.
   */
  async create(dto: CreateGroupDto, adminId?: string) {
    const existing = await this.prisma.userGroup.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Group with code '${dto.code}' already exists`);
    }

    const group = await this.prisma.userGroup.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    // Optionally assign initial plans
    if (dto.planIds && dto.planIds.length > 0) {
      for (const planId of dto.planIds) {
        await this.prisma.groupPlan.create({
          data: {
            groupId: group.id,
            planId,
          },
        });
      }
    }

    if (adminId) {
      await this.auditLogsService.log({
        actorId: adminId,
        action: 'CREATE_USER_GROUP',
        details: { groupId: group.id, code: group.code, name: group.name },
      });
    }

    return this.findById(group.id);
  }

  /**
   * Update group metadata.
   */
  async update(id: string, dto: UpdateGroupDto, adminId?: string) {
    const group = await this.prisma.userGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Group with ID ${id} not found`);

    const updated = await this.prisma.userGroup.update({
      where: { id },
      data: {
        name: dto.name ?? group.name,
        description: dto.description ?? group.description,
        isActive: dto.isActive ?? group.isActive,
      },
    });

    if (adminId) {
      await this.auditLogsService.log({
        actorId: adminId,
        action: 'UPDATE_USER_GROUP',
        details: { groupId: id, changes: dto },
      });
    }

    return updated;
  }

  /**
   * Delete group.
   */
  async delete(id: string, adminId?: string) {
    const group = await this.prisma.userGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Group with ID ${id} not found`);

    await this.prisma.userGroup.delete({ where: { id } });

    if (adminId) {
      await this.auditLogsService.log({
        actorId: adminId,
        action: 'DELETE_USER_GROUP',
        details: { groupId: id, code: group.code },
      });
    }

    return { message: `Group '${group.name}' deleted successfully` };
  }

  /**
   * Assign or replace subscription plans for a group.
   */
  async assignPlans(id: string, dto: AssignPlansToGroupDto, adminId?: string) {
    const group = await this.prisma.userGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Group with ID ${id} not found`);

    // Verify plans exist
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { id: { in: dto.planIds } },
    });
    if (plans.length !== dto.planIds.length) {
      throw new BadRequestException('One or more specified Plan IDs do not exist');
    }

    // Atomic transaction: remove old plans, insert new assignments
    await this.prisma.$transaction(async (tx) => {
      await tx.groupPlan.deleteMany({ where: { groupId: id } });
      for (const planId of dto.planIds) {
        await tx.groupPlan.create({
          data: { groupId: id, planId },
        });
      }
    });

    if (adminId) {
      await this.auditLogsService.log({
        actorId: adminId,
        action: 'ASSIGN_GROUP_PLANS',
        details: { groupId: id, planCodes: plans.map((p) => p.code) },
      });
    }

    return this.findById(id);
  }

  /**
   * Add a user to a group.
   */
  async addMember(groupId: string, dto: AddGroupMemberDto, adminId?: string) {
    const group = await this.prisma.userGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User with ID ${dto.userId} not found`);

    const existingMembership = await this.prisma.userGroupMember.findUnique({
      where: { userId_groupId: { userId: dto.userId, groupId } },
    });
    if (existingMembership) {
      throw new ConflictException(`User is already a member of this group`);
    }

    await this.prisma.userGroupMember.create({
      data: {
        userId: dto.userId,
        groupId,
      },
    });

    if (adminId) {
      await this.auditLogsService.log({
        actorId: adminId,
        targetUserId: dto.userId,
        action: 'ADD_GROUP_MEMBER',
        details: { groupId, groupCode: group.code },
      });
    }

    return { message: `User ${user.name} added to group ${group.name} successfully` };
  }

  /**
   * Remove a user from a group.
   */
  async removeMember(groupId: string, userId: string, adminId?: string) {
    const membership = await this.prisma.userGroupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      throw new NotFoundException(`User is not a member of this group`);
    }

    await this.prisma.userGroupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });

    if (adminId) {
      await this.auditLogsService.log({
        actorId: adminId,
        targetUserId: userId,
        action: 'REMOVE_GROUP_MEMBER',
        details: { groupId },
      });
    }

    return { message: `User removed from group successfully` };
  }
}
