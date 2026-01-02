'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from '@/context/theme-context';

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode } = useTheme();

  return <ClerkProvider appearance={darkMode ? { baseTheme: dark } : {}}>{children}</ClerkProvider>;
}
