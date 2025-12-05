'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Define onboarding routes
  const onboardingRoutes = ['/onboarding', '/invite'];
  const isOnboardingRoute = onboardingRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (loading) return; // Still loading, don't redirect yet

    if (!isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
      // User is not authenticated and trying to access protected route
      router.push('/auth/sign-in');
      return;
    }

    if (isAuthenticated && user) {
      // User is authenticated, check company status
      const hasCompanies = user.companies && user.companies.length > 0;
      const hasMultipleCompanies = user.companies && user.companies.length > 1;
      const hasActiveCompany = user.activeCompanyId;

      if (!hasCompanies && !isOnboardingRoute && !isPublicRoute) {
        // User has no companies and is not on onboarding pages
        router.push('/onboarding');
        return;
      }

      if (
        hasCompanies &&
        !hasActiveCompany &&
        hasMultipleCompanies &&
        !pathname.startsWith('/company-switcher')
      ) {
        // User has multiple companies but no active company selected
        router.push('/company-switcher');
        return;
      }

      if (hasCompanies && isOnboardingRoute) {
        // User has companies but is on onboarding pages, redirect appropriately
        if (hasMultipleCompanies && !hasActiveCompany) {
          router.push('/company-switcher');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // User has companies and appropriate active company - allow access
    }
  }, [isAuthenticated, user, loading, pathname, router, isPublicRoute, isOnboardingRoute]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access protected route, don't render children
  if (!isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
    return null;
  }

  // Render children for all other cases
  return <>{children}</>;
}
