import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { AiService } from '../ai/ai.service';
import { AiGenerationError, AiValidationError } from '../ai/ai.errors';
import { EstimateResultSchema } from '@ape/types';
import { CreateEstimateDto, GenerateEstimateDto } from './dto/create-estimate.dto';
import { CostCalculationService } from './cost-calculation.service';

const include = { items: { orderBy: { position: 'asc' as const } } };

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly costs: CostCalculationService,
    private readonly ai: AiService,
    private readonly search: SearchService,
    private readonly dashboardCache: DashboardCacheService,
  ) {}

  private async project(tx: Prisma.TransactionClient, userId: string, projectId: string) {
    // Serialize version allocation and edits for a project, including concurrent requests.
    await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} AND "userId" = ${userId} FOR UPDATE`;
    const project = await tx.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.status === 'ARCHIVED')
      throw new BadRequestException('Archived projects cannot receive estimates.');
    return project;
  }

  async list(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found.');
    return this.prisma.estimate.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
      include,
    });
  }

  async get(userId: string, projectId: string, id: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, projectId, project: { userId } },
      include,
    });
    if (!estimate) throw new NotFoundException('Estimate not found.');
    return estimate;
  }

  async create(userId: string, projectId: string, dto: CreateEstimateDto) {
    const saved = await this.prisma.$transaction(async (tx) => {
      await this.project(tx, userId, projectId);
      return this.persist(
        tx,
        userId,
        projectId,
        dto,
        dto.features.map(() => false),
        [],
        [],
        'ESTIMATE_GENERATED',
      );
    });
    await this.dashboardCache.invalidate(userId);
    return saved;
  }

  async generate(userId: string, projectId: string, dto: GenerateEstimateDto) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.status === 'ARCHIVED')
      throw new BadRequestException('Archived projects cannot receive estimates.');
    if (!project.description.trim() || project.description.length > 5000)
      throw new BadRequestException({
        code: 'INVALID_PROJECT',
        message: 'Provide a project description of 1–5000 characters.',
      });
    let result;
    try {
      // Validate again at the persistence boundary even when AiService is replaced in tests.
      const context = await this.search.contextFor(project.description);
      result = EstimateResultSchema.parse(
        await this.ai.generateEstimate(project.description, context),
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.warn(
        `Estimate generation failed (${error instanceof AiValidationError ? 'invalid_output' : 'generation_error'}).`,
      );
      throw new AiGenerationError();
    }
    const saved = await this.prisma.$transaction(async (tx) => {
      const current = await this.project(tx, userId, projectId);
      if (current.description !== project.description)
        throw new ConflictException({
          code: 'PROJECT_CHANGED',
          message: 'The project description changed during generation. Please generate again.',
        });
      return this.persist(
        tx,
        userId,
        projectId,
        { summary: result.summary, features: result.features, ...dto },
        result.features.map(() => false),
        result.suggestedStack,
        result.risks,
        'ESTIMATE_GENERATED',
      );
    });
    await this.dashboardCache.invalidate(userId);
    return saved;
  }

  async editHours(userId: string, projectId: string, id: string, itemId: string, hours: number) {
    const saved = await this.prisma.$transaction(async (tx) => {
      await this.project(tx, userId, projectId);
      const source = await tx.estimate.findFirst({ where: { id, projectId }, include });
      if (!source || !source.items.some((item) => item.id === itemId))
        throw new NotFoundException('Estimate item not found.');
      const latest = await tx.estimate.findFirst({
        where: { projectId },
        orderBy: { version: 'desc' },
      });
      if (latest?.id !== id)
        throw new BadRequestException('Edit the latest version to preserve subsequent changes.');
      const features = source.items.map((item) => ({
        name: item.name,
        description: item.description,
        category: item.category,
        complexity: item.complexity,
        confidence: item.confidence,
        estimatedHours: item.id === itemId ? hours : Number(item.estimatedHours),
      }));
      return this.persist(
        tx,
        userId,
        projectId,
        {
          summary: source.summary,
          hourlyRate: Number(source.hourlyRate),
          currency: source.currency,
          features,
        },
        source.items.map((item) => item.manuallyModified || item.id === itemId),
        source.suggestedStack,
        source.risks as Prisma.InputJsonValue,
        'ESTIMATE_UPDATED',
      );
    });
    await this.dashboardCache.invalidate(userId);
    return saved;
  }

  private async persist(
    tx: Prisma.TransactionClient,
    userId: string,
    projectId: string,
    dto: CreateEstimateDto,
    flags: boolean[],
    suggestedStack: string[],
    risks: Prisma.InputJsonValue,
    action: string,
  ) {
    const latest = await tx.estimate.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
    const totals = this.costs.calculate(
      dto.features.map((item) => item.estimatedHours),
      dto.hourlyRate,
    );
    const estimate = await tx.estimate.create({
      data: {
        projectId,
        version: (latest?.version ?? 0) + 1,
        summary: dto.summary,
        hourlyRate: dto.hourlyRate,
        currency: dto.currency ?? 'USD',
        totalHours: totals.totalHours,
        totalCost: totals.totalCost,
        confidence:
          dto.features.reduce((sum, item) => sum + item.confidence, 0) / dto.features.length,
        suggestedStack,
        risks,
        items: {
          create: dto.features.map((item, position) => ({
            ...item,
            position,
            estimatedCost: totals.itemCosts[position]!,
            manuallyModified: flags[position],
          })),
        },
      },
      include,
    });
    await tx.project.update({ where: { id: projectId }, data: { status: 'ESTIMATED' } });
    await tx.activityLog.create({
      data: {
        userId,
        projectId,
        action,
        metadata: { estimateId: estimate.id, version: estimate.version },
      },
    });
    return estimate;
  }
}
