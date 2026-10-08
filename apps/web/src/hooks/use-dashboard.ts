'use client';
import { useQuery } from '@tanstack/react-query';
import { DashboardStatsSchema } from '@ape/types';
import { apiClient } from '../lib/api-client';
export function useDashboard(userId?: string) {
  return useQuery({
    queryKey: ['dashboard', userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      DashboardStatsSchema.parse(await apiClient.get<unknown>('/dashboard/stats')),
  });
}
