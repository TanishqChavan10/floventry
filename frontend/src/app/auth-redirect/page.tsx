'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

/**
 * Post-authentication redirect page
 * Redirects users to their dashboard based on their company membership
 */
export default function AuthRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, loading, isClerkLoaded, isClerkSignedIn } = useAuth();

  useEffect(() => {
    // Wait for Clerk to hydrate first.
    if (!isClerkLoaded) return;

    // Clerk says user is signed in — wait for the DB user to load before deciding.
    if (isClerkSignedIn && loading) return;

    if (!isAuthenticated || !user) {
      // Not authenticated, send to sign-in
      router.replace('/auth/sign-in');
      return;
    }

    // Find active company or first company
    const activeCompany = user.companies?.find((c) => c.isActive);
    const targetCompany = activeCompany || user.companies?.[0];

    if (targetCompany?.slug) {
      // Redirect to company dashboard
      router.replace(`/${targetCompany.slug}/dashboard`);
    } else {
      // No companies, redirect to onboarding
      router.replace('/onboarding/create-company');
    }
  }, [isAuthenticated, user, loading, isClerkLoaded, isClerkSignedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900" />
        <p className="mt-4 text-sm text-neutral-600">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}
