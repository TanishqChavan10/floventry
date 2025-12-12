'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWarehouse } from '@/context/warehouse-context';
import EmptyWarehouseState from '@/components/warehouses/EmptyWarehouseState';
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

      // MANAGER and STAFF go to first accessible warehouse
      if (warehouses.length > 0) {
        const firstWarehouse = warehouses[0];
        const targetSlug = firstWarehouse.slug || 'main-warehouse';
        router.replace(`/${companySlug}/${targetSlug}`);
      }
    }
  }, [isLoading, warehouses, user, companySlug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Render Empty State if no warehouses
  if (warehouses.length === 0) {
    return <EmptyWarehouseState companySlug={companySlug} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
