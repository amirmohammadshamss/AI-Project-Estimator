import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';
const API = 'http://localhost:4100';

test('register, login, silently refresh, create, generate, edit, explain and export', async ({
  page,
  context,
  playwright,
}) => {
  const email = `acceptance-${Date.now()}-${Math.random()}@example.com`;
  const password = 'correct-horse-battery-staple';
  await page.goto('/register');
  await page.getByLabel('Name', { exact: true }).fill('Alex Client');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('heading', { name: 'Log in', exact: true })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('incorrect-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await context.clearCookies({ name: 'access_token' });
  await page.getByRole('link', { name: 'View projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect
    .poll(async () => (await context.cookies()).some((cookie) => cookie.name === 'access_token'))
    .toBe(true);
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByLabel('Project name').fill('Acceptance portal');
  await page
    .getByLabel('Project description')
    .fill('Build an authenticated portal with administrator and customer workflows.');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('link', { name: 'Acceptance portal' }).click();
  await expect(page.getByRole('heading', { name: 'Generate an AI estimate' })).toBeVisible();
  const projectId = new URL(page.url()).pathname.split('/')[2]!;
  await page.getByRole('button', { name: 'Generate Estimate', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Estimate · Version 1', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('USD 1600', { exact: true })).toBeVisible();
  await expect(page.getByText('NestJS', { exact: true })).toBeVisible();
  const hours = page.getByRole('spinbutton', { name: 'Hours for Authentication' });
  await hours.fill('18');
  await hours.locator('..').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Estimate · Version 2', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('USD 1900', { exact: true })).toBeVisible();
  await expect(page.getByText('Manually edited', { exact: true })).toBeVisible();
  const estimateId = new URL(page.url()).pathname.split('/')[4]!;
  const versions = await (
    await context.request.get(`${API}/projects/${projectId}/estimates`)
  ).json();
  expect(versions.map((version: { totalHours: string }) => version.totalHours)).toEqual([
    '38',
    '32',
  ]);
  await page.getByRole('button', { name: 'Explain estimate' }).click();
  await expect(
    page.getByText(
      'Secure identity and role permissions require validation and authorization testing.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Analyze risks' }).click();
  await expect(page.getByText('External provider reliability', { exact: true })).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('estimate-v2.pdf');
  expect((await readFile((await download.path())!)).subarray(0, 5).toString()).toBe('%PDF-');
  const activity = await (
    await context.request.get(`${API}/projects/${projectId}/activity`)
  ).json();
  expect(activity.some((entry: { action: string }) => entry.action === 'ESTIMATE_EXPORTED')).toBe(
    true,
  );
  const other = await playwright.request.newContext({ baseURL: API });
  try {
    expect(
      (
        await other.post('/auth/register', { data: { email: `other-${email}`, password } })
      ).status(),
    ).toBe(201);
    expect((await other.get(`/projects/${projectId}`)).status()).toBe(404);
    expect(
      (await other.post(`/projects/${projectId}/estimates`, { data: { hourlyRate: 50 } })).status(),
    ).toBe(404);
    for (const action of ['explain', 'risks', 'export'])
      expect((await other.post(`/estimates/${estimateId}/${action}`)).status()).toBe(404);
    expect(await (await other.get('/projects')).json()).toEqual([]);
    expect((await (await other.get('/dashboard/stats')).json()).totalProjects).toBe(0);
  } finally {
    await other.dispose();
  }
  expect((await context.request.patch(`${API}/projects/${projectId}/archive`)).status()).toBe(200);
  expect(
    (
      await context.request.post(`${API}/projects/${projectId}/estimates`, {
        data: { hourlyRate: 50 },
      })
    ).status(),
  ).toBe(400);
  expect((await context.request.post(`${API}/estimates/${estimateId}/export`)).status()).toBe(200);
  const stats = await (await context.request.get(`${API}/dashboard/stats`)).json();
  expect(stats.totalEstimatedHours).toBe('38');
  expect(stats.estimatedProjects).toBe(1);
});

test('malformed AI output returns a safe error and creates no version', async ({ playwright }) => {
  const request = await playwright.request.newContext({ baseURL: API });
  try {
    await request.post('/auth/register', {
      data: { email: `failure-${Date.now()}@example.com`, password: 'password-for-test' },
    });
    const project = await (
      await request.post('/projects', {
        data: { name: 'Failure case', description: 'E2E_FAILURE requires a malformed response.' },
      })
    ).json();
    const generated = await request.post(`/projects/${project.id}/estimates`, {
      data: { hourlyRate: 50 },
    });
    expect(generated.status()).toBe(503);
    expect(await generated.json()).toEqual({
      code: 'AI_GENERATION_FAILED',
      message: 'Could not generate an estimate. Please try again later.',
    });
    expect(await (await request.get(`/projects/${project.id}/estimates`)).json()).toEqual([]);
    expect(
      (
        await request.post('/projects', {
          data: { name: '', description: '', userId: 'someone-else' },
        })
      ).status(),
    ).toBe(400);
  } finally {
    await request.dispose();
  }
});

test('concurrent refresh accepts one token and logout revokes its replacement', async ({
  playwright,
}) => {
  const owner = await playwright.request.newContext({ baseURL: API });
  const first = await playwright.request.newContext({ baseURL: API });
  const second = await playwright.request.newContext({ baseURL: API });
  try {
    await owner.post('/auth/register', {
      data: { email: `rotation-${Date.now()}@example.com`, password: 'password-for-test' },
    });
    const previous = (await owner.storageState()).cookies.find(
      (cookie) => cookie.name === 'refresh_token',
    )!.value;
    const headers = { Cookie: `refresh_token=${previous}` };
    const results = await Promise.all([
      first.post('/auth/refresh', { headers }),
      second.post('/auth/refresh', { headers }),
    ]);
    expect(results.map((response) => response.status()).sort()).toEqual([201, 401]);
    const winner = results[0]!.status() === 201 ? first : second;
    const replacement = (await winner.storageState()).cookies.find(
      (cookie) => cookie.name === 'refresh_token',
    )!.value;
    expect(replacement).not.toBe(previous);
    expect((await first.post('/auth/refresh', { headers })).status()).toBe(401);
    expect((await owner.post('/auth/logout')).status()).toBe(200);
    expect(
      (await owner.storageState()).cookies.filter((cookie) =>
        ['access_token', 'refresh_token'].includes(cookie.name),
      ),
    ).toEqual([]);
    expect(
      (
        await second.post('/auth/refresh', { headers: { Cookie: `refresh_token=${replacement}` } })
      ).status(),
    ).toBe(401);
    expect((await owner.get('/projects')).status()).toBe(401);
  } finally {
    await Promise.all([owner.dispose(), first.dispose(), second.dispose()]);
  }
});
