'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { toast } from 'sonner';

/**
 * ManagerGuard - Ensures managers and staff can only access warehouse routes
 * Shows a toast and navigates back when they try to access restricted pages
 */
export function ManagerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuth();
  const { warehouses, isLoading } = useWarehouse();
  const hasShownToast = useRef(false);

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
      pathname?.includes('/dashboard') ||
      pathname?.includes('/settings/team') ||
      pathname?.includes('/purchase-orders');

    // If not on an allowed route, show toast and redirect to warehouse dashboard
    if (warehouses.length > 0 && companySlug) {
      const firstWarehouse = warehouses[0];
      const warehouseSlug = firstWarehouse.slug || 'main-warehouse';
      const warehouseDashboard = `/${companySlug}/warehouses/${warehouseSlug}`;

      if (userRole === 'MANAGER') {
        if (!isWarehouseRoute && !isManagerAllowedCompanyRoute && !hasShownToast.current) {
          hasShownToast.current = true;
          toast.error('Access Denied', {
            description: 'Managers cannot access this page. Redirecting to your warehouse.',
          });
          router.replace(warehouseDashboard);
        }
      } else if (userRole === 'STAFF') {
        if (!isWarehouseRoute && !hasShownToast.current) {
          hasShownToast.current = true;
          toast.error('Access Denied', {
            description: 'Staff members can only access warehouse pages.',
          });
          router.replace(warehouseDashboard);
        }
      }
    }
  }, [pathname, user, warehouses, isLoading, params, router]);

  return <>{children}</>;
}
