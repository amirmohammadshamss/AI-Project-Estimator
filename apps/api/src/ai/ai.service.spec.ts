import { BadRequestException, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiGenerationError, AiValidationError } from './ai.errors';

export const validEstimate = {
  summary: 'Build a portal',
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
  suggestedStack: ['NestJS'],
  risks: [{ title: 'Scope', description: 'Requirements may change', severity: 'MEDIUM' }],
};

describe('AiService', () => {
  const provider = { generateStructured: jest.fn(), generateEmbedding: jest.fn() };
  const service = new AiService(provider);
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());
  it('parses valid structured JSON and forwards description and RAG context', async () => {
    provider.generateStructured.mockResolvedValue(JSON.stringify(validEstimate));
    expect(await service.generateEstimate('Build a portal', ['Authentication'])).toEqual(
      validEstimate,
    );
    expect(JSON.parse(provider.generateStructured.mock.calls[0][0].input)).toEqual({
      description: 'Build a portal',
      retrievedFeatures: ['Authentication'],
    });
  });
  it.each([
    'invalid-json',
    {},
    { ...validEstimate, totalCost: 1 },
    { ...validEstimate, features: [] },
    { ...validEstimate, features: [{ ...validEstimate.features[0], confidence: 2 }] },
    { ...validEstimate, features: [{ ...validEstimate.features[0], estimatedHours: 1.001 }] },
    { ...validEstimate, summary: '   ' },
  ])('rejects malformed or unsafe output %#', async (raw) => {
    provider.generateStructured.mockResolvedValue(raw);
    await expect(service.generateEstimate('Build a portal')).rejects.toThrow(AiValidationError);
  });
  it.each(['', ' '.repeat(10), 'x'.repeat(5001)])(
    'rejects invalid descriptions without calling the provider',
    async (description) => {
      await expect(service.generateEstimate(description)).rejects.toThrow(BadRequestException);
      expect(provider.generateStructured).not.toHaveBeenCalled();
    },
  );
  it.each(['timeout', 'rate_limit', 'network'])('sanitizes provider failures: %s', async () => {
    provider.generateStructured.mockRejectedValue(new Error('sk-secret raw provider body'));
    await expect(service.generateEstimate('Build a portal')).rejects.toThrow(AiGenerationError);
    try {
      await service.generateEstimate('Build a portal');
    } catch (error) {
      expect((error as AiGenerationError).getResponse()).toEqual({
        code: 'AI_GENERATION_FAILED',
        message: 'Could not generate an estimate. Please try again later.',
      });
    }
    expect(JSON.stringify(jest.mocked(Logger.prototype.warn).mock.calls)).not.toContain(
      'sk-secret',
    );
  });
  it('validates embeddings and rejects nonfinite vectors', async () => {
    provider.generateEmbedding.mockResolvedValue([0.1, 0.2]);
    expect(await service.generateEmbedding('Login')).toEqual([0.1, 0.2]);
    provider.generateEmbedding.mockResolvedValue([Infinity]);
    await expect(service.generateEmbedding('Login')).rejects.toThrow(AiValidationError);
  });
  it('validates explanations and risk output', async () => {
    provider.generateStructured.mockResolvedValue({
      explanation: 'Login requires identity management.',
    });
    expect(
      await service.explainEstimate(validEstimate as Parameters<AiService['explainEstimate']>[0]),
    ).toContain('Login');
    provider.generateStructured.mockResolvedValue({ risks: validEstimate.risks });
    expect(await service.detectRisks('Build a portal')).toEqual(validEstimate.risks);
  });
});
