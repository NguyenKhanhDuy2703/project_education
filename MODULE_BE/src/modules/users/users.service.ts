import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Prisma, UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findByEmailOrPhone(identifier: string, _includePassword = false): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
        ],
      },
    });
  }

  async findByRefreshToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { refreshToken: token },
    });
  }

  async update(id: string, updateDto: Prisma.UserUpdateInput): Promise<User | null> {
    return this.prisma.user.update({
      where: { id },
      data: updateDto,
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async findAll(params?: {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params?.role) {
      where.role = params.role;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.search) {
      const s = params.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          googleId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      items: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createByAdmin(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { phone: dto.phone },
        ],
      },
    });

    if (existing) {
      if (existing.email?.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException(`Email "${dto.email}" is already registered.`);
      }
      throw new ConflictException(`Phone "${dto.phone}" is already registered.`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateByAdmin(targetUserId: string, currentAdminId: string, dto: UpdateUserDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID "${targetUserId}" not found.`);
    }

    // Admin Role Protection Guard: Self-lockout prevention
    if (targetUserId === currentAdminId) {
      if (dto.role && dto.role !== UserRole.admin) {
        throw new BadRequestException('Security Violation: Administrators cannot demote their own account.');
      }
      if (dto.isActive === false) {
        throw new BadRequestException('Security Violation: Administrators cannot suspend their own active account.');
      }
    }

    // Root Super Admin Protection
    if (targetUser.email === 'admin@studyweb.dev') {
      if (dto.role && dto.role !== UserRole.admin) {
        throw new BadRequestException('Security Violation: System Root Super Administrator role cannot be changed.');
      }
      if (dto.isActive === false) {
        throw new BadRequestException('Security Violation: System Root Super Administrator account cannot be suspended.');
      }
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email.toLowerCase() !== targetUser.email?.toLowerCase()) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictException(`Email "${dto.email}" is already in use by another user.`);
      }
    }

    // Check phone uniqueness if changing
    if (dto.phone && dto.phone !== targetUser.phone) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (phoneExists) {
        throw new ConflictException(`Phone "${dto.phone}" is already in use by another user.`);
      }
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase();
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async softDeleteByAdmin(targetUserId: string, currentAdminId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID "${targetUserId}" not found.`);
    }

    // Admin Role Protection Guard
    if (targetUserId === currentAdminId) {
      throw new BadRequestException('Security Violation: Administrators cannot delete their own active account.');
    }

    if (targetUser.email === 'admin@studyweb.dev') {
      throw new BadRequestException('Security Violation: System Root Super Administrator account is protected and cannot be deleted.');
    }

    // Soft-delete policy: deactivate and clear refresh token
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isActive: false,
        refreshToken: null,
      },
    });

    return {
      message: `User "${targetUser.name}" has been safely deactivated (soft-deleted).`,
      userId: targetUserId,
    };
  }

  async hardDeleteByAdmin(targetUserId: string, currentAdminId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID "${targetUserId}" not found.`);
    }

    if (targetUserId === currentAdminId) {
      throw new BadRequestException('Security Violation: Administrators cannot delete their own active account.');
    }

    if (targetUser.email === 'admin@studyweb.dev') {
      throw new BadRequestException('Security Violation: System Root Super Administrator account is protected and cannot be deleted.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userSubscription.deleteMany({ where: { userId: targetUserId } });
      await tx.userFeatureOverride.deleteMany({ where: { userId: targetUserId } });
      await tx.userGroupMember.deleteMany({ where: { userId: targetUserId } });
      await tx.labSubmission.deleteMany({ where: { userId: targetUserId } });
      await tx.auditLog.deleteMany({ where: { actorId: targetUserId } });
      await tx.auditLog.deleteMany({ where: { targetUserId: targetUserId } });

      await tx.labSeries.updateMany({
        where: { authorId: targetUserId },
        data: { authorId: null },
      });
      await tx.lab.updateMany({
        where: { authorId: targetUserId },
        data: { authorId: null },
      });

      await tx.user.delete({ where: { id: targetUserId } });
    });

    return {
      message: `User "${targetUser.name}" has been permanently deleted from the system.`,
      userId: targetUserId,
    };
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  async delete(id: string): Promise<User | null> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
