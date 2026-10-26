import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params?.id;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Administrators possess master operational bypass
    if (user.role === UserRole.admin) {
      return true;
    }

    if (!resourceId) {
      return true;
    }

    // Determine target resource type from route path
    const path = request.route?.path || request.url;
    const isSeries = path.includes('/series');
    const isLab = path.includes('/labs');

    let authorId: string | null = null;

    if (isSeries) {
      const series = await this.prisma.labSeries.findUnique({
        where: { id: resourceId },
        select: { id: true, authorId: true },
      });
      if (!series) {
        throw new NotFoundException(`Series with ID ${resourceId} not found`);
      }
      authorId = series.authorId;
    } else if (isLab) {
      const lab = await this.prisma.lab.findUnique({
        where: { id: resourceId },
        select: { id: true, authorId: true },
      });
      if (!lab) {
        throw new NotFoundException(`Lab with ID ${resourceId} not found`);
      }
      authorId = lab.authorId;
    }

    // Non-admin users can ONLY modify resources they author; orphan resources require admin
    if (!authorId || authorId !== user.userId) {
      throw new ForbiddenException(
        'Access Denied: You are not authorized to modify or delete content authored by another user or orphaned resources',
      );
    }

    return true;
  }
}
