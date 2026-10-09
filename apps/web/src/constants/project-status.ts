import type { ProjectStatus } from '../types/projects';
export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ESTIMATED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  ESTIMATED: 'Estimated',
  ARCHIVED: 'Archived',
};
