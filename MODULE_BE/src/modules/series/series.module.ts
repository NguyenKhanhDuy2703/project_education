import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';

@Module({
  imports: [PrismaModule],
  controllers: [SeriesController],
  providers: [SeriesService, ResourceOwnerGuard],
  exports: [SeriesService],
})
export class SeriesModule {}
