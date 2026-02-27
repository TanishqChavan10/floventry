'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRbac, Role } from '@/hooks/use-rbac';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  customCheck 
}: RoleGuardProps) {
  const router = useRouter();
  const params = useParams();
  const rbac = useRbac();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

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

    if (!hasAccess) {
      // Redirect to no-access page
      const slug = params?.slug as string;
      if (slug) {
        router.replace(`/${slug}/no-access`);
      } else {
        router.replace('/');
      }
    }
  }, [rbac.role, params?.slug, companyLevelOnly, allowedRoles, minRole, customCheck, router]);

  if (isChecking) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAllowed) {
    return null; // The redirect will handle navigation
  }

  return <>{children}</>;
}
