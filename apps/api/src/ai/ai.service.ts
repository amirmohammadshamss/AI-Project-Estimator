import { messages } from '../content/ai-ai.service';
import { aiPrompts } from './ai-prompts';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  EstimateResult,
  EstimateResultSchema,
  EstimateExplanationInput,
  EstimateExplanationInputSchema,
  EstimateExplanationSchema,
  DetectedRisksSchema,
} from '@ape/types';
import { AI_PROVIDER, AiProvider, StructuredRequest } from './ai.provider';
import {
  AiGenerationError,
  AiNotConfiguredError,
  AiProviderError,
  AiValidationError,
} from './ai.errors';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  private validate<T>(raw: unknown, schema: z.ZodType<T>): T {
    let value = raw;
    if (typeof raw === 'string') {
      try {
        value = JSON.parse(raw);
      } catch {
        throw new AiValidationError();
      }
    }
    const result = schema.safeParse(value);
    if (!result.success) throw new AiValidationError();
    return result.data;
  }
  private async structured<T>(request: StructuredRequest, schema: z.ZodType<T>): Promise<T> {
    try {
      return this.validate(await this.provider.generateStructured(request), schema);
    } catch (error) {
      if (error instanceof AiProviderError && error.reason === 'not_configured')
        throw new AiNotConfiguredError();
      if (error instanceof AiValidationError) throw error;
      // Do not log provider messages, prompts, API keys, or raw model responses.
      this.logger.warn(
        `AI request failed (${error instanceof AiProviderError ? error.reason : 'provider_error'}).`,
      );
      throw new AiGenerationError();
    }
  }
  async generateEstimate(description: string, context: string[] = []): Promise<EstimateResult> {
    if (!description?.trim() || description.length > 5000)
      throw new BadRequestException({
        code: 'INVALID_PROJECT',
        message: messages.provideAProjectDescriptionOf15000,
      });
    return this.structured(
      {
        name: 'estimate_result',
        schema: EstimateResultSchema,
        instructions: aiPrompts.estimate,
        input: JSON.stringify({ description, retrievedFeatures: context }),
      },
      EstimateResultSchema,
    );
  }
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      return this.validate(
        await this.provider.generateEmbedding(text),
        z.array(z.number().finite()).min(1),
      );
    } catch (error) {
      if (error instanceof AiProviderError && error.reason === 'not_configured')
        throw new AiNotConfiguredError();
      if (error instanceof AiValidationError) throw error;
      this.logger.warn('AI embedding request failed.');
      throw new AiGenerationError();
    }
  }
  async explainEstimate(estimate: EstimateExplanationInput): Promise<string> {
    const result = await this.structured(
      {
        name: 'estimate_explanation',
        schema: EstimateExplanationSchema,
        instructions: aiPrompts.explanation,
        input: JSON.stringify(EstimateExplanationInputSchema.parse(estimate)),
      },
      EstimateExplanationSchema,
    );
    return result.explanation;
  }
  async detectRisks(description: string) {
    const result = await this.structured(
      {
        name: 'estimate_risks',
        schema: DetectedRisksSchema,
        instructions: aiPrompts.risks,
        input: JSON.stringify({ description }),
      },
      DetectedRisksSchema,
    );
    return result.risks;
  }
}
