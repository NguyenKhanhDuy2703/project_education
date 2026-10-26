import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpgradeRequestStatus, UserRole } from '@prisma/client';
import { BillingService } from './billing.service';
import { UpdateBillingSettingsDto } from './dto/update-billing-settings.dto';
import { CreateUpgradeRequestDto } from './dto/create-upgrade-request.dto';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { ApproveUpgradeRequestDto } from './dto/approve-request.dto';
import { RejectUpgradeRequestDto } from './dto/reject-request.dto';
import { Request } from 'express';

@ApiTags('Billing, Pricing & Pro Upgrade Lifecycle')
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ── Public Pricing Catalog ────────────────────────────────────────────────

  @Get('plans/public')
  @ApiOperation({ summary: 'List public plans and intake availability without permission internals' })
  async getPublicPlans() {
    return this.billingService.getPublicPlans();
  }

  // ── Admin Billing Settings ────────────────────────────────────────────────

  @Get('admin/billing-settings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current billing and receiving bank settings (Admin only)' })
  async getBillingSettings() {
    return this.billingService.getBillingSettings();
  }

  @Put('admin/billing-settings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update receiving bank and intake settings (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async updateBillingSettings(
    @Body() dto: UpdateBillingSettingsDto,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.updateBillingSettings(dto, req.user.userId, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  }

  // ── Learner Membership & Upgrade Lifecycle ────────────────────────────────

  @Get('membership/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current effective membership, dates, and open upgrade request' })
  async getMyMembership(@Req() req: Request & { user: any }) {
    return this.billingService.getMembershipState(req.user.userId);
  }

  @Post('upgrade-requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new monthly Pro upgrade request or return existing open request' })
  @HttpCode(HttpStatus.CREATED)
  async createUpgradeRequest(
    @Body() dto: CreateUpgradeRequestDto,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.createUpgradeRequest(req.user.userId, dto.planId);
  }

  @Get('upgrade-requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user upgrade requests history' })
  async getMyUpgradeRequests(@Req() req: Request & { user: any }) {
    return this.billingService.getMyUpgradeRequests(req.user.userId);
  }

  @Get('upgrade-requests/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed upgrade request by ID (owner only)' })
  async getMyUpgradeRequestById(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.getUpgradeRequestById(req.user.userId, id);
  }

  @Post('upgrade-requests/:id/payment-confirmation')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit bank transfer reference for reconciliation' })
  @HttpCode(HttpStatus.OK)
  async submitPaymentConfirmation(
    @Param('id') id: string,
    @Body() dto: SubmitPaymentDto,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.submitPaymentConfirmation(req.user.userId, id, dto.paymentReference);
  }

  @Post('upgrade-requests/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an upgrade request awaiting payment' })
  @HttpCode(HttpStatus.OK)
  async cancelUpgradeRequest(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.cancelUpgradeRequest(req.user.userId, id);
  }

  // ── Admin Reconciliation Queue ────────────────────────────────────────────

  @Get('admin/upgrade-requests')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search and filter upgrade requests queue (Admin only)' })
  async adminGetUpgradeRequests(
    @Query('status') status?: UpgradeRequestStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.adminGetUpgradeRequests({
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('admin/upgrade-requests/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete reconciliation detail for an upgrade request (Admin only)' })
  async adminGetUpgradeRequestById(@Param('id') id: string) {
    return this.billingService.adminGetUpgradeRequestById(id);
  }

  @Post('admin/upgrade-requests/:id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve upgrade request and grant 1 calendar month Pro (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async adminApproveUpgradeRequest(
    @Param('id') id: string,
    @Body() dto: ApproveUpgradeRequestDto,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.adminApproveUpgradeRequest(req.user.userId, id, dto, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  }

  @Post('admin/upgrade-requests/:id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject upgrade request with learner-visible reason (Admin only)' })
  @HttpCode(HttpStatus.OK)
  async adminRejectUpgradeRequest(
    @Param('id') id: string,
    @Body() dto: RejectUpgradeRequestDto,
    @Req() req: Request & { user: any },
  ) {
    return this.billingService.adminRejectUpgradeRequest(req.user.userId, id, dto, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  }
}
