'use client';
import type { ProjectActivityProps } from '../types/project-activity-props';
import { texts } from '../content/project-activity';
import { useProjectActivity } from '../hooks/use-projects';
import { describeActivity } from '../lib/activity-labels';

export function ProjectActivity({ projectId }: ProjectActivityProps) {
  const { data: activity } = useProjectActivity(projectId);
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{texts.activity}</h2>
      {!activity && <p className="mt-2 text-sm text-slate-500">{texts.loadingActivity}</p>}
      {activity && activity.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">{texts.noActivityRecordedYet}</p>
      )}
      {activity && activity.length > 0 && (
        <ol className="mt-3 space-y-2 border-l border-slate-200 pl-4">
          {activity.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
              <p className="text-sm font-medium text-slate-900">{describeActivity(entry.action)}</p>
              <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
