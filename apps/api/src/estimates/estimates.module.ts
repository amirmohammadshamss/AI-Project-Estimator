import { EstimateReportsController } from './estimate-reports.controller';
import { EstimateReportsService } from './estimate-reports.service';
import { EstimatePdfService } from './estimate-pdf.service';
import { DashboardCacheModule } from '../dashboard/dashboard-cache.module';
import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AiModule } from '../ai/ai.module';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { CostCalculationService } from './cost-calculation.service';

@Module({
  imports: [DashboardCacheModule, AiModule, SearchModule],
  controllers: [EstimatesController, EstimateReportsController],
  providers: [EstimatesService, CostCalculationService, EstimateReportsService, EstimatePdfService],
})
export class EstimatesModule {}
