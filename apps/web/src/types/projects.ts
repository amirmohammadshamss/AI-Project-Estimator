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
