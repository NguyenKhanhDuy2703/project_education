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
import { Request } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

import { FeatureEntitlementGuard } from '../entitlements/guards/feature-entitlement.guard';
import { RequireFeature } from '../entitlements/decorators/require-feature.decorator';

@ApiTags('Labs (Practice & Blog)')
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get practice lab / blog details by slug (Public / Student view)' })
  async findBySlug(@Param('slug') slug: string, @Req() req: Request & { user?: any }) {
    return this.labsService.findBySlug(slug, req.user);
  }

  @Post(':id/submit')
  @UseGuards(AuthGuard('jwt'), FeatureEntitlementGuard)
  @RequireFeature('SUBMIT_LAB')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit practice lab attempt (Protected with SUBMIT_LAB entitlement)' })
  async submit(
    @Param('id') labId: string,
    @Req() req: Request & { user: any },
    @Body() body: any,
  ) {
    return this.labsService.submit(labId, req.user.userId, body);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new practice lab / blog (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLabDto) {
    return this.labsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a practice lab / blog (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateLabDto) {
    return this.labsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a practice lab / blog (Admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.labsService.delete(id);
  }
}
