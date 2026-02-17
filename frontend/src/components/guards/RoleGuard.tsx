'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF')[];
  fallbackPath?: string;
}

export default function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const permissions = usePermissions();
  const router = useRouter();

  const hasAccess =
    (allowedRoles.includes('OWNER') && permissions.isOwner) ||
    (allowedRoles.includes('ADMIN') && permissions.isAdmin) ||
    (allowedRoles.includes('MANAGER') && permissions.isManager) ||
    (allowedRoles.includes('STAFF') && permissions.isStaff);

  useEffect(() => {
    if (!hasAccess && fallbackPath) {
      router.push(fallbackPath);
    }
  }, [hasAccess, fallbackPath, router]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
