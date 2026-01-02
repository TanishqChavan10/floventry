'use client';

import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NoAccessPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            No Warehouse Access
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            You're not assigned to any warehouse yet. Please contact your administrator to get access.
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => router.push(`/${companySlug}`)}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
