import { SetMetadata } from '@nestjs/common';

export const REQUIRED_FEATURE_KEY = 'REQUIRED_FEATURE';

/**
 * Decorator to enforce feature entitlement checks on route handlers.
 * Example: @RequireFeature('VIEW_SOLUTION')
 */
export const RequireFeature = (featureCode: string) =>
  SetMetadata(REQUIRED_FEATURE_KEY, featureCode);
