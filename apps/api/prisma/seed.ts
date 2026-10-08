import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmbeddingsModule } from '../src/embeddings/embeddings.module';
import { EmbeddingsService } from '../src/embeddings/embeddings.service';
import { seedKnowledge } from '../src/embeddings/seed-knowledge';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, EmbeddingsModule] })
class SeedModule {}
async function main() {
  const app = await NestFactory.createApplicationContext(SeedModule, { logger: false });
  try {
    const count = await seedKnowledge(app.get(PrismaService), app.get(EmbeddingsService));
    console.log(
      `Seeded ${count} knowledge-base features. Search caches expire within five minutes.`,
    );
  } finally {
    await app.close();
  }
}
main().catch(() => {
  console.error('Knowledge seed failed. Check database migrations and backend AI configuration.');
  process.exitCode = 1;
});
