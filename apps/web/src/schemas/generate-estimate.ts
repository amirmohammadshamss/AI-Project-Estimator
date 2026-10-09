import { z } from 'zod';

export const schema = z.object({
  hourlyRate: z.number().min(0).max(1000000).multipleOf(0.01),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
