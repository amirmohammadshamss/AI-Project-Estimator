import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { AiService } from '../ai/ai.service';
import { EstimatesService } from './estimates.service';
import { CostCalculationService } from './cost-calculation.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEstimateDto, EditHoursDto } from './dto/create-estimate.dto';

const dto = {
  summary: 'A portal',
  hourlyRate: 50,
  features: [
    {
      name: 'Login',
      description: 'Sign in',
      category: 'Auth',
      complexity: 'LOW',
      estimatedHours: 10,
      confidence: 0.8,
    },
  ],
};
describe('EstimatesService', () => {
  const tx = {
    $queryRaw: jest.fn(),
    project: { findFirst: jest.fn(), update: jest.fn() },
    estimate: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    activityLog: { create: jest.fn() },
  };
  const prisma = { ...tx, $transaction: jest.fn((callback) => callback(tx)) };
  const search = { contextFor: jest.fn() };
  const dashboardCache = { invalidate: jest.fn() };
  const ai = { generateEstimate: jest.fn() };
  const service = new EstimatesService(
    prisma as unknown as PrismaService,
    new CostCalculationService(),
    ai as unknown as AiService,
    search as unknown as SearchService,
    dashboardCache as unknown as DashboardCacheService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    search.contextFor.mockResolvedValue(['Authentication']);
    tx.project.findFirst.mockResolvedValue({
      id: 'project',
      name: 'Portal snapshot',
      status: 'DRAFT',
      description: 'Build a portal',
    });
    tx.estimate.findFirst.mockResolvedValue(null);
    tx.estimate.create.mockImplementation(async ({ data }) => ({ ...data, id: 'new' }));
  });
  const aiResult = {
    summary: dto.summary,
    features: dto.features,
    suggestedStack: ['NestJS'],
    risks: [{ title: 'Scope', description: 'Requirements may change', severity: 'MEDIUM' }],
  };
  it('generates from the saved description and persists stack, risks and deterministic totals', async () => {
    ai.generateEstimate.mockResolvedValue(aiResult);
    tx.estimate.findFirst.mockResolvedValue({ version: 2 });
    const result = await service.generate('owner', 'project', { hourlyRate: 75, currency: 'EUR' });
    expect(ai.generateEstimate).toHaveBeenCalledWith('Build a portal', ['Authentication']);
    expect(result.version).toBe(3);
    expect(dashboardCache.invalidate).toHaveBeenCalledWith('owner');
    expect(result.totalCost.toString()).toBe('750');
    expect(result.projectName).toBe('Portal snapshot');
    expect(result.suggestedStack).toEqual(['NestJS']);
    expect(result.risks).toEqual(aiResult.risks);
    expect(tx.estimate.create.mock.calls[0][0].data.items.create[0].manuallyModified).toBe(false);
  });
  it('does not call AI for inaccessible projects', async () => {
    tx.project.findFirst.mockResolvedValue(null);
    await expect(service.generate('other', 'project', { hourlyRate: 50 })).rejects.toThrow(
      NotFoundException,
    );
    expect(ai.generateEstimate).not.toHaveBeenCalled();
  });
  it('sanitizes retrieval failures without generating or persisting', async () => {
    search.contextFor.mockRejectedValueOnce(new Error('database internals'));
    await expect(service.generate('owner', 'project', { hourlyRate: 50 })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_GENERATION_FAILED' }),
    });
    expect(ai.generateEstimate).not.toHaveBeenCalled();
    expect(tx.estimate.create).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
  });
  it('rejects invalid descriptions before embedding retrieval', async () => {
    tx.project.findFirst.mockResolvedValue({ description: '   ', status: 'DRAFT' });
    await expect(service.generate('owner', 'project', { hourlyRate: 50 })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'INVALID_PROJECT' }),
    });
    expect(search.contextFor).not.toHaveBeenCalled();
  });
  it('does not hold a database transaction during AI generation', async () => {
    ai.generateEstimate.mockImplementation(async () => {
      expect(prisma.$transaction).not.toHaveBeenCalled();
      return aiResult;
    });
    await service.generate('owner', 'project', { hourlyRate: 50 });
  });
  it('does not persist malformed provider output', async () => {
    ai.generateEstimate.mockResolvedValue({ ...aiResult, totalCost: 1 });
    await expect(service.generate('owner', 'project', { hourlyRate: 50 })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_GENERATION_FAILED' }),
    });
    expect(tx.estimate.create).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects generation when requirements change before persistence', async () => {
    ai.generateEstimate.mockResolvedValue(aiResult);
    tx.project.findFirst
      .mockResolvedValueOnce({ description: 'Old requirements', status: 'DRAFT' })
      .mockResolvedValueOnce({ description: 'New requirements', status: 'DRAFT' });
    await expect(service.generate('owner', 'project', { hourlyRate: 50 })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PROJECT_CHANGED' }),
    });
    expect(tx.estimate.create).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
  });
  it('rechecks archived status after generation', async () => {
    ai.generateEstimate.mockResolvedValue(aiResult);
    tx.project.findFirst
      .mockResolvedValueOnce({ description: 'Build a portal', status: 'DRAFT' })
      .mockResolvedValueOnce({ status: 'ARCHIVED' });
    await expect(service.generate('owner', 'project', { hourlyRate: 50 })).rejects.toThrow(
      BadRequestException,
    );
    expect(tx.estimate.create).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
  });
  it('creates the next version and computes costs rather than accepting totals', async () => {
    tx.estimate.findFirst.mockResolvedValue({ version: 2 });
    const result = await service.create('owner', 'project', dto);
    expect(result.version).toBe(3);
    expect(dashboardCache.invalidate).toHaveBeenCalledWith('owner');
    expect(result.totalHours.toString()).toBe('10');
    expect(result.totalCost.toString()).toBe('500');
    expect(tx.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'project', userId: 'owner' },
    });
    expect(tx.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'ESTIMATE_GENERATED' }) }),
    );
    expect(tx.$queryRaw).toHaveBeenCalled();
  });
  it('blocks nonowners before writing', async () => {
    tx.project.findFirst.mockResolvedValue(null);
    await expect(service.create('other', 'project', dto)).rejects.toThrow(NotFoundException);
    expect(tx.estimate.create).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
  });
  it('blocks archived projects', async () => {
    tx.project.findFirst.mockResolvedValue({ status: 'ARCHIVED' });
    await expect(service.create('owner', 'project', dto)).rejects.toThrow(BadRequestException);
  });
  const source = {
    id: 'old',
    projectName: 'Original project name',
    projectDescription: 'Original project description',
    version: 1,
    summary: dto.summary,
    hourlyRate: new Prisma.Decimal(50),
    currency: 'USD',
    suggestedStack: ['NestJS'],
    risks: [],
    items: [
      {
        ...dto.features[0],
        id: 'item',
        estimatedHours: new Prisma.Decimal(10),
        manuallyModified: false,
      },
    ],
  };
  it('copies manual edits to a new version and preserves the source', async () => {
    tx.estimate.findFirst.mockResolvedValue(source);
    const result = await service.editHours('owner', 'project', 'old', 'item', 12);
    expect(result.version).toBe(2);
    expect(result.projectName).toBe('Original project name');
    expect(result.projectDescription).toBe('Original project description');
    expect(dashboardCache.invalidate).toHaveBeenCalledWith('owner');
    expect(result.totalCost.toString()).toBe('600');
    expect(tx.estimate.create.mock.calls[0][0].data.items.create[0].manuallyModified).toBe(true);
    expect(source.items[0]?.estimatedHours.toString()).toBe('10');
    expect(result.suggestedStack).toEqual(['NestJS']);
  });
  it('rejects stale-version edits', async () => {
    tx.estimate.findFirst.mockResolvedValueOnce(source).mockResolvedValueOnce({ id: 'new' });
    await expect(service.editHours('owner', 'project', 'old', 'item', 12)).rejects.toThrow(
      BadRequestException,
    );
    expect(tx.estimate.create).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
  });
  it('rejects items outside the selected estimate', async () => {
    tx.estimate.findFirst.mockResolvedValue(source);
    await expect(service.editHours('owner', 'project', 'old', 'foreign', 12)).rejects.toThrow(
      NotFoundException,
    );
  });
  it('scopes detail lookup to the owner and project', async () => {
    await expect(service.get('other', 'project', 'foreign')).rejects.toThrow(NotFoundException);
    expect(tx.estimate.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'foreign', projectId: 'project', project: { userId: 'other' } },
      }),
    );
  });
});
describe('Estimate validation', () => {
  it('accepts a valid manual estimate', async () =>
    expect(await validate(plainToInstance(CreateEstimateDto, dto))).toHaveLength(0));
  it('rejects nested invalid features and client-computed costs', async () => {
    const input = plainToInstance(CreateEstimateDto, {
      ...dto,
      totalCost: 1,
      features: [{ ...dto.features[0], confidence: 2, estimatedHours: -10 }],
    });
    expect(
      (await validate(input, { whitelist: true, forbidNonWhitelisted: true })).length,
    ).toBeGreaterThan(0);
  });
  it('rejects nonfinite and excessive precision hours', async () => {
    for (const estimatedHours of [Infinity, NaN, 0, 1.001])
      expect(
        (await validate(plainToInstance(EditHoursDto, { estimatedHours }))).length,
      ).toBeGreaterThan(0);
  });
});
