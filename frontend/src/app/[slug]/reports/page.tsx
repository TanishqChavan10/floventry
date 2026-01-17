'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Legacy reports hub - redirects to new inventory reports
 * This page is deprecated as of Phase 4 (Reports Redesign)
 */
export default function ReportsRedirect() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to new inventory reports page
    router.replace(`/${params.slug}/inventory/reports`);
  }, [params.slug, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Redirecting to reports...</p>
      </div>
    </div>
  );
}
