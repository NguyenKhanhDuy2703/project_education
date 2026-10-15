import { Module } from '@nestjs/common';
import { ContributorApplicationController } from './contributor-application.controller';
import { ContributorApplicationService } from './contributor-application.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [ContributorApplicationController],
  providers: [ContributorApplicationService],
  exports: [ContributorApplicationService],
})
export class ContributorApplicationModule {}
