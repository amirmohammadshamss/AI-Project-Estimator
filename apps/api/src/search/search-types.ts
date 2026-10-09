import { z } from 'zod';
import { featureSchema } from './search-schema';
export type SimilarFeature = z.infer<typeof featureSchema>;
