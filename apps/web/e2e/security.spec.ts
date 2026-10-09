import { expect, test } from '@playwright/test';

const api = 'http://localhost:4100';

test('security headers, body limits and cookie-auth OpenAPI documentation', async ({
  request,
  page,
}) => {
  const health = await request.get(`${api}/health`);
  expect(health.headers()['x-content-type-options']).toBe('nosniff');
  expect(health.headers()['x-powered-by']).toBeUndefined();
  const preflight = await request.fetch(`${api}/projects`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:3100', 'Access-Control-Request-Method': 'POST' },
  });
  expect(preflight.headers()['access-control-allow-origin']).toBe('http://localhost:3100');
  expect(preflight.headers()['access-control-allow-credentials']).toBe('true');
  const foreignOrigin = await request.get(`${api}/health`, {
    headers: { Origin: 'https://example.invalid' },
  });
  expect(foreignOrigin.headers()['access-control-allow-origin']).not.toBe(
    'https://example.invalid',
  );
  const docs = await request.get(`${api}/api/docs-json`);
  const schema = await docs.json();
  expect(schema.components.securitySchemes.cookieAuth).toMatchObject({
    in: 'cookie',
    name: 'access_token',
  });
  for (const path of ['/auth/login', '/projects', '/dashboard/stats', '/estimates/{id}/export']) {
    expect(schema.paths[path]).toBeDefined();
  }
  const oversized = await request.post(`${api}/auth/login`, {
    data: { email: 'a'.repeat(2 * 1024 * 1024) },
  });
  expect(oversized.status()).toBe(413);
  await page.goto(`${api}/api/docs`);
  await expect(page.locator('.swagger-ui .info .title')).toContainText('AI Project Estimator API');
});

test('global throttle rejects excessive requests', async ({ request }) => {
  let limited = false;
  for (let index = 0; index < 105; index += 1) {
    const response = await request.get(`${api}/health`);
    if (response.status() === 429) {
      limited = true;
      expect(Number(response.headers()['retry-after'])).toBeGreaterThan(0);
      break;
    }
  }
  expect(limited).toBe(true);
});
