import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { AiValidationError } from '../ai/ai.errors';
import { EmbeddingsService, vectorLiteral, EMBEDDING_DIMENSIONS } from './embeddings.service';
const vector = [1, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)];
describe('EmbeddingsService', () => {
  it('validates dimensions, finite values and nonzero vectors', () => {
    expect(vectorLiteral(vector)).toMatch(/^\[1,0,/);
    for (const invalid of [[], [1, 2], Array(1536).fill(0), [Infinity, ...vector.slice(1)]])
      expect(() => vectorLiteral(invalid)).toThrow(AiValidationError);
  });
  it('delegates embedding generation through AiService', async () => {
    const ai = { generateEmbedding: jest.fn().mockResolvedValue(vector) };
    const service = new EmbeddingsService(
      ai as unknown as AiService,
      { get: () => undefined } as unknown as ConfigService,
    );
    expect(service.model).toBe('text-embedding-3-small');
    expect(await service.generate('Login')).toEqual(vector);
    expect(ai.generateEmbedding).toHaveBeenCalledWith('Login');
  });
});
