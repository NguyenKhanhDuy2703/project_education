import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsController } from './entitlements.controller';
import { FeatureEntitlementGuard } from './guards/feature-entitlement.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [EntitlementsController],
  providers: [EntitlementsService, FeatureEntitlementGuard],
  exports: [EntitlementsService, FeatureEntitlementGuard],
})
export class EntitlementsModule {}
