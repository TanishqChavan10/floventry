'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Clerk posts back here after every OAuth/SSO flow.
 * Providing signUpUrl / signInUrl prevents Clerk from falling back to
 * the hosted *.accounts.dev pages when it needs to redirect a new user.
 */
export default function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      signUpForceRedirectUrl="/auth-redirect"
      signInForceRedirectUrl="/auth-redirect"
    />
  );
}
