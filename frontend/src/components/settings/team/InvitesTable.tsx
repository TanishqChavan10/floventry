'use client';

import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { COMPANY_INVITES, CANCEL_INVITE } from '@/lib/graphql/invite';
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
  const { data, loading, refetch } = useQuery(COMPANY_INVITES, {
    variables: { companyId },
    skip: !companyId,
  });

  const [cancelInviteMutation] = useMutation(CANCEL_INVITE, {
    refetchQueries: [{ query: COMPANY_INVITES, variables: { companyId } }],
  });

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
    return (
      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
        No pending invites
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.invite_id}>
              <TableCell className="font-medium">{invite.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{invite.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={invite.status === 'pending' ? 'secondary' : 'outline'}>
                  {invite.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                {!permissions.isManager && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRevoke(invite.invite_id)}
                    title="Cancel Invite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
