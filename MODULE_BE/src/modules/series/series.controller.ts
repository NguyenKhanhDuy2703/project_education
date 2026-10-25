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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { ContributorGuard } from '../../common/guards/contributor.guard';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@ApiTags('Series (Topics)')
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all practice topics / series (Public catalog)' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const showAll = includeInactive === 'true';
    return this.seriesService.findAll(showAll);
  }

  @Get('contributor/my-series')
  @UseGuards(AuthGuard('jwt'), ContributorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get series authored by currently authenticated contributor' })
  async findMySeries(@Req() req: Request & { user: any }) {
    return this.seriesService.findMySeries(req.user.userId);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get topic / series detail by slug with included practice labs (Public)' })
  async findBySlug(@Param('slug') slug: string, @Req() req: Request & { user?: any }) {
    return this.seriesService.findBySlug(slug, req.user);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), ContributorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new topic / series (Admin or Contributor)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSeriesDto, @Req() req: Request & { user: any }) {
    return this.seriesService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update topic / series (Author or Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSeriesDto,
    @Req() req: Request & { user: any },
  ) {
    return this.seriesService.update(id, dto, req.user);
  }

  @Post(':id/submit-for-review')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit topic / series to Admin Review Queue' })
  async submitForReview(@Param('id') id: string, @Req() req: Request & { user: any }) {
    return this.seriesService.submitForReview(id, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete topic / series (Author or Admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.seriesService.delete(id);
  }

  @Post(':id/sections')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a section/module to a topic / series' })
  async createSection(
    @Param('id') seriesId: string,
    @Body() dto: { title: string; description?: string; orderIndex?: number },
  ) {
    return this.seriesService.createSection(seriesId, dto);
  }

  @Put(':id/sections/:sectionId')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a section in a topic / series' })
  async updateSection(
    @Param('id') seriesId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: { title?: string; description?: string; orderIndex?: number },
  ) {
    return this.seriesService.updateSection(seriesId, sectionId, dto);
  }

  @Delete(':id/sections/:sectionId')
  @UseGuards(AuthGuard('jwt'), ContributorGuard, ResourceOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a section from a topic / series' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Param('id') seriesId: string,
    @Param('sectionId') sectionId: string,
  ) {
    await this.seriesService.deleteSection(seriesId, sectionId);
  }
}
