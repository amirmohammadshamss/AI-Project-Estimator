import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EmbeddingsService } from './embeddings.service';
@Module({ imports: [AiModule], providers: [EmbeddingsService], exports: [EmbeddingsService] })
export class EmbeddingsModule {}
