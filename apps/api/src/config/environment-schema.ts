import { environmentDefaults } from './runtime-environment';
import { messages } from '../content/config-environment-schema';
import { z } from 'zod';
export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//),
    REDIS_URL: z.string().regex(/^rediss?:\/\//),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    WEB_ORIGIN: z.string().url().default(environmentDefaults.webOrigin),
    PORT: z.coerce.number().int().min(1).max(65535).default(environmentDefaults.apiPort),
  })
  .passthrough()
  .refine((env) => env.JWT_SECRET !== env.JWT_REFRESH_SECRET, {
    path: ['JWT_REFRESH_SECRET'],
    message: messages.useDistinctSecrets,
  });
