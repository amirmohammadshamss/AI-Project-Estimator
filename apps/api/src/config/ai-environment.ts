import { ConfigService } from '@nestjs/config';
export const aiDefaults = {
  model: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  timeoutMs: 60000,
  minTimeoutMs: 1000,
  maxTimeoutMs: 120000,
  maxOutputTokens: 8192,
} as const;
export function aiEnvironment(config: ConfigService) {
  return {
    apiKey: config.get<string>('OPENAI_API_KEY'),
    baseUrl: config.get<string>('OPENAI_BASE_URL'),
    timeoutMs: Number(config.get<string>('OPENAI_TIMEOUT_MS') ?? aiDefaults.timeoutMs),
    model: config.get<string>('OPENAI_MODEL') ?? aiDefaults.model,
    embeddingModel: config.get<string>('OPENAI_EMBEDDING_MODEL') ?? aiDefaults.embeddingModel,
  };
}
