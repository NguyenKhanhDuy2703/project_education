import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Users Management (Admin Only)')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users with pagination, search, and filtering (Admin only)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isActiveBool = isActive === undefined ? undefined : isActive === 'true';

    return this.usersService.findAll({
      search,
      role,
      isActive: isActiveBool,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role / membership tier (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: { userId: string },
    @Req() req: Request,
  ) {
    const updatedUser = await this.usersService.updateRole(id, dto.role);

    // T5: Xoá refreshToken → buộc user phải đăng nhập lại để nhận role mới
    await this.usersService.updateRefreshToken(id, null);

    // T3: Ghi audit log cho hành động đổi role
    await this.auditLogsService.log({
      actorId: actor.userId,
      targetUserId: id,
      action: 'USER_ROLE_CHANGE',
      details: { newRole: dto.role, targetUser: { id: updatedUser.id, name: updatedUser.name } },
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip,
      userAgent: req.headers['user-agent'],
    });

    return {
      message: `User role updated to ${dto.role}. User session has been invalidated.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or suspend user account (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: { userId: string },
    @Req() req: Request,
  ) {
    const updatedUser = await this.usersService.updateStatus(id, dto.isActive);

    // T5: Nếu bị ban → xoá refreshToken → user không thể refresh, bị force logout ngay
    if (!dto.isActive) {
      await this.usersService.updateRefreshToken(id, null);
    }

    // T3: Ghi audit log cho hành động thay đổi trạng thái
    await this.auditLogsService.log({
      actorId: actor.userId,
      targetUserId: id,
      action: dto.isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      details: { isActive: dto.isActive, targetUser: { id: updatedUser.id, name: updatedUser.name } },
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip,
      userAgent: req.headers['user-agent'],
    });

    return {
      message: `User account ${dto.isActive ? 'activated' : 'suspended'} successfully.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        isActive: updatedUser.isActive,
      },
    };
  }
}
