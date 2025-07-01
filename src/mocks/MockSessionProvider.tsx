import { SessionProvider } from 'next-auth/react';
import React from 'react';

const MockSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const session = {
    user: { name: 'Test User', email: 'test@example.com' },
    expires: '2024-01-01T00:00:00.000Z',
  };
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default MockSessionProvider;