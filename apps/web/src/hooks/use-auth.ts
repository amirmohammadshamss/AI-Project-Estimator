'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

const CURRENT_USER_KEY = ['auth', 'me'];

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: () => apiClient.get<CurrentUser>('/auth/me'),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiClient.post<{ success: boolean }>('/auth/login', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY }),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; name?: string }) =>
      apiClient.post<{ success: boolean }>('/auth/register', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ success: boolean }>('/auth/logout'),
    onSuccess: () => queryClient.setQueryData(CURRENT_USER_KEY, null),
  });
}
