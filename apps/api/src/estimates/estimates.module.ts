import { DashboardCacheModule } from '../dashboard/dashboard-cache.module';
import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AiModule } from '../ai/ai.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { CostCalculationService } from './cost-calculation.service';

@Module({
  imports: [DashboardCacheModule, AiModule, SearchModule],
  controllers: [EstimatesController],
  providers: [EstimatesService, CostCalculationService],
})
export class EstimatesModule {}
