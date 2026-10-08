'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface EstimateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  estimatedHours: string;
  estimatedCost: string;
  confidence: number;
  manuallyModified: boolean;
}
export interface Estimate {
  id: string;
  version: number;
  summary: string;
  hourlyRate: string;
  currency: string;
  totalHours: string;
  totalCost: string;
  confidence: number;
  items: EstimateItem[];
}
export interface ManualEstimate {
  summary: string;
  hourlyRate: number;
  currency: string;
  features: {
    name: string;
    description: string;
    category: string;
    complexity: string;
    estimatedHours: number;
    confidence: number;
  }[];
}
export function useEstimates(projectId: string) {
  return useQuery({
    queryKey: ['estimates', projectId],
    queryFn: () => apiClient.get<Estimate[]>(`/projects/${projectId}/estimates`),
  });
}
export function useEstimate(projectId: string, id: string) {
  return useQuery({
    queryKey: ['estimates', projectId, id],
    queryFn: () => apiClient.get<Estimate>(`/projects/${projectId}/estimates/${id}`),
  });
}
export function useSaveEstimate(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualEstimate) =>
      apiClient.post<Estimate>(`/projects/${projectId}/estimates/manual`, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['estimates', projectId] });
      client.invalidateQueries({ queryKey: ['projects'] });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useEditHours(projectId: string, estimateId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; estimatedHours: number }) =>
      apiClient.patch<Estimate>(
        `/projects/${projectId}/estimates/${estimateId}/items/${input.itemId}`,
        { estimatedHours: input.estimatedHours },
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['estimates', projectId] });
      client.invalidateQueries({ queryKey: ['projects'] });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useGenerateEstimate(projectId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { hourlyRate: number; currency: string }) =>
      apiClient.post<Estimate>(`/projects/${projectId}/estimates`, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['estimates', projectId] });
      client.invalidateQueries({ queryKey: ['projects'] });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
