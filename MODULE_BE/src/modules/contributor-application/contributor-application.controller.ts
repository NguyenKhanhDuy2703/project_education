import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ContributorApplicationService } from './contributor-application.service';
import { ApplyContributorDto } from './dto/apply-contributor.dto';
import { ReviewContributorDto } from './dto/review-contributor.dto';

@ApiTags('Contributor Applications')
@Controller()
export class ContributorApplicationController {
  constructor(
    private readonly applicationService: ContributorApplicationService,
  ) {}

  @Post('contributor/apply')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit application to become a Contributor' })
  @HttpCode(HttpStatus.CREATED)
  async apply(
    @Req() req: Request & { user: any },
    @Body() dto: ApplyContributorDto,
  ) {
    return this.applicationService.apply(req.user.userId, dto);
  }

  @Get('contributor/my-application')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user application status' })
  async getMyApplication(@Req() req: Request & { user: any }) {
    return this.applicationService.getMyApplication(req.user.userId);
  }

  @Get('admin/contributor-applications')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all contributor applications (Admin only)' })
  async findAllForAdmin(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.applicationService.findAllForAdmin({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('admin/contributor-applications/:id/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or Reject contributor application (Admin only)' })
  async reviewApplication(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
    @Body() dto: ReviewContributorDto,
  ) {
    return this.applicationService.reviewApplication(id, req.user.userId, dto);
  }
}
