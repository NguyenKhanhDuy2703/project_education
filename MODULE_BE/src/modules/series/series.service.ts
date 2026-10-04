import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { slugify } from '../../utils/slug.util';

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.labSeries.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { labs: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const series = await this.prisma.labSeries.findUnique({
      where: { slug },
      include: {
        labs: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            sandboxType: true,
            durationMinutes: true,
            isFreePreview: true,
            isProOnly: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!series) {
      throw new NotFoundException(`Topic with slug "${slug}" not found`);
    }

    return series;
  }

  async findById(id: string) {
    const series = await this.prisma.labSeries.findUnique({
      where: { id },
      include: {
        labs: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!series) {
      throw new NotFoundException(`Topic with ID "${id}" not found`);
    }

    return series;
  }

  async create(dto: CreateSeriesDto) {
    const targetSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);

    const existing = await this.prisma.labSeries.findUnique({
      where: { slug: targetSlug },
    });

    if (existing) {
      throw new ConflictException(`Slug "${targetSlug}" already exists. Please choose another.`);
    }

    return this.prisma.labSeries.create({
      data: {
        ...dto,
        slug: targetSlug,
      },
    });
  }

  async update(id: string, dto: UpdateSeriesDto) {
    await this.findById(id);

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const existing = await this.prisma.labSeries.findFirst({
        where: {
          slug: formattedSlug,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(`Slug "${formattedSlug}" is already in use by another topic.`);
      }
      dto.slug = formattedSlug;
    }

    return this.prisma.labSeries.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.labSeries.delete({
      where: { id },
    });
  }
}
