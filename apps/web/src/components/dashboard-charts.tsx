'use client';
import type { DashboardChartsProps } from '../types/dashboard-charts-props';
import { texts } from '../content/dashboard-charts';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PROJECT_STATUS_LABELS as labels } from '../constants/project-status';
import { CHART_COLORS as colors } from '../constants/dashboard';
export function DashboardCharts({ stats }: DashboardChartsProps) {
  const hours = stats.hoursByProject.map((project) => ({
    ...project,
    hours: Number(project.hours),
    label: project.name.length > 18 ? `${project.name.slice(0, 18)}…` : project.name,
  }));
  const statuses = stats.statusDistribution
    .filter((group) => group.count > 0)
    .map((group) => ({ name: labels[group.status], count: group.count }));
  return (
    <section aria-label={texts.dashboardCharts} className="grid min-w-0 gap-6 lg:grid-cols-2">
      <article className="min-w-0 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">{texts.estimatedHoursByProject}</h2>
        <p className="text-sm text-slate-500">{texts.tenLargestProjectsLatestEstimate}</p>
        {hours.length ? (
          <>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(_label, payload) => payload[0]?.payload.name ?? _label}
                  />
                  <Bar dataKey="hours" name="Hours" fill="#334155" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-sm">
              <summary>{texts.viewHoursData}</summary>
              <ul>
                {stats.hoursByProject.map((project) => (
                  <li key={project.projectId}>
                    {project.name}
                    {texts.symbol}
                    {project.hours} {texts.hours}
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <p className="py-12 text-sm text-slate-500">{texts.createAnEstimateToSeeProjectHours}</p>
        )}
      </article>
      <article className="min-w-0 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">{texts.projectStatus}</h2>
        {statuses.length ? (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statuses}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  isAnimationActive={false}
                >
                  {statuses.map((group, index) => (
                    <Cell key={group.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-sm text-slate-500">{texts.noProjectsYet}</p>
        )}
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {stats.statusDistribution.map((group) => (
            <li key={group.status}>
              {labels[group.status]}
              {texts.symbol}
              {group.count}
            </li>
          ))}
        </ul>
      </article>
      {stats.costOverTime.length ? (
        stats.costOverTime.map((series) => (
          <article key={series.currency} className="min-w-0 rounded-xl border bg-white p-4">
            <h2 className="font-semibold">
              {texts.estimatedCostOverTime}
              {series.currency}
            </h2>
            <p className="text-sm text-slate-500">
              {texts.latestEstimateCostsGroupedByCreationMonthUTC}
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series.points.map((point) => ({
                    ...point,
                    totalCost: Number(point.totalCost),
                  }))}
                  accessibilityLayer
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    dataKey="totalCost"
                    name={series.currency}
                    stroke="#0f766e"
                    type="linear"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-sm">
              <summary>{texts.viewCostData}</summary>
              <ul>
                {series.points.map((point) => (
                  <li key={point.month}>
                    {point.month}
                    {texts.symbol}
                    {series.currency} {point.totalCost}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))
      ) : (
        <article className="rounded-xl border bg-white p-4 lg:col-span-2">
          <h2 className="font-semibold">{texts.estimatedCostOverTime2}</h2>
          <p className="py-8 text-sm text-slate-500">{texts.createAnEstimateToSeeCostsByMonth}</p>
        </article>
      )}
    </section>
  );
}
