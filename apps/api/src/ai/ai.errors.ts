import { messages } from '../content/ai-ai.errors';
import { ServiceUnavailableException } from '@nestjs/common';
export class AiNotConfiguredError extends ServiceUnavailableException {
  constructor() {
    super({
      code: 'AI_NOT_CONFIGURED',
      message: messages.aiIsNotConfiguredYetYouCan,
    });
  }
}
export class AiValidationError extends Error {
  constructor() {
    super('AI output failed validation.');
    this.name = 'AiValidationError';
  }
}
export class AiProviderError extends Error {
  constructor(public readonly reason: string) {
    super('AI provider request failed.');
    this.name = 'AiProviderError';
  }
}
export class AiGenerationError extends ServiceUnavailableException {
  constructor(message: string = messages.couldNotGenerateAnEstimatePleaseTry) {
    super({
      code: 'AI_GENERATION_FAILED',
      message,
    });
  }
}
