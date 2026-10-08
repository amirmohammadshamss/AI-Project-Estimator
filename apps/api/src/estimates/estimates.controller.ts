import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { CreateEstimateDto, EditHoursDto, GenerateEstimateDto } from './dto/create-estimate.dto';
import { EstimatesService } from './estimates.service';

@ApiTags('estimates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/estimates')
export class EstimatesController {
  constructor(private readonly estimates: EstimatesService) {}
  @Get() list(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.estimates.list(user.userId, projectId);
  }
  @Get(':id') get(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.estimates.get(user.userId, projectId, id);
  }
  @Post('manual') create(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateEstimateDto,
  ) {
    return this.estimates.create(user.userId, projectId, dto);
  }
  @Post() generate(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: GenerateEstimateDto,
  ) {
    return this.estimates.generate(user.userId, projectId, dto);
  }
  @Patch(':id/items/:itemId') edit(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: EditHoursDto,
  ) {
    return this.estimates.editHours(user.userId, projectId, id, itemId, dto.estimatedHours);
  }
}
