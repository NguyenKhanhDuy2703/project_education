import { Module } from '@nestjs/common';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { SqlGradingService } from './sql-grading.service';
import { QuizGradingService } from './quiz-grading.service';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [LabsController],
  providers: [LabsService, ResourceOwnerGuard, SqlGradingService, QuizGradingService],
  exports: [LabsService, QuizGradingService],
})
export class LabsModule {}
