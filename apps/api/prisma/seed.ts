import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';
import { ProjectsService } from '../src/projects/projects.service';
import { EstimatesService } from '../src/estimates/estimates.service';
import { EmbeddingsService } from '../src/embeddings/embeddings.service';
import { seedKnowledge } from '../src/embeddings/seed-knowledge';
import { seedDemo } from '../src/embeddings/seed-demo';
export async function runSeed(ai: boolean) {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const config = app.get(ConfigService);
    const email = config.get<string>('DEMO_EMAIL') ?? 'demo@example.com';
    const password = config.get<string>('DEMO_PASSWORD');
    const prisma = app.get(PrismaService);
    if (
      !(await prisma.user.findUnique({ where: { email } })) &&
      (!password || password.length < 12)
    )
      throw new Error('Set DEMO_PASSWORD to at least 12 characters for a new demo account.');
    if (ai) {
      if (!config.get<string>('OPENAI_API_KEY')?.trim())
        throw new Error('Set OPENAI_API_KEY for embedded knowledge and AI-generated demos.');
      await seedKnowledge(prisma, app.get(EmbeddingsService));
    }
    const count = await seedDemo(
      prisma,
      app.get(UsersService),
      app.get(ProjectsService),
      app.get(EstimatesService),
      { email, password, ai },
    );
    console.log(
      `Created ${count} demo estimates for the configured demo account. Existing estimates were retained.`,
    );
  } finally {
    await app.close();
  }
}
if (require.main === module)
  runSeed(true).catch(() => {
    console.error(
      'Seed failed. Check database/Redis, migrations, JWT secrets, DEMO_PASSWORD and OPENAI_API_KEY.',
    );
    process.exitCode = 1;
  });
