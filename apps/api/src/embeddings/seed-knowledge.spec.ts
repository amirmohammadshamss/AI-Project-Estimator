import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { seedKnowledge } from './seed-knowledge';
import { KNOWLEDGE_BASE } from './knowledge-base';
describe('seedKnowledge', () => {
  const tx = { $executeRaw: jest.fn() };
  const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
  const embeddings = { model: 'text-embedding-3-small', generate: jest.fn() };
  beforeEach(() => {
    jest.clearAllMocks();
    embeddings.generate.mockResolvedValue([1, ...Array(1535).fill(0)]);
  });
  it('embeds every reference feature before atomically upserting by name and model', async () => {
    expect(
      await seedKnowledge(
        prisma as unknown as PrismaService,
        embeddings as unknown as EmbeddingsService,
      ),
    ).toBe(KNOWLEDGE_BASE.length);
    expect(embeddings.generate).toHaveBeenCalledTimes(14);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(14);
    expect(tx.$executeRaw.mock.calls[0][0].join('?')).toContain(
      'ON CONFLICT (name, "embeddingModel") DO UPDATE',
    );
    expect(embeddings.generate.mock.invocationCallOrder[13]).toBeLessThan(
      prisma.$transaction.mock.invocationCallOrder[0]!,
    );
  });
  it('writes nothing if an embedding fails', async () => {
    embeddings.generate.mockRejectedValueOnce(new Error('provider error'));
    await expect(
      seedKnowledge(prisma as unknown as PrismaService, embeddings as unknown as EmbeddingsService),
    ).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
