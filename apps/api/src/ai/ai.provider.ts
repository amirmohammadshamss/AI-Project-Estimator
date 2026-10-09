import { z } from 'zod';
export { AI_PROVIDER } from './ai.constants';
export interface StructuredRequest {
  name: string;
  schema: z.ZodTypeAny;
  instructions: string;
  input: string;
}
export interface AiProvider {
  generateStructured(request: StructuredRequest): Promise<unknown>;
  generateEmbedding(text: string): Promise<unknown>;
}
