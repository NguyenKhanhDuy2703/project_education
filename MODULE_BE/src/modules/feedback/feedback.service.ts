import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto, userId?: string) {
    return this.prisma.feedback.create({
      data: {
        userId: userId || null,
        email: dto.email || null,
        category: dto.category,
        message: dto.message,
        pageUrl: dto.pageUrl || null,
      },
    });
  }

  async findAll() {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Feedback with ID "${id}" not found`);
    }

    return this.prisma.feedback.delete({
      where: { id },
    });
  }
}
