import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SearchService } from '../search/search.service';
import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { EstimatesService } from './estimates.service';
import { CostCalculationService } from './cost-calculation.service';

// Opt-in migrated database; creates and cleans up only this suite's unique user.
const databaseSuite = process.env.SQL_TEST_DATABASE_URL ? describe : describe.skip;
databaseSuite('PostgreSQL estimate transactions', () => {
  const prisma = new PrismaService({
    datasources: { db: { url: process.env.SQL_TEST_DATABASE_URL } },
  });
  const userId = randomUUID();
  let projectId: string;
  const service = new EstimatesService(
    prisma,
    new CostCalculationService(),
    {} as AiService,
    {} as SearchService,
    { invalidate: jest.fn().mockResolvedValue(undefined) } as unknown as DashboardCacheService,
  );
  const dto = {
    summary: 'SQL acceptance fixture',
    hourlyRate: 12.34,
    currency: 'USD',
    features: [
      {
        name: 'Login',
        description: 'Account access',
        category: 'Identity',
        complexity: 'LOW',
        estimatedHours: 1.25,
        confidence: 0.9,
      },
    ],
  };
  beforeAll(async () => {
    await prisma.user.create({
      data: { id: userId, email: `${userId}@example.invalid`, passwordHash: 'test-only-unused' },
    });
    const project = await prisma.project.create({
      data: { userId, name: 'SQL fixture', description: 'Original requirements' },
    });
    projectId = project.id;
  });
  afterAll(async () => {
    try {
      await prisma.user.deleteMany({ where: { id: userId } });
    } finally {
      await prisma.$disconnect();
    }
  });
  it('serializes creates and edits, preserves snapshots, and rolls back denied writes', async () => {
    const versions = await Promise.all(
      Array.from({ length: 4 }, () => service.create(userId, projectId, dto)),
    );
    expect(versions.map((version) => version.version).sort()).toEqual([1, 2, 3, 4]);
    const source = versions.find((version) => version.version === 4)!;
    expect(source.totalCost.toFixed(2)).toBe('15.43');
    await prisma.project.update({
      where: { id: projectId },
      data: { name: 'Changed name', description: 'Changed requirements' },
    });
    const edits = await Promise.allSettled(
      [2.5, 3.5].map((hours) =>
        service.editHours(userId, projectId, source.id, source.items[0]!.id, hours),
      ),
    );
    expect(edits.filter((edit) => edit.status === 'fulfilled')).toHaveLength(1);
    expect(edits.filter((edit) => edit.status === 'rejected')).toHaveLength(1);
    const history = await service.list(userId, projectId);
    expect(history).toHaveLength(5);
    expect(history[0]).toMatchObject({
      version: 5,
      projectName: 'SQL fixture',
      projectDescription: 'Original requirements',
    });
    expect(history[0]!.items[0]!.manuallyModified).toBe(true);
    expect(
      (await service.get(userId, projectId, source.id)).items[0]!.estimatedHours.toFixed(2),
    ).toBe('1.25');
    await expect(service.create(randomUUID(), projectId, dto)).rejects.toThrow('Project not found');
    await prisma.project.update({ where: { id: projectId }, data: { status: 'ARCHIVED' } });
    await expect(service.create(userId, projectId, dto)).rejects.toThrow('Archived projects');
    expect(await prisma.estimate.count({ where: { projectId } })).toBe(5);
    expect(await prisma.activityLog.count({ where: { projectId } })).toBe(5);
  });
});
