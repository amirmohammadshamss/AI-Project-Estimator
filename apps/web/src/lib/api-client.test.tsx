import { waitFor } from '@testing-library/react';
import { apiClient, ApiError } from './api-client';
const response = (status: number, body: unknown = {}, mime = 'application/json') =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    headers: { get: () => mime },
    blob: async () => new Blob(['PDF'], { type: mime }),
  }) as unknown as Response;
const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});
it('refreshes once for concurrent expired-access requests and retries them', async () => {
  let refreshed = false;
  let release!: () => void;
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith('/auth/refresh')) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      refreshed = true;
      return response(200);
    }
    return refreshed ? response(200, { success: true }) : response(401, { message: 'Expired' });
  });
  const calls = [apiClient.get('/projects'), apiClient.get('/dashboard/stats')];
  await waitFor(() => expect(release).toBeDefined());
  release();
  expect(await Promise.all(calls)).toEqual([{ success: true }, { success: true }]);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
});
it('does not loop when the retried request is still unauthorized', async () => {
  fetchMock.mockImplementation(async (url: string) =>
    response(url.endsWith('/auth/refresh') ? 200 : 401, { message: 'Unauthorized' }),
  );
  await expect(apiClient.get('/projects')).rejects.toBeInstanceOf(ApiError);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
it('preserves failure when refresh is revoked or unavailable', async () => {
  fetchMock.mockResolvedValue(response(401, { message: 'Expired session' }));
  await expect(apiClient.get('/auth/me')).rejects.toMatchObject({ statusCode: 401 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('does not refresh failed login or server errors', async () => {
  fetchMock.mockResolvedValue(response(401, { message: 'Invalid credentials' }));
  await expect(
    apiClient.post('/auth/login', { email: 'test@example.com', password: 'wrong' }),
  ).rejects.toMatchObject({ statusCode: 401 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fetchMock.mockResolvedValue(response(503, { message: 'Unavailable' }));
  await expect(apiClient.get('/projects')).rejects.toMatchObject({ statusCode: 503 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('rejects non-PDF export responses', async () => {
  fetchMock.mockResolvedValue(response(200, {}, 'text/html'));
  await expect(apiClient.postPdf('/estimates/e1/export')).rejects.toMatchObject({
    statusCode: 502,
  });
});
