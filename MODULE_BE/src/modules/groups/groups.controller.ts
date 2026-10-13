import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignPlansToGroupDto } from './dto/assign-plans.dto';
import { AddGroupMemberDto } from './dto/add-group-member.dto';
import { Request } from 'express';

@ApiTags('Admin: IAM User Groups Management')
@Controller('admin/groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List all IAM User Groups with assigned plans and member counts' })
  async findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single IAM Group details with plan details and member list' })
  async findById(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new IAM User Group' })
  async create(@Body() dto: CreateGroupDto, @Req() req: Request & { user: any }) {
    return this.groupsService.create(dto, req.user?.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update IAM User Group metadata' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: Request & { user: any },
  ) {
    return this.groupsService.update(id, dto, req.user?.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete IAM User Group' })
  async delete(@Param('id') id: string, @Req() req: Request & { user: any }) {
    return this.groupsService.delete(id, req.user?.userId);
  }

  @Put(':id/plans')
  @ApiOperation({ summary: 'Assign or replace subscription plans attached to this group' })
  async assignPlans(
    @Param('id') id: string,
    @Body() dto: AssignPlansToGroupDto,
    @Req() req: Request & { user: any },
  ) {
    return this.groupsService.assignPlans(id, dto, req.user?.userId);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a user to this IAM Group' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddGroupMemberDto,
    @Req() req: Request & { user: any },
  ) {
    return this.groupsService.addMember(id, dto, req.user?.userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a user from this IAM Group' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request & { user: any },
  ) {
    return this.groupsService.removeMember(id, userId, req.user?.userId);
  }
}
