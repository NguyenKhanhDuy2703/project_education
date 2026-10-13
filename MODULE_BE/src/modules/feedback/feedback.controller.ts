import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Request } from 'express';

@ApiTags('User & Guest Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
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
}
