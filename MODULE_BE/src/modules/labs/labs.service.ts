import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { slugify } from '../../utils/slug.util';
import { UserRole } from '@prisma/client';

@Injectable()
export class LabsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string, role?: UserRole) {
    const lab = await this.prisma.lab.findUnique({
      where: { slug },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    if (!lab) {
      throw new NotFoundException(`Practice Lab with slug "${slug}" not found`);
    }

    // Solution chỉ hiển thị cho admin hoặc userPro
    const isPrivileged = role === UserRole.admin || role === UserRole.userPro;
    const { solution, ...publicFields } = lab;

    return {
      ...publicFields,
      solution: isPrivileged ? solution : null,
    };
  }

  async findById(id: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: {
        series: true,
      },
    });

    if (!lab) {
      throw new NotFoundException(`Lab with ID "${id}" not found`);
    }

    return lab;
  }

  async create(dto: CreateLabDto) {
    // 1. Kiểm tra Topic cha có tồn tại không
    const series = await this.prisma.labSeries.findUnique({
      where: { id: dto.seriesId },
    });
    if (!series) {
      throw new NotFoundException(`Topic (Series) with ID "${dto.seriesId}" does not exist.`);
    }

    // 2. Tạo slug chuẩn
    const targetSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);

    const existing = await this.prisma.lab.findUnique({
      where: { slug: targetSlug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${targetSlug}" already exists. Please choose another.`);
    }

    return this.prisma.lab.create({
      data: {
        ...dto,
        slug: targetSlug,
      },
    });
  }

  async update(id: string, dto: UpdateLabDto) {
    await this.findById(id);

    if (dto.seriesId) {
      const series = await this.prisma.labSeries.findUnique({
        where: { id: dto.seriesId },
      });
      if (!series) {
        throw new NotFoundException(`Topic (Series) with ID "${dto.seriesId}" does not exist.`);
      }
    }

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const existing = await this.prisma.lab.findFirst({
        where: {
          slug: formattedSlug,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(`Slug "${formattedSlug}" is already in use by another lab.`);
      }
      dto.slug = formattedSlug;
    }

    return this.prisma.lab.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.lab.delete({
      where: { id },
    });
  }
}
