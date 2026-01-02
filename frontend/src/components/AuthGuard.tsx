'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { SWITCH_COMPANY, GET_CURRENT_USER } from '@/lib/graphql/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const autoSwitchCompanyAttemptedRef = useRef(false);
  const [switchCompany] = useMutation(SWITCH_COMPANY, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });

  // Define public routes that don't require authentication
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth/sign-in', '/auth/sign-up', '/auth'];
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
      const hasActiveCompany = user.activeCompanyId;

      // If user has companies but no active company selected, persist selection server-side
      // so the backend context matches the URL (prevents "Active company required" errors).
      if (
        hasCompanies &&
        !hasActiveCompany &&
        !isOnboardingRoute &&
        !autoSwitchCompanyAttemptedRef.current
      ) {
        const firstCompany = user.companies?.[0];
        if (firstCompany?.id) {
          autoSwitchCompanyAttemptedRef.current = true;
          (async () => {
            try {
              const { data } = await switchCompany({
                variables: { companyId: firstCompany.id },
              });
              if (data?.switchCompany?.success) {
                router.refresh();
              }
            } catch (err: any) {
              console.error('[AuthGuard] Failed to auto-switch company:', err);
              toast.error('Failed to select company');
            }
          })();
        }
        return;
      }

      // Edge case: after we attempt to auto-select a company (or while metadata/user data is still syncing),
      // avoid redirecting based on warehouses/company until activeCompanyId is present.
      // Otherwise managers/staff can be sent to a warehouse route using stale/mixed warehouse lists.
      if (hasCompanies && !hasActiveCompany && !isOnboardingRoute) {
        return;
      }

      if (!hasCompanies && !isOnboardingRoute && !isPublicRoute) {
        // User has no companies and is not on onboarding pages
        router.push('/onboarding');
        return;
      }

      if (hasCompanies && isOnboardingRoute && !pathname.startsWith('/onboarding/create-company')) {
        // User has companies but is on onboarding pages, redirect appropriately
        // Find the active company or default to the first one
        const activeCompanyFromId = user.activeCompanyId
          ? user?.companies?.find((c) => c.id === user.activeCompanyId)
          : undefined;
        const activeSlug =
          activeCompanyFromId?.slug ||
          user?.companies?.find((c) => c.isActive)?.slug ||
          user?.companies?.[0]?.slug;
        if (activeSlug) {
          router.push(`/${activeSlug}`);
        }
        return;
      }

      // User has companies and appropriate active company - allow access

      // Redirect authenticated users away from auth pages and root route
      if (
        pathname.startsWith('/auth/') ||
        pathname === '/auth/sign-in' ||
        pathname === '/dashboard' ||
        pathname === '/'
      ) {
        console.log('[AuthGuard] Redirecting from auth/root page, pathname:', pathname);

        // First check if user has companies
        if (!hasCompanies) {
          // No companies - redirect to onboarding
          console.log('[AuthGuard] No companies, redirecting to onboarding');
          router.push('/onboarding');
          return;
        }

        // Has companies - check user role and redirect accordingly
        const activeCompany =
          (user.activeCompanyId
            ? user?.companies?.find((c) => c.id === user.activeCompanyId)
            : undefined) ||
          user?.companies?.find((c) => c.isActive) ||
          user?.companies?.[0];
        const activeSlug = activeCompany?.slug;
        const userRole = activeCompany?.role;

        console.log('[AuthGuard] User role:', userRole);
        console.log('[AuthGuard] Active slug:', activeSlug);

        if (!activeSlug) return;

        /**
         * 🎯 ROLE-BASED REDIRECT LOGIC
         *
         * OWNER & ADMIN → Company Dashboard
         * MANAGER → Company Dashboard (data filtered to their warehouses)
         * STAFF → Primary Warehouse Dashboard
         */

        if (userRole === 'OWNER' || userRole === 'ADMIN') {
          // ✅ OWNER/ADMIN: Redirect to company dashboard
          console.log('[AuthGuard] OWNER/ADMIN detected, redirecting to company dashboard');
          router.push(`/${activeSlug}/dashboard`);
          return;
        }

        if (userRole === 'MANAGER') {
          // ✅ MANAGER: Redirect to company dashboard
          router.push(`/${activeSlug}/dashboard`);
          return;
        }

        if (userRole === 'STAFF') {
          // ✅ STAFF: Redirect to default warehouse
          const defaultWarehouseId = user?.defaultWarehouseId;

          if (defaultWarehouseId) {
            // Find warehouse slug from warehouses array
            const warehouse = user?.warehouses?.find((w) => w.warehouseId === defaultWarehouseId);

            if (warehouse && warehouse.warehouseSlug) {
              console.log(
                `[AuthGuard] ${userRole} detected, redirecting to default warehouse:`,
                warehouse.warehouseSlug,
              );
              router.push(`/${activeSlug}/warehouses/${warehouse.warehouseSlug}`);
              return;
            }
          }

          // Fallback: try to find any warehouse
          if (user?.warehouses && user.warehouses.length > 0) {
            const firstWarehouse =
              user.warehouses.find((w) => !!w?.warehouseSlug) || user.warehouses[0];
            console.log(
              `[AuthGuard] ${userRole} has no default warehouse, using first assigned:`,
              firstWarehouse.warehouseSlug,
            );
            if (firstWarehouse?.warehouseSlug) {
              router.push(`/${activeSlug}/warehouses/${firstWarehouse.warehouseSlug}`);
            } else {
              router.push(`/${activeSlug}/warehouses`);
            }
            return;
          }

          // Last fallback: warehouses list
          console.log(`[AuthGuard] ${userRole} has no warehouses, redirecting to warehouses list`);
          router.push(`/${activeSlug}/warehouses`);
          return;
        }

        // Fallback for unknown roles
        console.log('[AuthGuard] Unknown role, redirecting to company page');
        router.push(`/${activeSlug}`);
        return;
      }
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
