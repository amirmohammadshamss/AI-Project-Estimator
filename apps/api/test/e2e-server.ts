import 'reflect-metadata';
import { createServer } from 'http';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app-setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import { MemoryPrisma, MemoryRedis } from './fixtures/memory-store';

async function main() {
  process.env.JWT_SECRET = 'e2e-access-secret-only-for-test-fixtures';
  process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-only-for-test-fixtures';
  process.env.WEB_ORIGIN = 'http://localhost:3100';
  const aiServer = createServer(async (req, res) => {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || '{}');
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/embeddings') {
        res.end(
          JSON.stringify({
            object: 'list',
            data: [{ object: 'embedding', index: 0, embedding: [1, ...Array(1535).fill(0)] }],
            model: 'text-embedding-3-small',
            usage: { prompt_tokens: 1, total_tokens: 1 },
          }),
        );
        return;
      }
      if (req.url !== '/v1/responses') {
        res.writeHead(404);
        res.end('{}');
        return;
      }
      const input = JSON.parse(body.input);
      const schema = body.text.format.name;
      let value: unknown;
      if (schema === 'estimate_explanation')
        value = {
          explanation:
            'Secure identity and role permissions require validation and authorization testing.',
        };
      else if (schema === 'estimate_risks')
        value = {
          risks: [
            {
              title: 'External provider reliability',
              description: 'Allow for provider errors and operational monitoring.',
              severity: 'MEDIUM',
            },
          ],
        };
      else if (input.description.includes('E2E_FAILURE')) value = { malformed: true };
      else
        value = {
          summary: 'An authenticated portal with role-based workflows.',
          features: [
            {
              name: 'Authentication',
              description: 'Secure login and recovery.',
              category: 'Identity',
              complexity: 'MEDIUM',
              estimatedHours: 12,
              confidence: 0.85,
            },
            {
              name: 'Role Based Access',
              description: 'Authorize administrator and user workflows.',
              category: 'Identity',
              complexity: 'MEDIUM',
              estimatedHours: 20,
              confidence: 0.85,
            },
          ],
          suggestedStack: ['Next.js', 'NestJS', 'PostgreSQL'],
          risks: [
            {
              title: 'Authorization coverage',
              description: 'Test roles on every protected operation.',
              severity: 'HIGH',
            },
          ],
        };
      const text = JSON.stringify(value);
      res.end(
        JSON.stringify({
          id: 'fixture-response',
          object: 'response',
          status: 'completed',
          output_text: text,
          output: [
            {
              id: 'fixture-message',
              type: 'message',
              role: 'assistant',
              status: 'completed',
              content: [{ type: 'output_text', text, annotations: [] }],
            },
          ],
        }),
      );
    } catch {
      res.writeHead(400);
      res.end('{}');
    }
  });
  await new Promise<void>((resolve) => aiServer.listen(4101, '127.0.0.1', resolve));
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(new MemoryPrisma())
    .overrideProvider(REDIS_CLIENT)
    .useValue(new MemoryRedis())
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string) =>
        (
          ({
            OPENAI_API_KEY: 'fixture-key',
            OPENAI_BASE_URL: 'http://127.0.0.1:4101/v1',
            OPENAI_MODEL: 'fixture-model',
            OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
            OPENAI_TIMEOUT_MS: '60000',
          }) as Record<string, string>
        )[key],
    })
    .compile();
  const app = module.createNestApplication({ logger: ['warn', 'error'] });
  configureApp(app);
  await app.listen(4100, 'localhost');
  console.log('Fixture API ready on localhost:4100; OpenAI HTTP stub on loopback:4101.');
  const shutdown = async () => {
    aiServer.closeAllConnections();
    app.getHttpServer().closeAllConnections();
    await app.close();
    aiServer.close(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
