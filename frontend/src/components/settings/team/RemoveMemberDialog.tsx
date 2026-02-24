'use client';

import React from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const REMOVE_MEMBER = gql`
  mutation RemoveMember($membershipId: String!) {
    removeMemberValidated(membershipId: $membershipId)
  }
`;

interface Member {
  membership_id: string;
  user_id: string;
  role: string;
  user: {
    email: string;
    fullName?: string;
  };
  warehouses?: Array<{
    warehouseId: string;
    warehouseName: string;
  }>;
}

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSuccess: () => void;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: RemoveMemberDialogProps) {
  const [removeMember, { loading }] = useMutation(REMOVE_MEMBER);

  const handleRemove = async () => {
    if (!member) return;

    try {
      await removeMember({
        variables: {
          membershipId: member.membership_id,
        },
      });

      toast.success(
        `${member.user.fullName || member.user.email} has been removed from the company`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">You are about to remove </span>
            <span className="font-medium">{member.user.fullName || member.user.email}</span>
            <span className="text-muted-foreground">
              {' '}
              from the company. They will lose all warehouse access immediately.
            </span>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleRemove} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
