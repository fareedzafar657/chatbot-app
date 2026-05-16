'use client';

import { useEffect } from 'react';
import '@/lib/amplify'; // configures Amplify on the client
import { useAuthStore } from '@/lib/authStore';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { ErrorToast } from './ErrorToast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession().catch(() => {}); // non-critical: app renders unauthenticated if restoration fails
  }, [restoreSession]);

  return (
    <ThemeProvider>
      {children}
      <ErrorToast />
    </ThemeProvider>
  );
}
