'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy SSO callback page.
 * Supabase OAuth now uses /auth/callback route handler instead.
 * Redirect any stale bookmarks/links there.
 */
export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Forward to auth callback with any query params
    const params = new URLSearchParams(window.location.search);
    router.replace(`/auth/callback?${params.toString()}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Completing authentication...</p>
    </div>
  );
}
