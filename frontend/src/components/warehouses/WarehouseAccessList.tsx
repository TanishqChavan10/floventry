'use client';

import React from 'react';
import { useWarehouseMembers } from '@/hooks/apollo';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { InviteUserDialog } from '@/components/settings/team/InviteUserDialog';
import { useRbac } from '@/hooks/use-rbac';

interface WarehouseMember {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
  isManager: boolean;
}

interface WarehouseAccessListProps {
  warehouseId: string;
  warehouseName: string;
  companySlug: string;
  companyId: string;
}

const roleBadgeVariant: Record<string, string> = {
  OWNER: 'bg-muted text-foreground border-border',
  ADMIN: 'bg-muted text-foreground border-border',
  MANAGER: 'bg-muted text-foreground border-border',
  STAFF: 'bg-muted text-muted-foreground border-border',
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function WarehouseAccessList({
  warehouseId,
  warehouseName,
  companySlug,
  companyId,
}: WarehouseAccessListProps) {
  const rbac = useRbac();
  const { data, loading, error, refetch } = useWarehouseMembers(warehouseId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load members: {error.message}</p>;
  }

  const members: WarehouseMember[] = data?.warehouseMembers || [];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? 'member' : 'members'} with access
        </p>
        <div className="flex items-center gap-4">
          <InviteUserDialog
            companyId={companyId}
            warehouses={[{ id: warehouseId, name: warehouseName, slug: warehouseId }]}
            preselectedWarehouseId={warehouseId}
            onSuccess={() => refetch()}
          />
          <Link
            href={`/${companySlug}/settings/team`}
            className="text-xs text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            Manage in Team Settings
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground border border-border rounded-md px-3 py-2 bg-muted/30">
        This is a read-only view. To modify access or assignments, use Team Settings.
      </p>

      {/* Member list */}
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No users assigned to this warehouse yet.
        </p>
      ) : (
        <div className="rounded-md border border-border divide-y divide-border overflow-hidden">
          {members.map((member) => {
            const displayName = member.fullName || member.email;
            const initials = getInitials(displayName);
            return (
              <div
                key={member.userId}
                className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                    {member.fullName && (
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    )}
                  </div>
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {member.isManager && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Manages this warehouse
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${roleBadgeVariant[member.role] || roleBadgeVariant.STAFF}`}
                  >
                    {member.role}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
