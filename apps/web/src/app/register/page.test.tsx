import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegisterPage from './page';
const mutate = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../hooks/use-auth', () => ({ useRegister: () => ({ mutate, isPending: false }) }));
beforeEach(() => mutate.mockClear());
it('blocks weak passwords and missing name before registration', async () => {
  render(<RegisterPage />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!);
  await waitFor(() =>
    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy(),
  );
  expect(screen.getByText('Name is required.')).toBeTruthy();
  expect(mutate).not.toHaveBeenCalled();
});
