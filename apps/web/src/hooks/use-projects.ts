'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

import type { Project, ActivityLogEntry } from '../types/projects';
export type { Project, ProjectStatus, ActivityLogEntry } from '../types/projects';

import { PROJECTS_KEY, projectKey, projectActivityKey } from '../constants/query-keys';

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKey(id),
    queryFn: () => apiClient.get<Project>(`/projects/${id}`),
    enabled: Boolean(id),
  });
}

export function useProjectActivity(id: string) {
  return useQuery({
    queryKey: projectActivityKey(id),
    queryFn: () => apiClient.get<ActivityLogEntry[]>(`/projects/${id}/activity`),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description: string }) =>
      apiClient.post<Project>('/projects', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; description?: string }) =>
      apiClient.patch<Project>(`/projects/${id}`, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKey(id), project);
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: projectActivityKey(id) });
    },
  });
}

export function useArchiveProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch<Project>(`/projects/${id}/archive`),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKey(id), project);
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: projectActivityKey(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
