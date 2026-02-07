'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

/**
 * Client component that redirects authenticated users to their dashboard
 * Used after successful sign-in/sign-up
 */
export function AuthRedirector() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && user) {
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
    }
  }, [isAuthenticated, user, loading, router]);

  return null; // This component doesn't render anything
}
