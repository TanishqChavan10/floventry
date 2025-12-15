'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_COMPANY_BY_SLUG } from '@/lib/graphql/company';
import { InviteUserDialog } from '@/components/settings/team/InviteUserDialog';
import { InvitesTable } from '@/components/settings/team/InvitesTable';
import { ActiveMembersTable } from '@/components/settings/team/ActiveMembersTable';
import { EditMemberDialog } from '@/components/settings/team/EditMemberDialog';
import { RemoveMemberDialog } from '@/components/settings/team/RemoveMemberDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import CompanyGuard from '@/components/CompanyGuard';

function TeamManagementContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [removingMember, setRemovingMember] = useState<any>(null);

  const { data, loading, error } = useQuery(GET_COMPANY_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });

  const company = data?.companyBySlug;

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading company details. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Management</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Manage members and pending invitations for {company.name}.
              </p>
            </div>
            <InviteUserDialog 
              companyId={company.id} 
              warehouses={company.warehouses || []}
              onSuccess={handleRefresh} 
            />
          </div>

          {/* Active Members */}
          <Card>
            <CardHeader>
              <CardTitle>Active Members</CardTitle>
              <CardDescription>Current team members with access to this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveMembersTable 
                companyId={company.id}
                onEditMember={setEditingMember}
                onRemoveMember={setRemovingMember}
              />
            </CardContent>
          </Card>

          {/* Pending Invites */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
              <CardDescription>Invitations sent but not yet accepted.</CardDescription>
            </CardHeader>
            <CardContent>
              <InvitesTable companyId={company.id} refreshTrigger={refreshKey} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Member Dialog */}
      <EditMemberDialog
        open={!!editingMember}
        onOpenChange={(open: boolean) => !open && setEditingMember(null)}
        member={editingMember}
        availableWarehouses={company.warehouses || []}
        onSuccess={handleRefresh}
      />

      {/* Remove Member Dialog */}
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
      <TeamManagementContent />
    </CompanyGuard>
  );
}
