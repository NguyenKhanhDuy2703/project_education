import {
  Body,
  Controller,
  Get,
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
import { ContentLifecycleStatus, UserRole } from '@prisma/client';
import { ContentType, ReviewService } from './review.service';
import {
  RejectContentDto,
  RequestChangesDto,
  TransferOwnershipDto,
} from './dto/review-action.dto';

@ApiTags('Admin: Content Review Queue & Publishing Workflow')
@Controller('admin/review')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Query the unified 5-tab review queue across Series and Labs' })
  async getQueue(
    @Query('status') status?: ContentLifecycleStatus,
    @Query('type') type?: 'all' | 'series' | 'lab',
    @Query('search') search?: string,
  ) {
    return this.reviewService.getReviewQueue({ status, type, search });
  }

  @Post(':type/:id/approve')
  @ApiOperation({ summary: 'Approve content (Separated from direct publishing)' })
  async approve(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.reviewService.approve(type, id, req.user.userId);
  }

  @Post(':type/:id/request-changes')
  @ApiOperation({ summary: 'Request changes from author with specific review feedback' })
  async requestChanges(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
    @Req() req: Request & { user: any },
  ) {
    return this.reviewService.requestChanges(type, id, dto.feedback, req.user.userId);
  }

  @Post(':type/:id/reject')
  @ApiOperation({ summary: 'Reject content submission with explanation' })
  async reject(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Body() dto: RejectContentDto,
    @Req() req: Request & { user: any },
  ) {
    return this.reviewService.reject(type, id, dto.reason, req.user.userId);
  }

  @Post(':type/:id/publish')
  @ApiOperation({ summary: 'Direct publish content live to students catalog' })
  async publish(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.reviewService.publish(type, id, req.user.userId);
  }

  @Post(':type/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish content from public catalog' })
  async unpublish(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.reviewService.unpublish(type, id, req.user.userId);
  }

  @Post(':type/:id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer content authorship to another user' })
  async transferOwnership(
    @Param('type') type: ContentType,
    @Param('id') id: string,
    @Body() dto: TransferOwnershipDto,
    @Req() req: Request & { user: any },
  ) {
    return this.reviewService.transferOwnership(
      type,
      id,
      dto.newAuthorId,
      dto.reason,
      req.user.userId,
    );
  }
}
