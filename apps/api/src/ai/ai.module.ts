import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai.provider';
import { AiService } from './ai.service';
import { OpenAiProvider } from './openai.provider';
@Module({
  providers: [AiService, { provide: AI_PROVIDER, useClass: OpenAiProvider }],
  exports: [AiService],
})
export class AiModule {}
