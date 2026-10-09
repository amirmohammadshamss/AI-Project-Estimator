import { z } from 'zod';
export const featureSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.string(),
    typicalHours: z.number().positive(),
    complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
    similarity: z.number().finite().min(-1.000001).max(1.000001),
  })
  .strict();
