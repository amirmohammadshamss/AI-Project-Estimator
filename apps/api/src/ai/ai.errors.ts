import { ServiceUnavailableException } from '@nestjs/common';
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
  constructor(message = 'Could not generate an estimate. Please try again later.') {
    super({
      code: 'AI_GENERATION_FAILED',
      message,
    });
  }
}
