import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SearchService, SEARCH_CACHE_TTL } from './search.service';
const vector = [1, ...Array(1535).fill(0)];
const feature = {
  id: 'f1',
  name: 'Authentication',
  description: 'Login and sessions',
  category: 'Identity',
  typicalHours: 24,
  complexity: 'MEDIUM',
  similarity: 0.95,
};
describe('SearchService', () => {
  const prisma = { $queryRaw: jest.fn() };
  const embeddings = { model: 'text-embedding-3-small', generate: jest.fn() };
  const redis = { get: jest.fn(), set: jest.fn() };
  const service = new SearchService(
    prisma as unknown as PrismaService,
    embeddings as unknown as EmbeddingsService,
    redis as unknown as Redis,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    embeddings.model = 'text-embedding-3-small';
    redis.get.mockResolvedValue(null);
    prisma.$queryRaw.mockResolvedValue([feature]);
    embeddings.generate.mockResolvedValue(vector);
  });
  it('queries cosine distance with bound vector, model and limit', async () => {
    expect(await service.findSimilarFeatures(vector, 3)).toEqual([feature]);
    const [sql, literal, model, orderVector, k] = prisma.$queryRaw.mock.calls[0];
    expect(sql.join('?')).toContain('embedding <=> ?::vector');
    expect(sql.join('?')).not.toMatch(/ILIKE|LIKE/);
    expect(literal).toBe(orderVector);
    expect(model).toBe('text-embedding-3-small');
    expect(k).toBe(3);
  });
  it('caches normalized description results for five minutes without storing plaintext keys', async () => {
    await service.retrieve('  Build  a portal  ');
    expect(embeddings.generate).toHaveBeenCalledWith('Build a portal');
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^semantic-search:v1:[a-f0-9]{64}$/),
      JSON.stringify([feature]),
      'EX',
      SEARCH_CACHE_TTL,
    );
    redis.get.mockResolvedValue(JSON.stringify([feature]));
    expect(await service.retrieve('Build a portal')).toEqual([feature]);
    expect(embeddings.generate).toHaveBeenCalledTimes(1);
    expect(redis.get.mock.calls[0][0]).toBe(redis.get.mock.calls[1][0]);
  });
  it('separates cache keys by model and result count', async () => {
    await service.retrieve('Portal', 5);
    embeddings.model = 'other-model';
    await service.retrieve('Portal', 5);
    await service.retrieve('Portal', 3);
    expect(new Set(redis.get.mock.calls.map((call) => call[0])).size).toBe(3);
  });
  it('falls back after invalid cache data or Redis failure', async () => {
    redis.get.mockResolvedValue('invalid json');
    redis.set.mockRejectedValue(new Error('offline'));
    expect(await service.retrieve('Portal')).toEqual([feature]);
    redis.get.mockRejectedValue(new Error('offline'));
    expect(await service.retrieve('Portal')).toEqual([feature]);
  });
  it('does not trust cached feature data', async () => {
    redis.get.mockResolvedValue(JSON.stringify([{ ...feature, typicalHours: -1 }]));
    await service.retrieve('Portal');
    expect(embeddings.generate).toHaveBeenCalledTimes(1);
  });
  it('builds reference context with hours and complexity', async () => {
    expect((await service.contextFor('Portal')).map((text) => JSON.parse(text))).toEqual([
      {
        name: feature.name,
        description: feature.description,
        category: feature.category,
        typicalHours: 24,
        complexity: 'MEDIUM',
      },
    ]);
  });
  it('handles an unseeded knowledge base', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    expect(await service.contextFor('Portal')).toEqual([]);
  });
  it('rejects invalid limits and vectors before running SQL', async () => {
    await expect(service.findSimilarFeatures(vector, 0)).rejects.toThrow();
    await expect(service.findSimilarFeatures(vector, 21)).rejects.toThrow();
    await expect(service.findSimilarFeatures([NaN])).rejects.toThrow();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
