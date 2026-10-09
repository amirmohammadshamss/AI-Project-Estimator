import { expect, test, Page } from '@playwright/test';
import type { DashboardStats } from '@ape/types';
const stats: DashboardStats = {
  totalProjects: 3,
  estimatedProjects: 2,
  totalEstimatedHours: '40',
  averageProjectSize: '20',
  averageConfidence: 0.8,
  statusDistribution: [
    { status: 'DRAFT', count: 1 },
    { status: 'ESTIMATED', count: 1 },
    { status: 'ARCHIVED', count: 1 },
  ],
  hoursByProject: [
    { projectId: 'p2', name: 'Subscription billing portal', hours: '30' },
    { projectId: 'p1', name: 'Food delivery platform', hours: '10' },
  ],
  costOverTime: [
    {
      currency: 'EUR',
      points: [
        { month: '2026-09', totalCost: '1200' },
        { month: '2026-10', totalCost: '1800' },
      ],
    },
    { currency: 'USD', points: [{ month: '2026-10', totalCost: '500' }] },
  ],
  recentProjects: [
    {
      id: 'p1',
      name: 'Food delivery platform',
      status: 'ESTIMATED',
      updatedAt: '2026-10-08T12:00:00Z',
      latestEstimate: { id: 'e1', version: 2, totalHours: '10', totalCost: '500', currency: 'USD' },
    },
    {
      id: 'p2',
      name: 'Subscription billing portal',
      status: 'ARCHIVED',
      updatedAt: '2026-10-07T12:00:00Z',
      latestEstimate: {
        id: 'e2',
        version: 1,
        totalHours: '30',
        totalCost: '1800',
        currency: 'EUR',
      },
    },
    {
      id: 'p3',
      name: 'New project',
      status: 'DRAFT',
      updatedAt: '2026-10-06T12:00:00Z',
      latestEstimate: null,
    },
  ],
};
async function mockApi(page: Page, failFirst = false) {
  await page
    .context()
    .addCookies([{ name: 'refresh_token', value: 'test-session', domain: 'localhost', path: '/' }]);
  let calls = 0;
  await page.route('http://localhost:4100/**', async (route) => {
    const headers = {
      'access-control-allow-origin': 'http://localhost:3100',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (route.request().url().endsWith('/auth/me'))
      return route.fulfill({
        headers,
        json: { id: 'test-user', email: 'test@example.com', name: 'Demo User' },
      });
    if (route.request().url().endsWith('/dashboard/stats')) {
      calls++;
      return route.fulfill({
        status: failFirst && calls === 1 ? 503 : 200,
        headers,
        json: failFirst && calls === 1 ? { message: 'Unavailable' } : stats,
      });
    }
    return route.fulfill({ headers, status: 404, json: {} });
  });
}
for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`dashboard charts and layout at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Recent projects' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Estimated cost over time · EUR' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Estimated cost over time · USD' }),
    ).toBeVisible();
    await expect(page.locator('.recharts-wrapper > svg.recharts-surface')).toHaveCount(4);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('link', { name: /v2 · 10 hours/ })).toHaveAttribute(
      'href',
      '/projects/p1/estimate/e1',
    );
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}.png`), fullPage: true });
  });
}
test('dashboard error can be retried', async ({ page }) => {
  await mockApi(page, true);
  await page.goto('/dashboard');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Could not load dashboard statistics');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Recent projects' })).toBeVisible();
});
