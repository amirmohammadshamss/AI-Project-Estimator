import type { ProjectStatus } from '../hooks/use-projects';

const STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  ESTIMATED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

const LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  ESTIMATED: 'Estimated',
  ARCHIVED: 'Archived',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
