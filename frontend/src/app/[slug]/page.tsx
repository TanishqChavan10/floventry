'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { Loader2 } from 'lucide-react';

export default function CompanyRootPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;
  const { warehouses, isLoading: warehousesLoading } = useWarehouse();
  const { user, loading: userLoading } = useAuth();

  useEffect(() => {
    if (!userLoading && user && !warehousesLoading) {
      // Get user role from their active company
      const activeCompany = user.companies?.find((c) => c.slug === companySlug) || user.companies?.[0];
      const userRole = activeCompany?.role;

      if (!userRole) {
        // No role found, redirect to onboarding
        router.replace('/onboarding');
        return;
      }

      /**
       * 🎯 ROLE-BASED REDIRECT LOGIC
       * OWNER/ADMIN/MANAGER → /dashboard
       * STAFF → /warehouses
       */

      // OWNER, ADMIN, and MANAGER go to company dashboard
      if (userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER') {
        router.replace(`/${companySlug}/dashboard`);
        return;
      }

      // STAFF goes to warehouses page
      if (userRole === 'STAFF') {
        router.replace(`/${companySlug}/warehouses`);
        return;
      }

      // Fallback: redirect to dashboard
      router.replace(`/${companySlug}/dashboard`);
    }
  }, [userLoading, warehousesLoading, user, companySlug, router]);

  // Show loading state during redirects
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
