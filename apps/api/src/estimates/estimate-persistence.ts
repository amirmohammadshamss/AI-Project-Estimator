import { Prisma } from '@prisma/client';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { CostCalculationService } from './cost-calculation.service';
import { estimateInclude } from './estimate-query';

export async function persistEstimate(
  tx: Prisma.TransactionClient,
  costs: CostCalculationService,
  userId: string,
  projectId: string,
  dto: CreateEstimateDto,
  flags: boolean[],
  suggestedStack: string[],
  risks: Prisma.InputJsonValue,
  action: string,
  snapshot: { projectName: string; projectDescription: string },
) {
  const latest = await tx.estimate.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  });
  const totals = costs.calculate(
    dto.features.map((item) => item.estimatedHours),
    dto.hourlyRate,
  );
  const estimate = await tx.estimate.create({
    data: {
      ...snapshot,
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
    include: estimateInclude,
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
