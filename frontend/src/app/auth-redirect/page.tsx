'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getRoleHomePath } from '@/lib/role-home-path';

/**
 * Post-authentication redirect page
 * Redirects users to their dashboard based on their company membership
 */
export default function AuthRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, loading, isLoaded, isSignedIn, error } = useAuth();
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    // Wait for Supabase to hydrate first.
    if (!isLoaded) return;

    // Supabase says user is signed in — wait for the DB user to load before deciding.
    if (isSignedIn && loading) return;

    if (!isAuthenticated || !user) {
      if (isSignedIn && error) {
        // Supabase session is valid but backend is unreachable — don't redirect
        // to sign-in or we'll get an infinite redirect loop.
        setBackendDown(true);
        return;
      }
      // Not authenticated, send to sign-in
      router.replace('/auth/sign-in');
      return;
    }

    setBackendDown(false);

    // If there's a pending invite token, resume the invite flow instead of
    // going to onboarding — handles the Google OAuth path where the callback
    // always lands here regardless of where the user originally came from.
    const pendingInviteToken = localStorage.getItem('inviteToken');
    if (pendingInviteToken) {
      router.replace(`/invite/accept?token=${pendingInviteToken}`);
      return;
    }

    const targetPath = getRoleHomePath(user);

    if (targetPath) {
      router.replace(targetPath);
    } else {
      // No companies, redirect to onboarding
      router.replace('/onboarding/create-company');
    }
  }, [isAuthenticated, user, loading, isLoaded, isSignedIn, error, router]);

  if (backendDown) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center max-w-sm space-y-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-neutral-900">Unable to reach server</h2>
          <p className="text-sm text-neutral-600">
            You&apos;re signed in but we couldn&apos;t connect to the server. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-900 text-white text-sm hover:bg-neutral-800 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900" />
        <p className="mt-4 text-sm text-neutral-600">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}
