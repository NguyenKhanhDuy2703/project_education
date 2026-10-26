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
import { EntitlementsService } from './entitlements.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanFeaturesDto } from './dto/update-plan-features.dto';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { SetFeatureOverrideDto } from './dto/set-feature-override.dto';
import { Request } from 'express';

@ApiTags('Entitlements & Dynamic Permissions (Admin & User)')
@Controller()
export class EntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  // ── Student Self-Check ────────────────────────────────────────────────────

  @Get('entitlements/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve effective entitlements for the currently authenticated user' })
  async getMyEntitlements(@Req() req: Request & { user: any }) {
    return this.entitlementsService.getUserEntitlements(req.user.userId);
  }

  // ── Admin: Subscription Plans Management ──────────────────────────────────

  @Get('admin/plans')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all subscription plans with mapped features (Admin only)' })
  async findAllPlans() {
    return this.entitlementsService.findAllPlans();
  }

  @Post('admin/plans')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() dto: CreatePlanDto, @Req() req: Request & { user: any }) {
    return this.entitlementsService.createPlan(dto, req.user?.userId);
  }

  @Put('admin/plans/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription plan details (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async updatePlan(
    @Param('id') planId: string,
    @Body() dto: UpdatePlanDto,
    @Req() req: Request & { user: any },
  ) {
    return this.entitlementsService.updatePlan(planId, dto, req.user?.userId);
  }

  @Delete('admin/plans/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subscription plan (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async deletePlan(@Param('id') planId: string, @Req() req: Request & { user: any }) {
    return this.entitlementsService.deletePlan(planId, req.user?.userId);
  }

  @Put('admin/plans/:id/features')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update features mapped to a subscription plan (Admin only)' })
  async updatePlanFeatures(
    @Param('id') planId: string,
    @Body() dto: UpdatePlanFeaturesDto,
  ) {
    return this.entitlementsService.updatePlanFeatures(planId, dto.featureIds);
  }

  // ── Admin: Features Registry ──────────────────────────────────────────────

  @Get('admin/features')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all registered platform features (Admin only)' })
  async findAllFeatures() {
    return this.entitlementsService.findAllFeatures();
  }

  @Post('admin/features')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new platform feature (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async createFeature(@Body() dto: CreateFeatureDto) {
    return this.entitlementsService.createFeature(dto);
  }

  // ── Admin: User Entitlements & Overrides ───────────────────────────────────

  @Get('admin/users/:id/entitlements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full entitlement and override details for a specific user (Admin only)' })
  async getUserEntitlements(@Param('id') userId: string) {
    return this.entitlementsService.getUserEntitlements(userId);
  }

  @Post('admin/users/:id/subscription')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign or upgrade subscription plan for a user (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async assignSubscription(
    @Param('id') userId: string,
    @Body() dto: AssignSubscriptionDto,
    @Req() req: Request & { user: any },
  ) {
    return this.entitlementsService.assignSubscription(
      req.user.userId,
      userId,
      dto,
      { ip: req.ip, ua: req.headers['user-agent'] },
    );
  }

  @Post('admin/users/:id/feature-overrides')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Grant (ALLOW) or Ban (DENY) a specific feature for a user (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async setFeatureOverride(
    @Param('id') userId: string,
    @Body() dto: SetFeatureOverrideDto,
    @Req() req: Request & { user: any },
  ) {
    return this.entitlementsService.setFeatureOverride(
      req.user.userId,
      userId,
      dto,
      { ip: req.ip, ua: req.headers['user-agent'] },
    );
  }

  @Delete('admin/users/:id/feature-overrides/:featureCode')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove feature override and restore plan default (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async removeFeatureOverride(
    @Param('id') userId: string,
    @Param('featureCode') featureCode: string,
    @Req() req: Request & { user: any },
  ) {
    return this.entitlementsService.removeFeatureOverride(
      req.user.userId,
      userId,
      featureCode,
      { ip: req.ip, ua: req.headers['user-agent'] },
    );
  }
}
