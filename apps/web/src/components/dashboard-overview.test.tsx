import { render, screen } from '@testing-library/react';
import { DashboardStats } from '@ape/types';
import { DashboardOverview } from './dashboard-overview';
jest.mock(
  'next/dynamic',
  () => () =>
    function MockCharts() {
      return <div>Charts</div>;
    },
);
const empty: DashboardStats = {
  totalProjects: 0,
  estimatedProjects: 0,
  totalEstimatedHours: '0',
  averageProjectSize: '0',
  averageConfidence: null,
  statusDistribution: [],
  hoursByProject: [],
  costOverTime: [],
  recentProjects: [],
};
it('shows an empty state and no fabricated confidence', () => {
  render(<DashboardOverview stats={empty} />);
  expect(screen.getByText('—')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Create your first project' }).getAttribute('href')).toBe(
    '/projects',
  );
});
it('links to the latest estimate and preserves displayed currency', () => {
  render(
    <DashboardOverview
      stats={{
        ...empty,
        averageConfidence: 0.8,
        recentProjects: [
          {
            id: 'p1',
            name: 'Portal',
            status: 'ESTIMATED',
            updatedAt: '2026-10-08T12:00:00Z',
            latestEstimate: {
              id: 'e1',
              version: 2,
              totalHours: '10',
              totalCost: '500',
              currency: 'EUR',
            },
          },
        ],
      }}
    />,
  );
  expect(screen.getByText('80%')).toBeTruthy();
  expect(screen.getByRole('link', { name: /v2 · 10 hours · EUR 500/ }).getAttribute('href')).toBe(
    '/projects/p1/estimate/e1',
  );
});
