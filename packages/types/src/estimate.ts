import { z } from 'zod';

export const ComplexitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']);
export type Complexity = z.infer<typeof ComplexitySchema>;

export const RiskSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type RiskSeverity = z.infer<typeof RiskSeveritySchema>;

export const EstimateFeatureSchema = z
  .object({
    name: z.string().min(1).regex(/\S/).max(200),
    description: z.string().min(1).regex(/\S/).max(5000),
    category: z.string().min(1).regex(/\S/).max(200),
    complexity: ComplexitySchema,
    estimatedHours: z.number().finite().min(0.01).max(1000000).multipleOf(0.01),
    confidence: z.number().finite().min(0).max(1),
  })
  .strict();
export type EstimateFeature = z.infer<typeof EstimateFeatureSchema>;

export const EstimateRiskSchema = z
  .object({
    title: z.string().min(1).regex(/\S/).max(5000),
    description: z.string().min(1).regex(/\S/).max(5000),
    severity: RiskSeveritySchema,
  })
  .strict();
export type EstimateRisk = z.infer<typeof EstimateRiskSchema>;

/**
 * Contract for the raw structured output returned by the LLM.
 * Backend must validate every AI response against this schema before
 * persisting anything — never trust raw LLM output (doc.md §8).
 */
export const EstimateResultSchema = z
  .object({
    summary: z.string().min(1).regex(/\S/).max(5000),
    features: z.array(EstimateFeatureSchema).min(1).max(200),
    suggestedStack: z.array(z.string().min(1).regex(/\S/).max(200)).min(1).max(50),
    risks: z.array(EstimateRiskSchema).max(100),
  })
  .strict();
export type EstimateResult = z.infer<typeof EstimateResultSchema>;

export const EstimateExplanationSchema = z
  .object({ explanation: z.string().min(1).regex(/\S/).max(10000) })
  .strict();
export const DetectedRisksSchema = z
  .object({ risks: z.array(EstimateRiskSchema).max(100) })
  .strict();

export const EstimateExplanationInputSchema = EstimateResultSchema.extend({
  summary: z.string().min(1).regex(/\S/).max(10000),
  suggestedStack: z.array(z.string().min(1).max(200)).max(50),
});
export type EstimateExplanationInput = z.infer<typeof EstimateExplanationInputSchema>;
