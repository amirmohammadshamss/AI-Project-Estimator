import { z } from 'zod';
const decimal = z.string().regex(/^\d+(\.\d+)?$/);
const status = z.enum(['DRAFT', 'ESTIMATED', 'ARCHIVED']);
export const DashboardStatsSchema = z
  .object({
    totalProjects: z.number().int().nonnegative(),
    estimatedProjects: z.number().int().nonnegative(),
    totalEstimatedHours: decimal,
    averageProjectSize: decimal,
    averageConfidence: z.number().min(0).max(1).nullable(),
    statusDistribution: z.array(z.object({ status, count: z.number().int().nonnegative() })),
    hoursByProject: z.array(z.object({ projectId: z.string(), name: z.string(), hours: decimal })),
    costOverTime: z.array(
      z.object({
        currency: z.string().regex(/^[A-Z]{3}$/),
        points: z.array(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), totalCost: decimal })),
      }),
    ),
    recentProjects: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status,
        updatedAt: z.string().datetime(),
        latestEstimate: z
          .object({
            id: z.string(),
            version: z.number().int().positive(),
            totalHours: decimal,
            totalCost: decimal,
            currency: z.string().regex(/^[A-Z]{3}$/),
          })
          .nullable(),
      }),
    ),
  })
  .strict();
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
