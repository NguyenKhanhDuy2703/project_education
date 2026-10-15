import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class ContributorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Administrators always possess full operational bypass
    if (user.role === UserRole.admin) {
      return true;
    }

    // Check if user has contributor capability
    if (user.isContributor === true) {
      return true;
    }

    throw new ForbiddenException('Bạn cần quyền Contributor để truy cập và thực hiện thao tác này');
  }
}
