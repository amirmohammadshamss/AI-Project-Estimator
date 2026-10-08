import { Prisma } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { PrismaService } from '../prisma/prisma.service';
const decimal = (value: number) => new Prisma.Decimal(value);
describe('DashboardService', () => {
  const tx = {
    project: { findMany: jest.fn(), groupBy: jest.fn() },
    estimate: { aggregate: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
  const cache = { revision: jest.fn(), get: jest.fn(), set: jest.fn() };
  const service = new DashboardService(
    prisma as unknown as PrismaService,
    cache as unknown as DashboardCacheService,
  );
  const latest = (id: string, hours: number, cost: number, currency: string) => ({
    id,
    version: 3,
    totalHours: decimal(hours),
    totalCost: decimal(cost),
    currency,
    createdAt: new Date('2026-10-01T12:00:00Z'),
  });
  const projects = [
    {
      id: 'draft',
      name: 'New project',
      status: 'DRAFT',
      updatedAt: new Date('2026-10-08'),
      estimates: [],
    },
    {
      id: 'usd',
      name: 'Portal',
      status: 'ESTIMATED',
      updatedAt: new Date('2026-10-07'),
      estimates: [latest('usd-latest', 10, 500, 'USD')],
    },
    {
      id: 'eur',
      name: 'Archived app',
      status: 'ARCHIVED',
      updatedAt: new Date('2026-10-06'),
      estimates: [latest('eur-latest', 30, 1200, 'EUR')],
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    cache.revision.mockResolvedValue('0');
    cache.get.mockResolvedValue(undefined);
    tx.project.findMany.mockResolvedValue(projects);
    tx.project.groupBy.mockResolvedValue(
      ['DRAFT', 'ESTIMATED', 'ARCHIVED'].map((status) => ({ status, _count: { _all: 1 } })),
    );
    tx.estimate.aggregate.mockResolvedValue({
      _count: { _all: 2 },
      _sum: { totalHours: decimal(40) },
      _avg: { totalHours: decimal(20), confidence: 0.8 },
    });
  });
  it('aggregates only latest owned estimates, including archived projects, with separate currencies', async () => {
    const stats = await service.stats('owner');
    expect(stats).toMatchObject({
      totalProjects: 3,
      estimatedProjects: 2,
      totalEstimatedHours: '40',
      averageProjectSize: '20',
      averageConfidence: 0.8,
    });
    expect(stats.costOverTime).toEqual([
      { currency: 'EUR', points: [{ month: '2026-10', totalCost: '1200' }] },
      { currency: 'USD', points: [{ month: '2026-10', totalCost: '500' }] },
    ]);
    expect(tx.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'owner' },
        select: expect.objectContaining({
          estimates: expect.objectContaining({ take: 1, orderBy: { version: 'desc' } }),
        }),
      }),
    );
    expect(tx.estimate.aggregate.mock.calls[0][0].where).toEqual({
      id: { in: ['usd-latest', 'eur-latest'] },
      project: { userId: 'owner' },
    });
    expect(tx.project.groupBy.mock.calls[0][0].where).toEqual({ userId: 'owner' });
    expect(stats.hoursByProject.map((project) => project.projectId)).toEqual(['eur', 'usd']);
    expect(stats.recentProjects.map((project) => project.id)).toEqual(['draft', 'usd', 'eur']);
    expect(cache.set).toHaveBeenCalledWith('owner', '0', stats);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'RepeatableRead',
    });
  });
  it('returns valid empty statistics without NaN or fabricated confidence', async () => {
    tx.project.findMany.mockResolvedValue([]);
    tx.project.groupBy.mockResolvedValue([]);
    tx.estimate.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { totalHours: null },
      _avg: { totalHours: null, confidence: null },
    });
    const stats = await service.stats('new-user');
    expect(stats).toMatchObject({
      totalProjects: 0,
      estimatedProjects: 0,
      totalEstimatedHours: '0',
      averageProjectSize: '0',
      averageConfidence: null,
      recentProjects: [],
      costOverTime: [],
    });
  });
  it('uses cached results without querying the database', async () => {
    const cached = { totalProjects: 3 };
    cache.get.mockResolvedValue(cached);
    expect(await service.stats('owner')).toBe(cached);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('adds costs with decimal arithmetic within each month/currency', async () => {
    tx.project.findMany.mockResolvedValue([
      { ...projects[1], estimates: [latest('a', 1, 0.1, 'USD')] },
      { ...projects[2], estimates: [latest('b', 1, 0.2, 'USD')] },
    ]);
    expect((await service.stats('owner')).costOverTime[0]?.points[0]?.totalCost).toBe('0.3');
  });
});
