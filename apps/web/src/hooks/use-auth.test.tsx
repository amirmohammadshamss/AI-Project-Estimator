import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLogin, useLogout } from './use-auth';
import { apiClient } from '../lib/api-client';
jest.mock('../lib/api-client', () => ({ apiClient: { post: jest.fn() } }));
beforeEach(() => jest.mocked(apiClient.post).mockResolvedValue({ success: true }));
function clientAndWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['projects'], [{ name: 'Private owner project' }]);
  client.setQueryData(['estimates', 'owner-project'], [{ summary: 'Private owner estimate' }]);
  client.setQueryData(['dashboard', 'old-owner'], { totalProjects: 1 });
  client.setQueryData(['auth', 'me'], { id: 'old-owner' });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper: Wrapper };
}
it('does not retain the old account identity or private cached results after login', async () => {
  const { client, wrapper } = clientAndWrapper();
  const { result } = renderHook(() => useLogin(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ email: 'next@example.com', password: 'password' });
  });
  expect(client.getQueryData(['auth', 'me'])).toBeNull();
  expect(client.getQueryData(['projects'])).toBeUndefined();
  expect(client.getQueryData(['estimates', 'owner-project'])).toBeUndefined();
  expect(client.getQueryData(['dashboard', 'old-owner'])).toBeUndefined();
  client.clear();
});
it('clears private query results after logout', async () => {
  const { client, wrapper } = clientAndWrapper();
  const { result } = renderHook(() => useLogout(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync();
  });
  expect(client.getQueryData(['auth', 'me'])).toBeNull();
  expect(client.getQueryData(['projects'])).toBeUndefined();
  client.clear();
});
