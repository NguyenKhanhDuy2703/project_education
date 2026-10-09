import { Module } from '@nestjs/common';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [EntitlementsModule],
  controllers: [LabsController],
  providers: [LabsService],
  exports: [LabsService],
})
export class LabsModule {}
