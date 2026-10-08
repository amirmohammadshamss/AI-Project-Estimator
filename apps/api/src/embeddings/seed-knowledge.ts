import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService, vectorLiteral } from './embeddings.service';
import { KNOWLEDGE_BASE } from './knowledge-base';
export async function seedKnowledge(prisma: PrismaService, embeddings: EmbeddingsService) {
  const model = embeddings.model;
  // Complete provider calls before opening a transaction, avoiding partial seed writes.
  const rows: ((typeof KNOWLEDGE_BASE)[number] & { vector: string })[] = [];
  for (const feature of KNOWLEDGE_BASE)
    rows.push({
      ...feature,
      vector: vectorLiteral(await embeddings.generate(`${feature.name}: ${feature.description}`)),
    });
  await prisma.$transaction(async (tx) => {
    for (const feature of rows)
      await tx.$executeRaw`
      INSERT INTO "FeatureKnowledge" (id, name, description, category, "typicalHours", complexity, "embeddingModel", embedding)
      VALUES (${randomUUID()}, ${feature.name}, ${feature.description}, ${feature.category}, ${feature.typicalHours}, ${feature.complexity}, ${model}, ${feature.vector}::vector)
      ON CONFLICT (name, "embeddingModel") DO UPDATE SET
        description = EXCLUDED.description, category = EXCLUDED.category,
        "typicalHours" = EXCLUDED."typicalHours", complexity = EXCLUDED.complexity,
        embedding = EXCLUDED.embedding, "updatedAt" = CURRENT_TIMESTAMP`;
  });
  return rows.length;
}
