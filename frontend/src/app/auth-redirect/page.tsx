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
  const { user, isAuthenticated, loading, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Wait for Supabase to hydrate first.
    if (!isLoaded) return;

    // Supabase says user is signed in Ã¢â‚¬â€ wait for the DB user to load before deciding.
    if (isSignedIn && loading) return;

    if (!isAuthenticated || !user) {
      // Not authenticated, send to sign-in
      router.replace('/auth/sign-in');
      return;
    }

    // If there's a pending invite token, resume the invite flow instead of
    // going to onboarding — handles the Google OAuth path where the callback
    // always lands here regardless of where the user originally came from.
    const pendingInviteToken = localStorage.getItem('inviteToken');
    if (pendingInviteToken) {
      router.replace(`/invite/accept?token=${pendingInviteToken}`);
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
  }, [isAuthenticated, user, loading, isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900" />
        <p className="mt-4 text-sm text-neutral-600">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}
