import { Module } from '@nestjs/common';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { SqlGradingService } from './sql-grading.service';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [LabsController],
  providers: [LabsService, ResourceOwnerGuard, SqlGradingService],
  exports: [LabsService],
})
export class LabsModule {}
