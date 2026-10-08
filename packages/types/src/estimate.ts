import { z } from 'zod';

export const ComplexitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']);
export type Complexity = z.infer<typeof ComplexitySchema>;

export const RiskSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type RiskSeverity = z.infer<typeof RiskSeveritySchema>;

export const EstimateFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  complexity: ComplexitySchema,
  estimatedHours: z.number().positive(),
  confidence: z.number().min(0).max(1),
});
export type EstimateFeature = z.infer<typeof EstimateFeatureSchema>;

export const EstimateRiskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: RiskSeveritySchema,
});
export type EstimateRisk = z.infer<typeof EstimateRiskSchema>;

/**
 * Contract for the raw structured output returned by the LLM.
 * Backend must validate every AI response against this schema before
 * persisting anything — never trust raw LLM output (doc.md §8).
 */
export const EstimateResultSchema = z.object({
  summary: z.string().min(1),
  features: z.array(EstimateFeatureSchema).min(1),
  suggestedStack: z.array(z.string().min(1)).min(1),
  risks: z.array(EstimateRiskSchema),
});
export type EstimateResult = z.infer<typeof EstimateResultSchema>;
