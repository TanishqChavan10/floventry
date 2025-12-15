'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWarehouse } from '@/context/warehouse-context';
// import EmptyWarehouseState from '@/components/warehouses/EmptyWarehouseState'; // REMOVED - No longer used
import { Loader2 } from 'lucide-react';

export default function CompanyRootPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;
  const { warehouses, isLoading } = useWarehouse();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      // Get user role from Clerk metadata
      const userRole = user?.publicMetadata?.activeRole as string;

      // OWNER and ADMIN go to company dashboard
      if (userRole === 'OWNER' || userRole === 'ADMIN') {
        router.replace(`/${companySlug}/dashboard`);
        return;
      }

      // MANAGER goes to warehouses list page to select warehouse
      if (userRole === 'MANAGER') {
        router.replace(`/${companySlug}/warehouses`);
        return;
      }

      // STAFF go to first accessible warehouse
      if (userRole === 'STAFF' && warehouses.length > 0) {
        const firstWarehouse = warehouses[0];
        const targetSlug = firstWarehouse.slug || 'main-warehouse';
        router.replace(`/${companySlug}/warehouses/${targetSlug}`);
      }
    }
  }, [isLoading, warehouses, user, companySlug, router]);

  // Always show loading state during redirects
  // EmptyWarehouseState removed - no longer needed
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
