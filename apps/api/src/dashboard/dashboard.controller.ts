import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/types';
import { DashboardService } from './dashboard.service';
@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('stats')
  @ApiOperation({ summary: 'Latest-estimate statistics for the authenticated user' })
  stats(@CurrentUser() user: RequestUser) {
    return this.dashboard.stats(user.userId);
  }
}
