'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TransfersRedirect() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;

  useEffect(() => {
    // Redirect to the new inventory transfers page
    if (companySlug && warehouseSlug) {
      router.replace(`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`);
    }
  }, [companySlug, warehouseSlug, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
        <p className="text-slate-600 dark:text-slate-400">Redirecting to transfers...</p>
      </div>
    </div>
  );
}
