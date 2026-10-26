import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Request } from 'express';
import { RateLimitGuard, Throttle } from '../../common/guards/rate-limit.guard';

@ApiTags('User & Guest Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard, RateLimitGuard)
  @Throttle({ limit: 10, ttlMs: 60000 })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit user or guest feedback' })
  async create(
    @Body() dto: CreateFeedbackDto,
    @Req() req: Request & { user?: any },
  ) {
    const userId = req.user?.userId;
    return this.feedbackService.create(dto, userId);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all feedbacks for Admin' })
  async findAll() {
    return this.feedbackService.findAll();
  }

  @Delete(['admin/:id', ':id'])
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user feedback by ID (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.feedbackService.remove(id);
  }
}
