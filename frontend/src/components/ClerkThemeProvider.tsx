'use client';

import { ClerkProvider } from '@clerk/nextjs';

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/auth/sign-in';
  const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/auth/sign-up';
  const afterSignInUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/auth-redirect';
  const afterSignUpUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/auth-redirect';

  return (
    <ClerkProvider
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      afterSignInUrl={afterSignInUrl}
      afterSignUpUrl={afterSignUpUrl}
    >
      {children}
    </ClerkProvider>
  );
}
