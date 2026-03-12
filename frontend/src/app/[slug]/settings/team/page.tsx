'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCompanyBySlug } from '@/hooks/apollo';
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

  const { data, loading, error } = useCompanyBySlug(slug);

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
      <div className="min-h-full bg-background p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Back link */}
          <div>
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href={`/${slug}/settings`} className="inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Team</h1>
              <p className="text-muted-foreground mt-1">Manage members and pending invitations.</p>
            </div>
            <InviteUserDialog
              companyId={company.id}
              warehouses={company.warehouses || []}
              managedWarehouses={managedWarehouseIds}
              onSuccess={handleRefresh}
            />
          </div>

          {/* Active Members */}
          <div className="space-y-4">
            <ActiveMembersTable
              companyId={company.id}
              onEditMember={setEditingMember}
              onRemoveMember={setRemovingMember}
            />
          </div>

          {/* Pending Invites */}
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-foreground">Pending Invitations</h2>
              <p className="text-sm text-muted-foreground mt-1">
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
