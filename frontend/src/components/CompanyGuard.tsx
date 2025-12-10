'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

interface CompanyGuardProps {
  children: React.ReactNode;
}

export default function CompanyGuard({ children }: CompanyGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Only check company membership if user is authenticated and loading is complete
    if (!loading && isAuthenticated) {
      // Check if user has any companies
      if (!user?.companies || user.companies.length === 0) {
        // Add a small delay to prevent immediate redirect loops
        const timer = setTimeout(() => {
          router.push('/onboarding');
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if authenticated and has at least one company
  const hasCompany = isAuthenticated && user?.companies && user.companies.length > 0;
  return hasCompany ? <>{children}</> : null;
}
