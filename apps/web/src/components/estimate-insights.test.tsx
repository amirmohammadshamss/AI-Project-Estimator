import { fireEvent, render, screen } from '@testing-library/react';
import { Estimate } from '../hooks/use-estimates';
import { EstimateInsights } from './estimate-insights';
const explain = {
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  data: undefined as { explanation: string } | undefined,
  error: new Error('Explanation unavailable'),
};
const analyze = {
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  data: undefined,
  error: new Error('Risk analysis unavailable'),
};
const exportPdf = {
  mutate: jest.fn(),
  isPending: false,
  isError: false,
  error: new Error('PDF unavailable'),
};
jest.mock('../hooks/use-estimates', () => ({
  useExplainEstimate: () => explain,
  useAnalyzeRisks: () => analyze,
  useExportEstimate: () => exportPdf,
}));
const estimate: Estimate = {
  id: 'e1',
  version: 2,
  summary: 'Portal',
  projectName: 'Saved portal',
  projectDescription: 'Saved requirements',
  createdAt: '2026-10-08T12:00:00Z',
  hourlyRate: '50',
  currency: 'USD',
  totalHours: '10',
  totalCost: '500',
  confidence: 0.8,
  items: [],
  suggestedStack: ['SvelteKit', 'PostgreSQL'],
  risks: [
    {
      title: 'Payment integration',
      description: 'Webhooks require reconciliation.',
      severity: 'HIGH',
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  explain.isPending = false;
  explain.isError = false;
  explain.data = undefined;
  exportPdf.isPending = false;
  exportPdf.isError = false;
});
it('renders recommendations and saved severity from the estimate', () => {
  render(<EstimateInsights projectId="p1" estimate={estimate} />);
  expect(screen.getByText('SvelteKit')).toBeTruthy();
  expect(screen.getByText('HIGH')).toBeTruthy();
  expect(screen.getByText('Webhooks require reconciliation.')).toBeTruthy();
  expect(screen.queryByText('Next.js')).toBeNull();
});
it('runs explanation, analysis and export actions', () => {
  render(<EstimateInsights projectId="p1" estimate={estimate} />);
  fireEvent.click(screen.getByRole('button', { name: 'Explain estimate' }));
  fireEvent.click(screen.getByRole('button', { name: 'Analyze risks' }));
  fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }));
  expect(explain.mutate).toHaveBeenCalledTimes(1);
  expect(analyze.mutate).toHaveBeenCalledTimes(1);
  expect(exportPdf.mutate).toHaveBeenCalledTimes(1);
});
it('disables duplicate actions and shows accessible errors', () => {
  explain.isPending = true;
  exportPdf.isPending = true;
  exportPdf.isError = true;
  render(<EstimateInsights projectId="p1" estimate={estimate} />);
  expect((screen.getByRole('button', { name: 'Explaining…' }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(
    (screen.getByRole('button', { name: 'Exporting PDF…' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(screen.getByRole('alert').textContent).toContain('PDF unavailable');
});
it('handles manual versions without recommendations or saved risks', () => {
  render(
    <EstimateInsights projectId="p1" estimate={{ ...estimate, suggestedStack: [], risks: [] }} />,
  );
  expect(screen.getByText('No technology recommendations recorded for this version.')).toBeTruthy();
  expect(screen.getByText('No risks recorded.')).toBeTruthy();
});
