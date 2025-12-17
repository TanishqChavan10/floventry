'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
        !isOnboardingRoute
      ) {
        // User has multiple companies but no active company selected
        // Redirect to first company's dashboard
        const firstCompanySlug = user?.companies?.[0]?.slug;
        if (firstCompanySlug) {
          router.push(`/${firstCompanySlug}`);
        }
        return;
      }

      if (hasCompanies && isOnboardingRoute && !pathname.startsWith('/onboarding/create-company')) {
        // User has companies but is on onboarding pages, redirect appropriately
        // Find the active company or default to the first one
        const activeSlug =
          user?.companies?.find((c) => c.isActive)?.slug || user?.companies?.[0]?.slug;
        if (activeSlug) {
          router.push(`/${activeSlug}`);
        }
        return;
      }

      // User has companies and appropriate active company - allow access

      // Redirect authenticated users away from auth pages and root route
      if (pathname.startsWith('/auth/') || pathname === '/auth/sign-in' || pathname === '/dashboard' || pathname === '/') {
        console.log('[AuthGuard] Redirecting from auth/root page, pathname:', pathname);
        
        // First check if user has companies
        if (!hasCompanies) {
          // No companies - redirect to onboarding
          console.log('[AuthGuard] No companies, redirecting to onboarding');
          router.push('/onboarding');
          return;
        }
        
        // Has companies - check user role and redirect accordingly
        const activeCompany = user?.companies?.find((c) => c.isActive) || user?.companies?.[0];
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

        if (userRole === 'MANAGER' || userRole === 'STAFF') {
          // ✅ MANAGER/STAFF: Redirect to default warehouse
          const defaultWarehouseId = user?.defaultWarehouseId;
          
          if (defaultWarehouseId) {
            // Find warehouse slug from warehouses array
            const warehouse = user?.warehouses?.find(w => w.warehouseId === defaultWarehouseId);
            
            if (warehouse) {
              console.log(`[AuthGuard] ${userRole} detected, redirecting to default warehouse:`, warehouse.warehouseSlug);
              router.push(`/${activeSlug}/warehouses/${warehouse.warehouseSlug}`);
              return;
            }
          }
          
          // Fallback: try to find any warehouse
          if (user?.warehouses && user.warehouses.length > 0) {
            const firstWarehouse = user.warehouses[0];
            console.log(`[AuthGuard] ${userRole} has no default warehouse, using first assigned:`, firstWarehouse.warehouseSlug);
            router.push(`/${activeSlug}/warehouses/${firstWarehouse.warehouseSlug}`);
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
