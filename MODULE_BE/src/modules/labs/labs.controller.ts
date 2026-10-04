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
import { UserRole } from '@prisma/client';
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';

@ApiTags('Labs (Practice & Blog)')
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Lấy chi tiết bài thực hành / blog qua slug (Public / Học viên)' })
  async findBySlug(@Param('slug') slug: string, @Req() req: Request & { user?: any }) {
    const userRole = req.user?.role;
    return this.labsService.findBySlug(slug, userRole);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mới một bài thực hành / blog (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLabDto) {
    return this.labsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chỉnh sửa bài thực hành / blog (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateLabDto) {
    return this.labsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa bài thực hành / blog (Admin only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.labsService.delete(id);
  }
}
