import type { StatusBadgeProps } from '../types/status-badge-props';
import {
  PROJECT_STATUS_STYLES as STYLES,
  PROJECT_STATUS_LABELS as LABELS,
} from '../constants/project-status';

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
