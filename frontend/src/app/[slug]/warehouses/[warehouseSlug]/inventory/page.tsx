'use client';

import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import { Loader2 } from 'lucide-react';
import CompanyGuard from '@/components/CompanyGuard';

function InventoryOverviewContent() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  React.useEffect(() => {
    router.replace(`/${companySlug}/warehouses/${warehouseSlug}/inventory/stock`);
  }, [router, companySlug, warehouseSlug]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function InventoryOverviewPage() {
  return (
    <CompanyGuard>
      <InventoryOverviewContent />
    </CompanyGuard>
  );
}
