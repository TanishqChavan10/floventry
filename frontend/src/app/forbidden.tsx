'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, Lock } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <div className="relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
          <div className="relative z-10">
            <ShieldAlert className="h-32 w-32 text-orange-500" />
            <Lock className="h-12 w-12 text-background absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">403</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button asChild variant="default" size="lg">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="mailto:support@example.com">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
