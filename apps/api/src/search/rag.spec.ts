import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SearchService } from './search.service';
import { EstimatesService } from '../estimates/estimates.service';
import { CostCalculationService } from '../estimates/cost-calculation.service';

describe('RAG estimate pipeline with mocked provider', () => {
  it('passes retrieved features through the actual AiService prompt and persists differing estimates', async () => {
    const provider = {
      generateEmbedding: jest.fn().mockResolvedValue([1, ...Array(1535).fill(0)]),
      generateStructured: jest.fn(async (request) => {
        const context = JSON.parse(JSON.parse(request.input).retrievedFeatures[0]);
        return JSON.stringify({
          summary: 'Based on retrieved reference',
          features: [
            {
              name: context.name,
              description: context.description,
              category: context.category,
              complexity: context.complexity,
              estimatedHours: context.typicalHours,
              confidence: 0.8,
            },
          ],
          suggestedStack: ['NestJS'],
          risks: [],
        });
      }),
    };
    const ai = new AiService(provider);
    const embeddings = new EmbeddingsService(ai, {
      get: () => undefined,
    } as unknown as ConfigService);
    const tx = {
      $queryRaw: jest.fn(),
      project: {
        findFirst: jest.fn().mockResolvedValue({ status: 'DRAFT', description: 'Build a portal' }),
        update: jest.fn(),
      },
      estimate: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(async ({ data }) => ({ id: 'new', ...data })),
      },
      activityLog: { create: jest.fn() },
    };
    const prisma = { ...tx, $transaction: jest.fn((callback) => callback(tx)) };
    const redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    const search = new SearchService(
      prisma as unknown as PrismaService,
      embeddings,
      redis as unknown as Redis,
    );
    const estimates = new EstimatesService(
      prisma as unknown as PrismaService,
      new CostCalculationService(),
      ai,
      search,
      { invalidate: jest.fn() } as unknown as DashboardCacheService,
    );
    const feature = {
      id: 'f1',
      name: 'Authentication',
      description: 'Login',
      category: 'Identity',
      typicalHours: 24,
      complexity: 'MEDIUM',
      similarity: 1,
    };
    tx.$queryRaw.mockResolvedValue([feature]);
    const first = await estimates.generate('owner', 'project', { hourlyRate: 50 });
    expect(first.totalHours.toString()).toBe('24');
    expect(first.totalCost.toString()).toBe('1200');
    expect(provider.generateStructured.mock.calls[0]?.[0].input).toContain('Authentication');
    tx.$queryRaw.mockResolvedValue([{ ...feature, name: 'Stripe Payments', typicalHours: 32 }]);
    const second = await estimates.generate('owner', 'project', { hourlyRate: 50 });
    expect(second.totalHours.toString()).toBe('32');
    expect(provider.generateStructured.mock.calls[1]?.[0].input).toContain('Stripe Payments');
    expect(provider.generateEmbedding).toHaveBeenCalledTimes(2);
  });
});
