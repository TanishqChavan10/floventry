'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated and loading is complete
    if (!loading && !isAuthenticated) {
      // Add a small delay to prevent immediate redirect loops
      const timer = setTimeout(() => {
        router.push('/auth/sign-in');
      }, 100);
      return () => clearTimeout(timer);
    }

    // Check if user has required role (if specified)
    const activeCompany = user?.companies?.find((c) => c.isActive);
    if (!loading && isAuthenticated && requiredRole && activeCompany?.role !== requiredRole) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, router, user, requiredRole]);
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if authenticated and (no required role or has required role)
  const userRole = user?.companies?.find((c) => c.isActive)?.role;
  return isAuthenticated && (!requiredRole || userRole === requiredRole) ? <>{children}</> : null;
}
