import { z } from 'zod';

export const manualEstimateSchema = z.object({
  summary: z.string().trim().min(1).max(10000),
  hourlyRate: z.number().min(0).max(1000000).multipleOf(0.01),
  currency: z.string().regex(/^[A-Z]{3}$/),
  features: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(5000),
        category: z.string().trim().min(1).max(200),
        complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
        estimatedHours: z.number().min(0.01).max(1000000).multipleOf(0.01),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(200),
});
