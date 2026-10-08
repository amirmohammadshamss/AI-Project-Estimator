import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SearchService } from './search.service';

// Explicit opt-in; uses a temporary table and never changes application rows.
const databaseSuite = process.env.VECTOR_TEST_DATABASE_URL ? describe : describe.skip;
databaseSuite('pgvector nearest-feature integration', () => {
  it('ranks known embeddings by cosine distance and excludes incompatible models', async () => {
    const prisma = new PrismaService({
      datasources: { db: { url: process.env.VECTOR_TEST_DATABASE_URL } },
    });
    const vector = (first: number, second: number) =>
      `[${[first, second, ...Array(1534).fill(0)].join(',')}]`;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`CREATE TEMPORARY TABLE "FeatureKnowledge" (id text, name text, description text, category text, "typicalHours" float8, complexity text, "embeddingModel" text, embedding vector(1536)) ON COMMIT DROP`;
        for (const row of [
          { id: 'nearest', name: 'Billing', model: 'test-model', value: vector(1, 0) },
          { id: 'middle', name: 'Chat', model: 'test-model', value: vector(1, 1) },
          { id: 'far', name: 'Login', model: 'test-model', value: vector(0, 1) },
          { id: 'incompatible', name: 'Other', model: 'other-model', value: vector(1, 0) },
        ])
          await tx.$executeRaw`INSERT INTO "FeatureKnowledge" VALUES (${row.id}, ${row.name}, 'Reference', 'Test', 24, 'MEDIUM', ${row.model}, ${row.value}::vector)`;
        const search = new SearchService(
          tx as unknown as PrismaService,
          { model: 'test-model' } as EmbeddingsService,
          {} as Redis,
        );
        const result = await search.findSimilarFeatures([1, 0, ...Array(1534).fill(0)], 2);
        expect(result.map((feature) => feature.name)).toEqual(['Billing', 'Chat']);
        expect(result[0]?.similarity).toBeCloseTo(1);
        expect(result[1]?.similarity).toBeCloseTo(Math.SQRT1_2);
      });
    } finally {
      await prisma.$disconnect();
    }
  });
});
