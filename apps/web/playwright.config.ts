import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3100',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        'node ../api/node_modules/ts-node/dist/bin.js --project ../api/tsconfig.json ../api/test/e2e-server.ts',
      url: 'http://localhost:4100/health',
      stdout: 'pipe',
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        NODE_ENV: 'test',
        OPENAI_API_KEY: '',
        JWT_SECRET: 'e2e-access-secret-only-for-test-fixtures',
        JWT_REFRESH_SECRET: 'e2e-refresh-secret-only-for-test-fixtures',
        DATABASE_URL: 'postgresql://fixture:fixture@localhost:1/fixture',
        REDIS_URL: 'redis://localhost:1',
        COOKIE_SECURE: 'false',
      },
    },
    {
      command: 'pnpm dev --port 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: 60000,
      env: { NODE_ENV: 'development', NEXT_PUBLIC_API_URL: 'http://localhost:4100' },
    },
  ],
});
