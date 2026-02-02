'use client';

import { ClerkProvider } from '@clerk/nextjs';

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
