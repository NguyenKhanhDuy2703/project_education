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
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
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

  @Get('contributor/my-labs')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.contributor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get practice labs authored by currently authenticated contributor' })
  async findMyLabs(@Req() req: Request & { user: any }) {
    return this.labsService.findMyLabs(req.user.userId);
  }

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

  @Get(':id/submissions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get submission history for current user' })
  async getSubmissions(
    @Param('id') labId: string,
    @Req() req: Request & { user: any },
  ) {
    return this.labsService.getSubmissions(labId, req.user.userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin, UserRole.contributor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new practice lab / blog (Admin or Contributor)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLabDto, @Req() req: Request & { user: any }) {
    return this.labsService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, ResourceOwnerGuard)
  @Roles(UserRole.admin, UserRole.contributor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a practice lab / blog (Author or Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLabDto,
    @Req() req: Request & { user: any },
  ) {
    return this.labsService.update(id, dto, req.user);
  }

  @Post(':id/submit-for-review')
  @UseGuards(AuthGuard('jwt'), RolesGuard, ResourceOwnerGuard)
  @Roles(UserRole.admin, UserRole.contributor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit practice lab to Admin Review Queue' })
  async submitForReview(@Param('id') id: string, @Req() req: Request & { user: any }) {
    return this.labsService.submitForReview(id, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, ResourceOwnerGuard)
  @Roles(UserRole.admin, UserRole.contributor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a practice lab / blog (Author or Admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.labsService.delete(id);
  }
}
