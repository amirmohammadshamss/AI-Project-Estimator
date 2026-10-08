import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DashboardStats, DashboardStatsSchema } from '@ape/types';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardCacheService } from './dashboard-cache.service';
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DashboardCacheService,
  ) {}
  async stats(userId: string): Promise<DashboardStats> {
    const revision = await this.cache.revision(userId);
    const cached = await this.cache.get(userId, revision);
    if (cached) return cached;
    const result = await this.prisma.$transaction(
      async (tx) => {
        const projects = await tx.project.findMany({
          where: { userId },
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
          select: {
            id: true,
            name: true,
            status: true,
            updatedAt: true,
            estimates: {
              orderBy: { version: 'desc' },
              take: 1,
              select: {
                id: true,
                version: true,
                totalHours: true,
                totalCost: true,
                currency: true,
                createdAt: true,
              },
            },
          },
        });
        const latestIds = projects.flatMap((project) =>
          project.estimates.map((estimate) => estimate.id),
        );
        const totals = await tx.estimate.aggregate({
          where: { id: { in: latestIds }, project: { userId } },
          _sum: { totalHours: true },
          _avg: { totalHours: true, confidence: true },
          _count: { _all: true },
        });
        const groups = await tx.project.groupBy({
          by: ['status'],
          where: { userId },
          _count: { _all: true },
        });
        const costs = new Map<string, Map<string, Prisma.Decimal>>();
        for (const project of projects) {
          const estimate = project.estimates[0];
          if (!estimate) continue;
          const month = estimate.createdAt.toISOString().slice(0, 7);
          const months = costs.get(estimate.currency) ?? new Map<string, Prisma.Decimal>();
          months.set(month, (months.get(month) ?? new Prisma.Decimal(0)).add(estimate.totalCost));
          costs.set(estimate.currency, months);
        }
        return DashboardStatsSchema.parse({
          totalProjects: projects.length,
          estimatedProjects: totals._count._all,
          totalEstimatedHours: totals._sum.totalHours?.toString() ?? '0',
          averageProjectSize: totals._avg.totalHours?.toDecimalPlaces(2).toString() ?? '0',
          averageConfidence: totals._avg.confidence,
          statusDistribution: ['DRAFT', 'ESTIMATED', 'ARCHIVED'].map((status) => ({
            status,
            count: groups.find((group) => group.status === status)?._count._all ?? 0,
          })),
          hoursByProject: projects
            .filter((project) => project.estimates.length)
            .sort((a, b) => b.estimates[0]!.totalHours.comparedTo(a.estimates[0]!.totalHours))
            .slice(0, 10)
            .map((project) => ({
              projectId: project.id,
              name: project.name,
              hours: project.estimates[0]!.totalHours.toString(),
            })),
          costOverTime: [...costs]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([currency, months]) => ({
              currency,
              points: [...months]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, value]) => ({ month, totalCost: value.toString() })),
            })),
          recentProjects: projects.slice(0, 5).map((project) => ({
            id: project.id,
            name: project.name,
            status: project.status,
            updatedAt: project.updatedAt.toISOString(),
            latestEstimate: project.estimates[0]
              ? {
                  id: project.estimates[0].id,
                  version: project.estimates[0].version,
                  totalHours: project.estimates[0].totalHours.toString(),
                  totalCost: project.estimates[0].totalCost.toString(),
                  currency: project.estimates[0].currency,
                }
              : null,
          })),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    await this.cache.set(userId, revision, result);
    return result;
  }
}
