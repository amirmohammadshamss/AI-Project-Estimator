import { DashboardCacheModule } from '../dashboard/dashboard-cache.module';
import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [DashboardCacheModule, ActivityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
