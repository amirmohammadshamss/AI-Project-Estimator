import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { EmbeddingsService, vectorLiteral } from '../embeddings/embeddings.service';
const featureSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.string(),
    typicalHours: z.number().positive(),
    complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
    similarity: z.number().finite().min(-1.000001).max(1.000001),
  })
  .strict();
export type SimilarFeature = z.infer<typeof featureSchema>;
export const SEARCH_CACHE_TTL = 300;
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}
  async findSimilarFeatures(embedding: number[], k = 5): Promise<SimilarFeature[]> {
    if (!Number.isInteger(k) || k < 1 || k > 20)
      throw new Error('Search result count must be between 1 and 20.');
    const vector = vectorLiteral(embedding);
    // Parameter binding protects both the vector literal and model name.
    const rows = await this.prisma.$queryRaw<SimilarFeature[]>`
      SELECT id, name, description, category, "typicalHours", complexity,
        1 - (embedding <=> ${vector}::vector) AS similarity
      FROM "FeatureKnowledge"
      WHERE "embeddingModel" = ${this.embeddings.model}
      ORDER BY embedding <=> ${vector}::vector, id
      LIMIT ${k}`;
    return z.array(featureSchema).max(k).parse(rows);
  }
  async retrieve(description: string, k = 5): Promise<SimilarFeature[]> {
    const normalized = description.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!normalized || normalized.length > 5000) throw new Error('Invalid search description.');
    if (!Number.isInteger(k) || k < 1 || k > 20) throw new Error('Invalid result count.');
    const hash = createHash('sha256')
      .update(JSON.stringify([this.embeddings.model, k, normalized]))
      .digest('hex');
    const key = `semantic-search:v1:${hash}`;
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed = z.array(featureSchema).max(k).safeParse(JSON.parse(cached));
        if (parsed.success) return parsed.data;
      }
    } catch {
      this.logger.debug('Semantic search cache unavailable or invalid.');
    }
    const features = await this.findSimilarFeatures(await this.embeddings.generate(normalized), k);
    try {
      await this.redis.set(key, JSON.stringify(features), 'EX', SEARCH_CACHE_TTL);
    } catch {
      this.logger.debug('Semantic search cache write unavailable.');
    }
    return features;
  }
  async contextFor(description: string): Promise<string[]> {
    return (await this.retrieve(description)).map((feature) =>
      JSON.stringify({
        name: feature.name,
        description: feature.description,
        category: feature.category,
        typicalHours: feature.typicalHours,
        complexity: feature.complexity,
      }),
    );
  }
}
