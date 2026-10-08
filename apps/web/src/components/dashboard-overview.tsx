'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DashboardStats } from '@ape/types';
import { StatusBadge } from './status-badge';
const DashboardCharts = dynamic(
  () => import('./dashboard-charts').then((module) => module.DashboardCharts),
  { ssr: false, loading: () => <p>Loading charts…</p> },
);
export function DashboardOverview({ stats }: { stats: DashboardStats }) {
  const metrics = [
    ['Total projects', stats.totalProjects],
    ['Estimated projects', stats.estimatedProjects],
    ['Total estimated hours', stats.totalEstimatedHours],
    ['Average project size (hours)', stats.averageProjectSize],
    [
      'Average confidence',
      stats.averageConfidence === null ? '—' : `${Math.round(stats.averageConfidence * 100)}%`,
    ],
  ];
  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-slate-500">
        All projects, including archived projects. Each project contributes its latest estimate.
        Average size includes estimated projects only; currencies are shown separately.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white p-4 shadow-sm">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <DashboardCharts stats={stats} />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Recent projects</h2>
        {stats.recentProjects.length ? (
          <ul className="mt-3 divide-y">
            {stats.recentProjects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    className="break-words font-medium underline"
                    href={`/projects/${project.id}`}
                  >
                    {project.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={project.status} />
                  {project.latestEstimate ? (
                    <Link
                      className="text-sm underline"
                      href={`/projects/${project.id}/estimate/${project.latestEstimate.id}`}
                    >
                      v{project.latestEstimate.version} · {project.latestEstimate.totalHours} hours
                      · {project.latestEstimate.currency} {project.latestEstimate.totalCost}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500">No estimate</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm text-slate-500">
            No projects yet.{' '}
            <Link href="/projects" className="underline">
              Create your first project
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
