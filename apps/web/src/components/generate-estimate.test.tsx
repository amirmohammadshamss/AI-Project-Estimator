import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GenerateEstimate } from './generate-estimate';
const push = jest.fn();
const mutate = jest.fn();
let pending = false;
let error: Error | undefined;
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('../hooks/use-estimates', () => ({
  useGenerateEstimate: () => ({ mutate, isPending: pending, isError: Boolean(error), error }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  pending = false;
  error = undefined;
});
it('submits rate and currency and navigates to the generated estimate', async () => {
  mutate.mockImplementation((_input, options) => options.onSuccess({ id: 'e2' }));
  render(<GenerateEstimate projectId="p1" />);
  fireEvent.click(screen.getByRole('button', { name: 'Generate Estimate' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/projects/p1/estimate/e2'));
  expect(mutate.mock.calls[0][0]).toEqual({ hourlyRate: 50, currency: 'USD' });
});
it('prevents duplicate submission while generating', () => {
  pending = true;
  render(<GenerateEstimate projectId="p1" />);
  expect(
    (screen.getByRole('button', { name: 'Generating estimate…' }) as HTMLButtonElement).disabled,
  ).toBe(true);
});
it('shows accessible failure feedback', () => {
  error = new Error('Could not generate an estimate. Please try again later.');
  render(<GenerateEstimate projectId="p1" />);
  expect(screen.getByRole('alert').textContent).toContain(error.message);
});
it('blocks invalid rate before calling the API', async () => {
  render(<GenerateEstimate projectId="p1" />);
  fireEvent.change(screen.getByLabelText('Hourly rate'), { target: { value: '-1' } });
  fireEvent.submit(screen.getByRole('button').closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  expect(mutate).not.toHaveBeenCalled();
});
