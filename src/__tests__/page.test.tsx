import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { SignupForm } from "@/components/ui/SignUpForm";
import MockSessionProvider from '../mocks/MockSessionProvider';
import { redirect } from 'next/navigation';



jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
}));


jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  redirect: jest.fn(),
}));

describe('Page', () => {
  it('renders a heading', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });

    const setCustomLoadingState = jest.fn();

    render(<MockSessionProvider><SignupForm setCustomLoadingState={setCustomLoadingState} /></MockSessionProvider>);

    const message = await screen.findByText(/please contact the admin if you are signing up for the first time/i);
    expect(message).toBeInTheDocument();
  });
});