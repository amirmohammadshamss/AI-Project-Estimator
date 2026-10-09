import {
  Controller,
  Header,
  HttpCode,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { EstimateReportsService } from './estimate-reports.service';
@ApiTags('estimates')
@ApiCookieAuth('cookieAuth')
@UseGuards(JwtAuthGuard)
@Controller('estimates')
export class EstimateReportsController {
  constructor(private readonly reports: EstimateReportsService) {}
  @Post(':id/explain')
  @HttpCode(200)
  @ApiOperation({ summary: 'Explain an owned estimate without modifying its saved version' })
  explain(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.reports.explain(user.userId, id);
  }
  @Post(':id/risks')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Analyze the saved project requirements without modifying estimate risks',
  })
  risks(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.reports.risks(user.userId, id);
  }
  @Post(':id/export')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Export a saved estimate and record ESTIMATE_EXPORTED activity' })
  async export(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.reports.export(user.userId, id);
    return new StreamableFile(result.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${result.filename}"`,
      length: result.buffer.length,
    });
  }
}
