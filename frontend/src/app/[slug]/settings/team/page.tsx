'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_COMPANY_BY_SLUG } from '@/lib/graphql/company';
import { InviteUserDialog } from '@/components/settings/team/InviteUserDialog';
import { InvitesTable } from '@/components/settings/team/InvitesTable';
import { ActiveMembersTable } from '@/components/settings/team/ActiveMembersTable';
import { EditMemberDialog } from '@/components/settings/team/EditMemberDialog';
import { RemoveMemberDialog } from '@/components/settings/team/RemoveMemberDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import CompanyGuard from '@/components/CompanyGuard';
import { useAuth } from '@/context/auth-context';
import RoleGuard from '@/components/guards/RoleGuard';

function TeamManagementContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [removingMember, setRemovingMember] = useState<any>(null);

  const { data, loading, error } = useQuery(GET_COMPANY_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });

  const company = data?.companyBySlug;

  const managedWarehouseIds =
    user?.warehouses?.filter((w) => w.isManager).map((w) => w.warehouseId) || [];

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-8 text-center text-sm text-destructive">
        Error loading company details. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header */}
          <div>
            <Link
              href={`/${slug}/settings`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Settings
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Team</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage members and pending invitations.
                </p>
              </div>
              <InviteUserDialog
                companyId={company.id}
                warehouses={company.warehouses || []}
                managedWarehouses={managedWarehouseIds}
                onSuccess={handleRefresh}
              />
            </div>
          </div>

          {/* Active Members */}
          <div className="space-y-3">
            <ActiveMembersTable
              companyId={company.id}
              onEditMember={setEditingMember}
              onRemoveMember={setRemovingMember}
            />
          </div>

          {/* Pending Invites */}
          <div className="space-y-3">
            <div className="border-b pb-3">
              <h2 className="text-sm font-medium">Pending Invitations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invitations that have not yet been accepted.
              </p>
            </div>
            <InvitesTable companyId={company.id} refreshTrigger={refreshKey} />
          </div>
        </div>
      </div>

      <EditMemberDialog
        open={!!editingMember}
        onOpenChange={(open: boolean) => !open && setEditingMember(null)}
        member={editingMember}
        availableWarehouses={company.warehouses || []}
        currentUser={user}
        onSuccess={handleRefresh}
      />

      <RemoveMemberDialog
        open={!!removingMember}
        onOpenChange={(open: boolean) => !open && setRemovingMember(null)}
        member={removingMember}
        onSuccess={handleRefresh}
      />
    </>
  );
}

export default function TeamManagementPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
        <TeamManagementContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
