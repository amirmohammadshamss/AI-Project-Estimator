import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './page';
const mutate = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../hooks/use-auth', () => ({ useLogin: () => ({ mutate, isPending: false }) }));
beforeEach(() => mutate.mockClear());
it('validates email and password before calling the login API', async () => {
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Log in' }).closest('form')!);
  await waitFor(() => expect(screen.getByText('Enter a valid email address.')).toBeTruthy());
  expect(screen.getByText('Password is required.')).toBeTruthy();
  expect(mutate).not.toHaveBeenCalled();
});
