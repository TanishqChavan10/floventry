'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRbac, Role } from '@/hooks/use-rbac';
import { useWarehouse } from '@/context/warehouse-context';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Minimum role required to view this page */
  minRole?: Role;
  /** Specific roles allowed (overrides minRole) */
  allowedRoles?: Role[];
  /** Does this page require company-level access? (i.e. hides it from Manager/Staff) */
  companyLevelOnly?: boolean;
  /** Custom check function for complex logic (e.g. warehouse managers) */
  customCheck?: (rbac: ReturnType<typeof useRbac>) => boolean;
}

export default function RoleGuard({
  children,
  minRole,
  allowedRoles,
  companyLevelOnly,
  customCheck,
}: RoleGuardProps) {
  const router = useRouter();
  const params = useParams();
  const rbac = useRbac();
  const { warehouses } = useWarehouse();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Give context a moment to populate
    if (!rbac.role) return;

    let hasAccess = true;

    if (companyLevelOnly && !rbac.canViewCompanyLevel) {
      hasAccess = false;
    } else if (allowedRoles && allowedRoles.length > 0) {
      hasAccess = allowedRoles.includes(rbac.role);
    } else if (minRole) {
      const ranks = { OWNER: 4, ADMIN: 3, MANAGER: 2, STAFF: 1 };
      hasAccess = (ranks[rbac.role] || 0) >= ranks[minRole];
    }

    if (customCheck) {
      hasAccess = customCheck(rbac);
    }

    setIsAllowed(hasAccess);
    setIsChecking(false);

    if (!hasAccess && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error('Access Denied', {
        description: `This action requires a higher role. Your current role is ${rbac.role}.`,
      });

      // Redirect MANAGER and STAFF to their warehouse dashboard
      const companySlug = params?.slug as string;
      if (
        (rbac.role === 'MANAGER' || rbac.role === 'STAFF') &&
        warehouses.length > 0 &&
        companySlug
      ) {
        const firstWarehouse = warehouses[0];
        const warehouseSlug = firstWarehouse.slug || 'main-warehouse';
        router.replace(`/${companySlug}/warehouses/${warehouseSlug}`);
      } else {
        router.back();
      }
    }
  }, [
    rbac.role,
    rbac.canViewCompanyLevel,
    companyLevelOnly,
    allowedRoles,
    minRole,
    customCheck,
    router,
    params,
    warehouses,
  ]);

  if (isChecking) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAllowed) {
    return null; // router.back() will handle navigation
  }

  return <>{children}</>;
}
