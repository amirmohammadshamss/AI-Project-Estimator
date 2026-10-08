'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export type ProjectStatus = 'DRAFT' | 'ESTIMATED' | 'ARCHIVED';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  projectId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const PROJECTS_KEY = ['projects'];
const projectKey = (id: string) => ['projects', id];
const projectActivityKey = (id: string) => ['projects', id, 'activity'];

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
