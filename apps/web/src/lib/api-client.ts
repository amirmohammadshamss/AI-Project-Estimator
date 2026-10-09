import { texts } from '../content/api-client';
import { publicEnvironment } from '../config/environment';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

let refreshRequest: Promise<boolean> | undefined;
async function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = fetch(`${publicEnvironment.apiUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = undefined;
      });
  }
  return refreshRequest;
}
async function fetchResponse(path: string, init?: RequestInit, retried = false): Promise<Response> {
  const res = await fetch(`${publicEnvironment.apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const canRefresh = !['/auth/login', '/auth/register', '/auth/refresh'].includes(path);
  if (res.status === 401 && canRefresh && !retried && (await refreshSession()))
    return fetchResponse(path, init, true);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? texts.requestFailed, res.status, body.code);
  }

  return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchResponse(path, init);
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  postPdf: async (path: string): Promise<Blob> => {
    const res = await fetchResponse(path, { method: 'POST' });
    if (!res.headers.get('content-type')?.includes('application/pdf'))
      throw new ApiError(texts.exportDidNotReturnAPdfPleaseTryAgain, 502);
    return res.blob();
  },
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
