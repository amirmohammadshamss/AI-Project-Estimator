import { environmentSchema } from './config/environment-schema';
export function validateEnvironment(env: Record<string, unknown>) {
  const parsed = environmentSchema.safeParse(env);
  if (!parsed.success)
    throw new Error(
      `Invalid API environment: ${[...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))].join(', ')}. See .env.example.`,
    );
  return parsed.data;
}
