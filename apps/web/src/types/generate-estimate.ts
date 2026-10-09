import { z } from 'zod';
import { schema } from '../schemas/generate-estimate';
export type GenerateEstimateForm = z.infer<typeof schema>;
