import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { SendAnnouncementDto } from './dto/send-announcement.dto';
import { Request } from 'express';

@ApiTags('In-App Notifications & Announcements')
@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications inbox with cursor pagination' })
  async getMyNotifications(
    @Req() req: Request & { user: any },
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.notificationsService.getMyNotifications(req.user.userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get('notifications/unread-count')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get count of unread notifications for badge' })
  async getUnreadCount(@Req() req: Request & { user: any }) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch('notifications/:id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read (owner only)' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.notificationsService.markAsRead(req.user.userId, id);
  }

  @Post('notifications/read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: Request & { user: any }) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  // ── Admin Announcements ───────────────────────────────────────────────────

  @Post('admin/announcements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish announcement to all users or selected audience (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @Body() dto: SendAnnouncementDto,
    @Req() req: Request & { user: any },
  ) {
    return this.notificationsService.createAndProcessAnnouncement(req.user.userId, dto);
  }

  @Get('admin/announcements')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List past announcements and inspect batch delivery progress (Admin only)' })
  async getAnnouncements() {
    return this.notificationsService.getAnnouncements();
  }
}
