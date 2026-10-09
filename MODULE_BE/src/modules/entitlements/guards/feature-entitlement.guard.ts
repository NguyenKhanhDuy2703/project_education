import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { EntitlementsService } from '../entitlements.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class FeatureEntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route handler is not tagged with @RequireFeature, allow passage
    if (!requiredFeature) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required to access this feature');
    }

    // Administrators always possess full operational bypass
    if (user.role === UserRole.admin) {
      return true;
    }

    const evaluation = await this.entitlementsService.checkUserFeature(
      user.userId,
      requiredFeature,
    );

    if (evaluation.isBanned) {
      throw new ForbiddenException(
        evaluation.reason || 'You have been restricted from accessing this feature by administrator',
      );
    }

    if (!evaluation.hasAccess) {
      throw new ForbiddenException(
        evaluation.reason || 'This feature requires an active upgraded subscription plan',
      );
    }

    return true;
  }
}
