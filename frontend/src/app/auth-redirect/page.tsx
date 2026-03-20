'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { getRoleHomePath } from '@/lib/role-home-path';
import { useApolloClient } from '@apollo/client';
import { API_URL } from '@/config/env';

/**
 * Post-authentication redirect page
 * Redirects users to their dashboard based on their company membership
 */
export default function AuthRedirect() {
  const router = useRouter();
  const { user, isAuthenticated, loading, isLoaded, isSignedIn, error } = useAuth();
  const apolloClient = useApolloClient();
  const [backendDown, setBackendDown] = useState(false);
  const lastNavigationRef = useRef<string | null>(null);

  const safeReplace = (href: string) => {
    if (lastNavigationRef.current === href) return;
    lastNavigationRef.current = href;
    router.replace(href);
  };

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
      safeReplace('/auth/sign-in');
      return;
    }

    setBackendDown(false);

    // If there's a pending invite token, resume the invite flow instead of
    // going to onboarding — handles the Google OAuth path where the callback
    // always lands here regardless of where the user originally came from.
    const pendingInviteToken = localStorage.getItem('inviteToken');
    if (pendingInviteToken) {
      safeReplace(`/invite/accept?token=${pendingInviteToken}`);
      return;
    }

    const targetPath = getRoleHomePath(user);

    if (targetPath) {
      safeReplace(targetPath);
    } else {
      // No companies, redirect to onboarding
      safeReplace('/onboarding/create-company');
    }
  }, [isAuthenticated, user, loading, isLoaded, isSignedIn, error, router]);

  // If the user is signed in but the backend is in a cold start, keep a friendly
  // loading screen up and retry until the server responds.
  useEffect(() => {
    if (!backendDown) return;

    const controller = new AbortController();
    let disposed = false;
    let attempt = 0;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const waitForBackend = async () => {
      while (!disposed) {
        try {
          const res = await fetch(`${API_URL}/health`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          });

          if (res.ok) {
            // Backend is up — force Apollo to refetch `me` under the current token.
            await apolloClient.resetStore();
            setBackendDown(false);
            return;
          }
        } catch {
          // Ignore network errors during cold start.
        }

        attempt += 1;
        // Exponential backoff up to 8s (Render free tier can take ~30-60s to wake).
        const delayMs = Math.min(500 * 2 ** Math.min(attempt, 5), 8000);
        await sleep(delayMs);
      }
    };

    waitForBackend();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [backendDown, apolloClient]);

  if (backendDown) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center max-w-sm space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-neutral-900" />
          <h2 className="text-lg font-semibold text-neutral-900">Starting server…</h2>
          <p className="text-sm text-neutral-600">
            Establishing secure connection to the server... We&apos;ll continue automatically.
          </p>
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
