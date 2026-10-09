import { messages } from '../content/estimates-estimate-reports.service';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import {
  EstimateExplanationInputSchema,
  EstimateRiskSchema,
  DetectedRisksSchema,
  EstimateExplanationSchema,
} from '@ape/types';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiGenerationError } from '../ai/ai.errors';
import { EstimatePdfService } from './estimate-pdf.service';
@Injectable()
export class EstimateReportsService {
  private readonly logger = new Logger(EstimateReportsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly pdf: EstimatePdfService,
  ) {}
  private async owned(userId: string, id: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, project: { userId } },
      include: {
        items: { orderBy: { position: 'asc' } },
        project: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!estimate) throw new NotFoundException(messages.estimateNotFound);
    return estimate;
  }
  async explain(userId: string, id: string) {
    const estimate = await this.owned(userId, id);
    try {
      const input = EstimateExplanationInputSchema.parse({
        summary: estimate.summary,
        features: estimate.items.map((item) => ({
          name: item.name,
          description: item.description,
          category: item.category,
          complexity: item.complexity,
          estimatedHours: Number(item.estimatedHours),
          confidence: item.confidence,
        })),
        suggestedStack: estimate.suggestedStack,
        risks: estimate.risks,
      });
      return EstimateExplanationSchema.parse({ explanation: await this.ai.explainEstimate(input) });
    } catch {
      this.logger.warn('Estimate explanation failed.');
      throw new AiGenerationError(messages.couldNotExplainThisEstimatePleaseTry);
    }
  }
  async risks(userId: string, id: string) {
    const estimate = await this.owned(userId, id);
    try {
      return DetectedRisksSchema.parse({
        risks: await this.ai.detectRisks(estimate.projectDescription),
      });
    } catch {
      this.logger.warn('Risk analysis failed.');
      throw new AiGenerationError(messages.couldNotAnalyzeRisksPleaseTryAgain);
    }
  }
  async export(userId: string, id: string) {
    const estimate = await this.owned(userId, id);
    let buffer: Buffer;
    try {
      buffer = await this.pdf.render(estimate, z.array(EstimateRiskSchema).parse(estimate.risks));
    } catch {
      this.logger.warn('Estimate PDF rendering failed.');
      throw new InternalServerErrorException({
        code: 'PDF_EXPORT_FAILED',
        message: messages.couldNotExportThisEstimatePleaseTry,
      });
    }
    // Recheck ownership before logging after potentially lengthy rendering.
    await this.prisma.$transaction(async (tx) => {
      if (
        !(await tx.estimate.findFirst({ where: { id, project: { userId } }, select: { id: true } }))
      )
        throw new NotFoundException(messages.estimateNotFound);
      await tx.activityLog.create({
        data: {
          userId,
          projectId: estimate.projectId,
          action: 'ESTIMATE_EXPORTED',
          metadata: { estimateId: id, version: estimate.version },
        },
      });
    });
    return {
      buffer,
      filename: `estimate-v${estimate.version}-${estimate.id.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`,
    };
  }
}
