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
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      if (!apiKey?.trim()) throw new AiProviderError('not_configured');
      const timeout = Number(this.config.get<string>('OPENAI_TIMEOUT_MS') ?? 60000);
      if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 120000)
        throw new AiProviderError('invalid_configuration');
      const baseURL = this.config.get<string>('OPENAI_BASE_URL');
      this.client = new OpenAI({ apiKey, timeout, maxRetries: 0, ...(baseURL ? { baseURL } : {}) });
    }
    return this.client;
  }
  async generateStructured(request: StructuredRequest): Promise<unknown> {
    const response = await this.getClient().responses.create({
      model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
      instructions: request.instructions,
      input: request.input,
      text: { format: zodTextFormat(request.schema, request.name) },
      max_output_tokens: 8192,
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
      model: this.config.get<string>('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });
    return response.data[0]?.embedding;
  }
}
