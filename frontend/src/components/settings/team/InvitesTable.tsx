'use client';

import React from 'react';
import { useCompanyInvites, useCancelInvite } from '@/hooks/apollo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';

interface Invite {
  invite_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface InvitesTableProps {
  companyId: string;
  refreshTrigger: number;
}

export function InvitesTable({ companyId, refreshTrigger }: InvitesTableProps) {
  const permissions = usePermissions();
  const { data, loading, refetch } = useCompanyInvites(companyId);

  const [cancelInviteMutation] = useCancelInvite();

  // Refetch when refreshTrigger changes
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleRevoke = async (inviteId: string) => {
    if (permissions.isManager) {
      toast.error('Managers cannot cancel invites');
      return;
    }
    try {
      await cancelInviteMutation({
        variables: { inviteId },
      });
      toast.success('Invite cancelled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invite');
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Loading invites...</div>;
  }

  const invites: Invite[] = data?.companyInvites || [];

  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No pending invitations.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b">
          <TableHead className="text-xs font-medium">Email</TableHead>
          <TableHead className="text-xs font-medium">Role</TableHead>
          <TableHead className="text-xs font-medium">Sent</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.invite_id} className="group">
            <TableCell className="py-3 text-sm">{invite.email}</TableCell>
            <TableCell className="py-3">
              <span className="text-xs text-muted-foreground">
                {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}
              </span>
            </TableCell>
            <TableCell className="py-3">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
              </span>
            </TableCell>
            <TableCell className="py-3">
              {!permissions.isManager && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-transparent"
                  onClick={() => handleRevoke(invite.invite_id)}
                  title="Cancel invitation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
