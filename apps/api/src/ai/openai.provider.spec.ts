import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { EstimateResultSchema } from '@ape/types';
import { OpenAiProvider } from './openai.provider';
import { AiProviderError } from './ai.errors';
const create = jest.fn();
const embed = jest.fn();
jest.mock('openai', () => ({ __esModule: true, default: jest.fn() }));
describe('OpenAiProvider', () => {
  const config = {
    get: jest.fn((key: string) => (key === 'OPENAI_API_KEY' ? 'test-key' : undefined)),
  };
  const request = {
    name: 'estimate_result',
    schema: EstimateResultSchema,
    instructions: 'Estimate work',
    input: 'Portal',
  };
  beforeEach(() => {
    create.mockReset();
    embed.mockReset();
    jest
      .mocked(OpenAI)
      .mockImplementation(
        () => ({ responses: { create }, embeddings: { create: embed } }) as unknown as OpenAI,
      );
  });
  it('sends strict schema, disables storage and applies timeout without retries', async () => {
    create.mockResolvedValue({ status: 'completed', output: [], output_text: '{}' });
    const provider = new OpenAiProvider(config as unknown as ConfigService);
    expect(await provider.generateStructured(request)).toBe('{}');
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-key', timeout: 60000, maxRetries: 0 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        store: false,
        text: { format: expect.objectContaining({ type: 'json_schema', strict: true }) },
      }),
    );
  });
  it.each([
    { status: 'incomplete', output: [] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] },
  ])('rejects incomplete and refused responses', async (response) => {
    create.mockResolvedValue(response);
    await expect(
      new OpenAiProvider(config as unknown as ConfigService).generateStructured(request),
    ).rejects.toThrow(AiProviderError);
  });
  it('does not require an API key until generation and fails safely when absent', async () => {
    const provider = new OpenAiProvider({ get: () => undefined } as unknown as ConfigService);
    await expect(provider.generateStructured(request)).rejects.toThrow(AiProviderError);
  });
  it('forwards embeddings through the same SDK adapter', async () => {
    embed.mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
    expect(
      await new OpenAiProvider(config as unknown as ConfigService).generateEmbedding('Login'),
    ).toEqual([0.1, 0.2]);
    expect(embed).toHaveBeenCalledWith(expect.objectContaining({ dimensions: 1536 }));
  });
});
