import { z } from 'zod';
export const AI_PROVIDER = Symbol('AI_PROVIDER');
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
