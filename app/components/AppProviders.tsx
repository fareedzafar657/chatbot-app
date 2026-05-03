'use client';

import { useEffect } from 'react';
import '@/lib/amplify'; // configures Amplify on the client
import { useAuthStore } from '@/lib/authStore';
import { ErrorToast } from './ErrorToast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {children}
      <ErrorToast />
    </>
  );
}
