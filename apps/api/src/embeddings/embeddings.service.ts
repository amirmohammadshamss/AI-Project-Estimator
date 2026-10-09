import { aiEnvironment } from '../config/ai-environment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { AiValidationError } from '../ai/ai.errors';
import { EMBEDDING_DIMENSIONS } from './embeddings.constants';
export { EMBEDDING_DIMENSIONS } from './embeddings.constants';
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
    return aiEnvironment(this.config).embeddingModel;
  }
  async generate(text: string): Promise<number[]> {
    const embedding = await this.ai.generateEmbedding(text);
    vectorLiteral(embedding);
    return embedding;
  }
}
