import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { EstimatePdfService } from './estimate-pdf.service';
import { EstimateReportsService } from './estimate-reports.service';
import { reportFixture } from '../../test/fixtures/report';
describe('EstimateReportsService', () => {
  const prisma = {
    estimate: { findFirst: jest.fn() },
    activityLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const ai = { explainEstimate: jest.fn(), detectRisks: jest.fn() };
  const pdf = { render: jest.fn() };
  const service = new EstimateReportsService(
    prisma as unknown as PrismaService,
    ai as unknown as AiService,
    pdf as unknown as EstimatePdfService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.estimate.findFirst.mockResolvedValue(reportFixture());
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    pdf.render.mockResolvedValue(Buffer.from('%PDF-test'));
  });
  it('exports the saved snapshot, then logs its version without modifying estimates', async () => {
    const result = await service.export('owner', 'estimate-1');
    expect(result.filename).toBe('estimate-v2-estimate-1.pdf');
    expect(prisma.estimate.findFirst.mock.calls[0][0].where).toEqual({
      id: 'estimate-1',
      project: { userId: 'owner' },
    });
    expect(pdf.render.mock.calls[0][0].projectName).toBe('Delivery Operations Platform');
    expect(prisma.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'owner',
          action: 'ESTIMATE_EXPORTED',
          metadata: { estimateId: 'estimate-1', version: 2 },
        }),
      }),
    );
    expect(prisma.activityLog.create.mock.invocationCallOrder[0]).toBeGreaterThan(
      pdf.render.mock.invocationCallOrder[0]!,
    );
  });
  it.each(['export', 'explain', 'risks'] as const)(
    'blocks cross-user access for %s',
    async (method) => {
      prisma.estimate.findFirst.mockResolvedValue(null);
      await expect(service[method]('other', 'estimate-1')).rejects.toThrow(NotFoundException);
      expect(pdf.render).not.toHaveBeenCalled();
      expect(ai.explainEstimate).not.toHaveBeenCalled();
      expect(ai.detectRisks).not.toHaveBeenCalled();
    },
  );
  it('does not log failed PDF generation and hides renderer internals', async () => {
    pdf.render.mockRejectedValue(new Error('internal font path'));
    await expect(service.export('owner', 'estimate-1')).rejects.toMatchObject({
      response: {
        code: 'PDF_EXPORT_FAILED',
        message: 'Could not export this estimate. Please try again.',
      },
    });
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
  });
  it('rechecks ownership after rendering', async () => {
    prisma.estimate.findFirst.mockResolvedValueOnce(reportFixture()).mockResolvedValueOnce(null);
    await expect(service.export('owner', 'estimate-1')).rejects.toThrow(NotFoundException);
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
  });
  it('explains manual estimates with no recorded technology recommendations', async () => {
    const estimate = reportFixture();
    estimate.suggestedStack = [];
    prisma.estimate.findFirst.mockResolvedValue(estimate);
    ai.explainEstimate.mockResolvedValue('Payment integration increases implementation effort.');
    expect(await service.explain('owner', 'estimate-1')).toEqual({
      explanation: 'Payment integration increases implementation effort.',
    });
    expect(ai.explainEstimate.mock.calls[0][0].features[1].estimatedHours).toBe(40);
    expect(prisma.activityLog.create).not.toHaveBeenCalled();
  });
  it('analyzes snapshot requirements and validates new risk severity', async () => {
    ai.detectRisks.mockResolvedValue([
      { title: 'Scope', description: 'Uncertain requirements', severity: 'LOW' },
    ]);
    expect((await service.risks('owner', 'estimate-1')).risks).toHaveLength(1);
    expect(ai.detectRisks).toHaveBeenCalledWith(reportFixture().projectDescription);
    ai.detectRisks.mockResolvedValue([
      { title: 'Scope', description: 'Bad severity', severity: 'URGENT' },
    ]);
    await expect(service.risks('owner', 'estimate-1')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_GENERATION_FAILED' }),
    });
  });
  it('sanitizes explanation provider errors and rejects malformed text', async () => {
    ai.explainEstimate.mockResolvedValue('');
    await expect(service.explain('owner', 'estimate-1')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_GENERATION_FAILED' }),
    });
    ai.explainEstimate.mockRejectedValue(new Error('secret provider response'));
    await expect(service.explain('owner', 'estimate-1')).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'AI_GENERATION_FAILED' }),
    });
  });
});
