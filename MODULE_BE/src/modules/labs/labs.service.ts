import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { slugify } from '../../utils/slug.util';
import { UserRole } from '@prisma/client';

import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class LabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async findBySlug(slug: string, currentUser?: { userId: string; role: UserRole }) {
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

    // Dynamic Entitlement Resolution: Check VIEW_SOLUTION feature
    let canViewSolution = false;
    if (currentUser) {
      if (currentUser.role === UserRole.admin) {
        canViewSolution = true;
      } else {
        const evaluation = await this.entitlementsService.checkUserFeature(
          currentUser.userId,
          'VIEW_SOLUTION',
        );
        canViewSolution = evaluation.hasAccess && !evaluation.isBanned;
      }
    }

    const { solution, ...publicFields } = lab;

    return {
      ...publicFields,
      solution: canViewSolution ? solution : null,
    };
  }

  async submit(
    labId: string,
    userId: string,
    payload: { submittedCode: string; status: string; timeMs: number },
  ) {
    const lab = await this.findById(labId);
    return {
      message: 'Lab attempt submitted successfully',
      labId: lab.id,
      userId,
      status: payload.status,
      timeMs: payload.timeMs,
      timestamp: new Date().toISOString(),
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
    // 1. Verify parent topic existence
    const series = await this.prisma.labSeries.findUnique({
      where: { id: dto.seriesId },
    });
    if (!series) {
      throw new NotFoundException(`Topic (Series) with ID "${dto.seriesId}" does not exist.`);
    }

    // 2. Generate normalized slug
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
