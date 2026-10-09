'use client';
import type { DashboardOverviewProps } from '../types/dashboard-overview-props';
import { texts } from '../content/dashboard-overview';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { StatusBadge } from './status-badge';
const DashboardCharts = dynamic(
  () => import('./dashboard-charts').then((module) => module.DashboardCharts),
  { ssr: false, loading: () => <p>{texts.loadingCharts}</p> },
);
export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const metrics = [
    [texts.totalProjects, stats.totalProjects],
    [texts.estimatedProjects, stats.estimatedProjects],
    [texts.totalEstimatedHours, stats.totalEstimatedHours],
    [texts.averageProjectSizeHours, stats.averageProjectSize],
    [
      texts.averageConfidence,
      stats.averageConfidence === null ? '—' : `${Math.round(stats.averageConfidence * 100)}%`,
    ],
  ];
  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-slate-500">
        {texts.allProjectsIncludingArchivedProjectsEachProjectContributes}
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
        <h2 className="text-lg font-semibold">{texts.recentProjects}</h2>
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
                    {texts.updated}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={project.status} />
                  {project.latestEstimate ? (
                    <Link
                      className="text-sm underline"
                      href={`/projects/${project.id}/estimate/${project.latestEstimate.id}`}
                    >
                      {texts.v}
                      {project.latestEstimate.version} {texts.symbol}
                      {project.latestEstimate.totalHours} {texts.hours}
                      {project.latestEstimate.currency} {project.latestEstimate.totalCost}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500">{texts.noEstimate}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm text-slate-500">
            {texts.noProjectsYet}{' '}
            <Link href="/projects" className="underline">
              {texts.createYourFirstProject}
            </Link>
            {texts.symbol2}
          </p>
        )}
      </section>
    </div>
  );
}
