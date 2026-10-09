import { aiDefaults, aiEnvironment } from '../config/ai-environment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { AiProvider, StructuredRequest } from './ai.provider';
import { AiProviderError } from './ai.errors';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private client?: OpenAI;
  constructor(private readonly config: ConfigService) {}
  private getClient() {
    if (!this.client) {
      const { apiKey, timeoutMs: timeout, baseUrl: baseURL } = aiEnvironment(this.config);
      if (!apiKey?.trim()) throw new AiProviderError('not_configured');
      if (
        !Number.isFinite(timeout) ||
        timeout < aiDefaults.minTimeoutMs ||
        timeout > aiDefaults.maxTimeoutMs
      )
        throw new AiProviderError('invalid_configuration');
      this.client = new OpenAI({ apiKey, timeout, maxRetries: 0, ...(baseURL ? { baseURL } : {}) });
    }
    return this.client;
  }
  async generateStructured(request: StructuredRequest): Promise<unknown> {
    const response = await this.getClient().responses.create({
      model: aiEnvironment(this.config).model,
      instructions: request.instructions,
      input: request.input,
      text: { format: zodTextFormat(request.schema, request.name) },
      max_output_tokens: aiDefaults.maxOutputTokens,
      store: false,
    });
    if (response.status !== 'completed') throw new AiProviderError('incomplete');
    if (
      response.output.some(
        (item) => item.type === 'message' && item.content.some((part) => part.type === 'refusal'),
      )
    )
      throw new AiProviderError('refused');
    return response.output_text;
  }
  async generateEmbedding(text: string): Promise<unknown> {
    const response = await this.getClient().embeddings.create({
      model: aiEnvironment(this.config).embeddingModel,
      input: text,
      dimensions: 1536,
    });
    return response.data[0]?.embedding;
  }
}
