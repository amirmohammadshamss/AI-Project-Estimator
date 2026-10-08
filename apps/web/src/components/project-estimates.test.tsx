import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProjectEstimates } from './project-estimates';

jest.mock('./generate-estimate', () => ({ GenerateEstimate: () => <div>AI generation</div> }));
const mutate = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../hooks/use-estimates', () => ({
  useEstimates: () => ({
    data: [{ id: 'e1', version: 1, totalHours: '10', totalCost: '500', currency: 'USD' }],
  }),
  useSaveEstimate: () => ({ mutate, isPending: false }),
}));
beforeEach(() => mutate.mockClear());
it('links to historical estimates and hides creation for archived projects', () => {
  render(<ProjectEstimates projectId="p1" archived />);
  expect(screen.getByRole('link').getAttribute('href')).toBe('/projects/p1/estimate/e1');
  expect(screen.queryByText('Create manual estimate')).toBeNull();
});
it('validates required feature fields before sending an estimate', async () => {
  render(<ProjectEstimates projectId="p1" archived={false} />);
  fireEvent.click(screen.getByText('Create manual estimate'));
  fireEvent.click(screen.getByRole('button', { name: 'Save estimate' }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  expect(mutate).not.toHaveBeenCalled();
});
it('submits features and hourly rate without client-computed totals', async () => {
  render(<ProjectEstimates projectId="p1" archived={false} />);
  fireEvent.click(screen.getByText('Create manual estimate'));
  fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'Portal' } });
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Login' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Sign in' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Auth' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save estimate' }));
  await waitFor(() => expect(mutate).toHaveBeenCalled());
  expect(mutate.mock.calls[0][0]).toEqual({
    summary: 'Portal',
    hourlyRate: 50,
    currency: 'USD',
    features: [
      {
        name: 'Login',
        description: 'Sign in',
        category: 'Auth',
        complexity: 'MEDIUM',
        estimatedHours: 1,
        confidence: 0.8,
      },
    ],
  });
});
