'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { GET_CURRENT_USER } from '@/lib/graphql/auth';
import { SWITCH_COMPANY } from '@/lib/graphql/company';

interface CompanyGuardProps {
  children: React.ReactNode;
}

export default function CompanyGuard({ children }: CompanyGuardProps) {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, loading } = useAuth();
  const companySlug = params?.slug as string;

  const lastSwitchAttemptedForSlugRef = useRef<string | null>(null);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const [switchCompany] = useMutation(SWITCH_COMPANY, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });

  useEffect(() => {
    // Only check company membership if user is authenticated and loading is complete
    if (!loading && isAuthenticated) {
      // Check if user has any companies
      if (!user?.companies || user.companies.length === 0) {
        // Add a small delay to prevent immediate redirect loops
        const timer = setTimeout(() => {
          router.push('/onboarding');
        }, 100);
        return () => clearTimeout(timer);
      }

      // Validate that the company slug in the URL is valid and belongs to the user
      if (companySlug) {
        const isValidSlug = user.companies.some((c) => c.slug === companySlug);

        // If slug is invalid (e.g., "undefined" or doesn't belong to user), redirect to first company
        if (!isValidSlug) {
          const firstCompanySlug = user.companies[0]?.slug;
          if (firstCompanySlug) {
            // Extract the path after the slug to maintain navigation context
            const currentPath = window.location.pathname;
            const pathAfterSlug = currentPath.replace(`/${companySlug}`, '');

            // Redirect to the same path but with valid company slug (using replace to avoid history entry)
            router.replace(`/${firstCompanySlug}${pathAfterSlug || ''}`);
          }

          return;
        }

        // Ensure backend "active company" context matches the URL slug.
        // Many backend resolvers depend on user.activeCompanyId from Clerk metadata.
        const targetCompany = user.companies.find((c) => c.slug === companySlug);
        const targetCompanyId = targetCompany?.id;
        const needsSwitch = !!targetCompanyId && user.activeCompanyId !== targetCompanyId;

        if (needsSwitch && lastSwitchAttemptedForSlugRef.current !== companySlug) {
          lastSwitchAttemptedForSlugRef.current = companySlug;
          setIsSwitchingCompany(true);

          (async () => {
            try {
              const { data } = await switchCompany({
                variables: { companyId: targetCompanyId },
              });

              if (data?.switchCompany?.success) {
                router.refresh();
              }
            } catch (err) {
              console.error('[CompanyGuard] Failed to switch active company:', err);
              // Keep the user on the page; RBAC/other guards will handle access.
            } finally {
              setIsSwitchingCompany(false);
            }
          })();
        }
      }
    }
  }, [isAuthenticated, loading, router, user, companySlug, switchCompany]);

  if (loading || isSwitchingCompany) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If the URL slug points at a different company than the current backend context,
  // block rendering immediately (before effects run) to avoid firing queries with stale context.
  const targetCompanyId =
    companySlug && user?.companies
      ? user.companies.find((c) => c.slug === companySlug)?.id
      : undefined;

  const needsImmediateCompanySwitch =
    !!companySlug &&
    !!targetCompanyId &&
    isAuthenticated &&
    user?.activeCompanyId !== targetCompanyId &&
    lastSwitchAttemptedForSlugRef.current !== companySlug;

  if (needsImmediateCompanySwitch) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if authenticated and has at least one company
  const hasCompany = isAuthenticated && user?.companies && user.companies.length > 0;

  // Check if company slug is valid
  const isValidSlug = companySlug ? user?.companies?.some((c) => c.slug === companySlug) : true; // If no companySlug required, allow rendering

  // Show loading while redirecting for invalid slug
  if (hasCompany && companySlug && !isValidSlug) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return hasCompany ? <>{children}</> : null;
}
