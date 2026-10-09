import { z } from 'zod';
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//),
    REDIS_URL: z.string().regex(/^rediss?:\/\//),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  })
  .passthrough()
  .refine((env) => env.JWT_SECRET !== env.JWT_REFRESH_SECRET, {
    path: ['JWT_REFRESH_SECRET'],
    message: 'Use distinct secrets',
  });
export function validateEnvironment(env: Record<string, unknown>) {
  const parsed = schema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `Invalid API environment: ${[...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))].join(', ')}. See .env.example.`,
    );
  return parsed.data;
}
