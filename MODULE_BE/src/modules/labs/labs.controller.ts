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
import { ContributorGuard } from '../../common/guards/contributor.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { FeatureEntitlementGuard } from '../entitlements/guards/feature-entitlement.guard';
import { RequireFeature } from '../entitlements/decorators/require-feature.decorator';
import { SubmitLabDto } from './dto/submit-lab.dto';
import { SqlPreflightDto } from './dto/sql-preflight.dto';
import { UpdatePositionDto, CompleteTheoryDto } from './dto/theory-progress.dto';

@ApiTags('Labs (Practice & Blog)')
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get('contributor/my-labs')
  @UseGuards(AuthGuard('jwt'), ContributorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get practice labs authored by currently authenticated contributor' })
  async findMyLabs(@Req() req: Request & { user: any }) {
    return this.labsService.findMyLabs(req.user.userId);
  }

  @Get('user/submissions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all practice lab submissions for current user' })
  async getUserSubmissions(@Req() req: Request & { user: any }) {
    return this.labsService.getUserSubmissions(req.user.userId);
  }

  @Get('me/stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics for current user' })
  async getMyStats(@Req() req: Request & { user: any }) {
    return this.labsService.getDashboardStats(req.user.userId);
  }

  @Get('user/dashboard-stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics for current user (Frontend alias)' })
  async getUserDashboardStats(@Req() req: Request & { user: any }) {
    return this.labsService.getDashboardStats(req.user.userId);
  }

  @Post('sql/preflight')
  @UseGuards(AuthGuard('jwt'), ContributorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute an SQL reference solution in isolated PGlite for authoring validation' })
  async preflightSql(@Body() dto: SqlPreflightDto) {
    return this.labsService.preflightSql(dto);
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
    @Body() body: SubmitLabDto,
  ) {
    return this.labsService.submit(labId, req.user.userId, body);
  }

  @Get(':id/progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user learning progress for a lab / unit' })
  async getLearningProgress(
    @Param('id') labId: string,
    @Req() req: Request & { user: any },
  ) {
    return this.labsService.getLearningProgress(labId, req.user.userId);
  }

  @Post(':id/progress/start')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start learning unit progress (transitions to IN_PROGRESS)' })
  async startProgress(
    @Param('id') labId: string,
    @Req() req: Request & { user: any },
  ) {
    return this.labsService.startTheoryProgress(labId, req.user.userId);
  }

  @Post(':id/progress/position')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update learner reading position and formative checks' })
  async updatePosition(
    @Param('id') labId: string,
    @Req() req: Request & { user: any },
    @Body() body: UpdatePositionDto,
  ) {
    return this.labsService.updateTheoryPosition(labId, req.user.userId, body);
  }

  @Post(':id/progress/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark theory / learning unit complete' })
  async completeProgress(
    @Param('id') labId: string,
    @Req() req: Request & { user: any },
    @Body() body: CompleteTheoryDto,
  ) {
    return this.labsService.completeTheoryProgress(labId, req.user.userId, body);
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
  @UseGuards(AuthGuard('jwt'), ContributorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new practice lab / blog (Admin or Contributor)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLabDto, @Req() req: Request & { user: any }) {
    return this.labsService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
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
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit practice lab to Admin Review Queue' })
  async submitForReview(@Param('id') id: string, @Req() req: Request & { user: any }) {
    return this.labsService.submitForReview(id, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a practice lab / blog (Author or Admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.labsService.delete(id);
  }
}
