'use client';

/**
 * Previously wrapped the app with ClerkProvider.
 * Now a pass-through — Supabase Auth needs no global provider wrapper.
 * Kept to avoid changing providers.tsx structure.
 */
export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
