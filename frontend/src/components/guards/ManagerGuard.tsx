'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';

/**
 * ManagerGuard - Ensures managers and staff can only access warehouse routes
 * Redirects them from company-level pages to their first warehouse
 */
export function ManagerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuth();
  const { warehouses, isLoading } = useWarehouse();

  useEffect(() => {
    if (isLoading || !user) return;

    const companySlug = params?.slug as string;
    const userRole = user?.companies?.find((c) => c.slug === companySlug)?.role;

    // Only apply guard to MANAGER and STAFF
    if (userRole !== 'MANAGER' && userRole !== 'STAFF') return;

    // Check if we're on a warehouse-related route (list page or specific warehouse)
    const isWarehouseRoute = pathname?.includes('/warehouses');

    // Managers are allowed on a small set of company-level routes
    const isManagerAllowedCompanyRoute =
      pathname?.includes('/dashboard') || pathname?.includes('/settings/team');

    // If not on an allowed route, redirect.
    if (warehouses.length > 0 && companySlug) {
      if (userRole === 'MANAGER') {
        if (!isWarehouseRoute && !isManagerAllowedCompanyRoute) {
          console.log(`[ManagerGuard] Redirecting MANAGER from ${pathname} to warehouses list`);
          router.replace(`/${companySlug}/warehouses`);
        }
      } else if (userRole === 'STAFF') {
        if (!isWarehouseRoute) {
          const firstWarehouse = warehouses[0];
          const targetSlug = firstWarehouse.slug || 'main-warehouse';
          console.log(
            `[ManagerGuard] Redirecting STAFF from ${pathname} to warehouse ${targetSlug}`,
          );
          router.replace(`/${companySlug}/warehouses/${targetSlug}`);
        }
      }
    }
  }, [pathname, user, warehouses, isLoading, params, router]);

  return <>{children}</>;
}
