import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';
const estimate = {
  id: 'e1',
  version: 2,
  projectName: 'Saved delivery platform',
  projectDescription: 'Saved requirements for payments and dispatch.',
  summary: 'A delivery operations portal.',
  createdAt: '2026-10-08T12:00:00Z',
  hourlyRate: '100',
  currency: 'USD',
  totalHours: '24',
  totalCost: '2400',
  confidence: 0.85,
  suggestedStack: ['Next.js', 'NestJS', 'PostgreSQL'],
  risks: [
    {
      title: 'Payment reliability',
      description: 'Webhook retries need deduplication.',
      severity: 'HIGH',
    },
  ],
  items: [
    {
      id: 'item-1',
      name: 'Authentication',
      description: 'Secure login and recovery.',
      category: 'Identity',
      complexity: 'MEDIUM',
      estimatedHours: '24',
      estimatedCost: '2400',
      confidence: 0.85,
      manuallyModified: false,
    },
  ],
};
for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`estimate insights and download at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page
      .context()
      .addCookies([
        { name: 'refresh_token', value: 'test-session', domain: 'localhost', path: '/' },
      ]);
    await page.route('http://localhost:4100/**', async (route) => {
      const headers = {
        'access-control-allow-origin': 'http://localhost:3100',
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': 'content-type',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
      };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const url = route.request().url();
      if (url.endsWith('/auth/me'))
        return route.fulfill({ headers, json: { id: 'test-user', email: 'test@example.com' } });
      if (url.endsWith('/projects/p1'))
        return route.fulfill({
          headers,
          json: {
            id: 'p1',
            name: 'Changed project name',
            description: 'Changed requirements',
            status: 'ESTIMATED',
          },
        });
      if (url.endsWith('/projects/p1/estimates'))
        return route.fulfill({ headers, json: [estimate] });
      if (url.endsWith('/projects/p1/estimates/e1'))
        return route.fulfill({ headers, json: estimate });
      if (url.endsWith('/estimates/e1/explain'))
        return route.fulfill({
          headers,
          json: {
            explanation: 'Payment integrations and secure access increase implementation effort.',
          },
        });
      if (url.endsWith('/estimates/e1/risks'))
        return route.fulfill({
          headers,
          json: {
            risks: [
              {
                title: 'Provider outage',
                description: 'External services can be unavailable.',
                severity: 'MEDIUM',
              },
            ],
          },
        });
      if (url.endsWith('/estimates/e1/export'))
        return route.fulfill({
          headers,
          contentType: 'application/pdf',
          body: Buffer.from('%PDF-1.4\n% mocked download boundary\n%%EOF'),
        });
      return route.fulfill({ headers, status: 404, json: {} });
    });
    await page.goto('/projects/p1/estimate/e1');
    await expect(page.getByRole('heading', { name: 'Saved risks' })).toBeVisible();
    await expect(page.getByText('Saved requirements for payments and dispatch.')).toBeVisible();
    await page.getByRole('button', { name: 'Explain estimate' }).click();
    await expect(
      page.getByText('Payment integrations and secure access increase implementation effort.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Analyze risks' }).click();
    await expect(page.getByRole('heading', { name: 'Additional risk analysis' })).toBeVisible();
    await expect(page.getByText('Payment reliability', { exact: true })).toBeVisible();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PDF' }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('estimate-v2.pdf');
    const path = await download.path();
    expect((await readFile(path!)).subarray(0, 5).toString()).toBe('%PDF-');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`insights-${viewport.name}.png`),
      fullPage: true,
    });
  });
}
