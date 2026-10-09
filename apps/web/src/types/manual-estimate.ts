import { z } from 'zod';
import { manualEstimateSchema } from '../schemas/manual-estimate';
export type ManualEstimateForm = z.infer<typeof manualEstimateSchema>;
