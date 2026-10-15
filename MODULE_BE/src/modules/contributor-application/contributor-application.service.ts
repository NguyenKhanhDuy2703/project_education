import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ApplyContributorDto } from './dto/apply-contributor.dto';
import { ReviewContributorAction, ReviewContributorDto } from './dto/review-contributor.dto';

@Injectable()
export class ContributorApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Học viên nộp đơn đăng ký làm Contributor
   */
  async apply(userId: string, dto: ApplyContributorDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.isContributor) {
      throw new BadRequestException('Tài khoản của bạn đã có quyền Contributor.');
    }

    // Chặn nộp trùng nếu đang có đơn PENDING
    const pendingApp = await this.prisma.contributorApplication.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (pendingApp) {
      throw new ConflictException('Bạn đã gửi đơn và đang chờ xét duyệt.');
    }

    // Tạo đơn mới và cập nhật trạng thái user
    const application = await this.prisma.contributorApplication.create({
      data: {
        userId,
        bio: dto.bio,
        portfolioUrl: dto.portfolioUrl || null,
        sampleTopic: dto.sampleTopic,
        status: 'PENDING',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        contributorStatus: 'PENDING',
      },
    });

    return application;
  }

  /**
   * Lấy thông tin đơn đăng ký gần nhất của học viên
   */
  async getMyApplication(userId: string) {
    const application = await this.prisma.contributorApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { application };
  }

  /**
   * Danh sách đơn đăng ký cho Admin xem xét (phân trang và lọc theo status)
   */
  async findAllForAdmin(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    const [total, items] = await Promise.all([
      this.prisma.contributorApplication.count({ where }),
      this.prisma.contributorApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              role: true,
              isContributor: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin duyệt hoặc từ chối đơn
   */
  async reviewApplication(
    applicationId: string,
    adminId: string,
    dto: ReviewContributorDto,
  ) {
    const application = await this.prisma.contributorApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Đơn đăng ký không tồn tại');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException(`Đơn này đã được xử lý trước đó (Trạng thái: ${application.status}).`);
    }

    const isApproved = dto.action === ReviewContributorAction.APPROVE;
    const now = new Date();

    // 1. Cập nhật bảng ContributorApplication
    const updatedApplication = await this.prisma.contributorApplication.update({
      where: { id: applicationId },
      data: {
        status: isApproved ? 'APPROVED' : 'REJECTED',
        adminNote: dto.adminNote || null,
        reviewedById: adminId,
        reviewedAt: now,
      },
    });

    // 2. Cập nhật cờ quyền trên User
    await this.prisma.user.update({
      where: { id: application.userId },
      data: {
        isContributor: isApproved,
        contributorStatus: isApproved ? 'APPROVED' : 'REJECTED',
        ...(isApproved && application.user.role === UserRole.user ? { role: UserRole.contributor } : {}),
      },
    });

    // 3. Ghi vết Audit Trail
    await this.auditLogsService.log({
      actorId: adminId,
      targetUserId: application.userId,
      action: isApproved ? 'APPROVE_CONTRIBUTOR' : 'REJECT_CONTRIBUTOR',
      details: {
        applicationId,
        applicantEmail: application.user.email,
        note: dto.adminNote,
      },
    });

    return updatedApplication;
  }
}
