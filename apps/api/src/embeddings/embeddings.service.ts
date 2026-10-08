import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { AiValidationError } from '../ai/ai.errors';
export const EMBEDDING_DIMENSIONS = 1536;
export function vectorLiteral(embedding: number[]): string {
  if (
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((value) => !Number.isFinite(value)) ||
    !embedding.some((value) => value !== 0)
  )
    throw new AiValidationError();
  return `[${embedding.join(',')}]`;
}
@Injectable()
export class EmbeddingsService {
  constructor(
    private readonly ai: AiService,
    private readonly config: ConfigService,
  ) {}
  get model(): string {
    return this.config.get<string>('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small';
  }
  async generate(text: string): Promise<number[]> {
    const embedding = await this.ai.generateEmbedding(text);
    vectorLiteral(embedding);
    return embedding;
  }
}
