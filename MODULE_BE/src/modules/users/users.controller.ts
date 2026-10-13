import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Users Management (Admin Only)')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    const isActiveBool =
      isActive === undefined ? undefined : isActive === 'true';

    return this.usersService.findAll({
      search,
      role,
      isActive: isActiveBool,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user account (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createByAdmin(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return null;
    }
    const { password, refreshToken, ...publicUser } = user;
    return publicUser;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile, credentials, and role with Admin Protection (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateByAdmin(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account with Admin Protection (Admin only)' })
  @ApiQuery({ name: 'permanent', required: false, type: Boolean })
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
    @Query('permanent') permanent?: string,
  ) {
    if (permanent === 'false') {
      return this.usersService.softDeleteByAdmin(id, req.user.userId);
    }
    return this.usersService.hardDeleteByAdmin(id, req.user.userId);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role / membership tier (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
    @Body() dto: UpdateUserRoleDto,
  ) {
    // Also protect against self-demotion
    return this.usersService.updateByAdmin(id, req.user.userId, { role: dto.role });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or suspend user account (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateByAdmin(id, req.user.userId, { isActive: dto.isActive });
  }
}
