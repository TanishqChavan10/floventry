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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Redirecting to transfers...</p>
      </div>
    </div>
  );
}
