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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
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

      toast.success(`${member.user.fullName || member.user.email} has been removed from the company`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remove Team Member
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Member Info */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Name:</span>
                <p className="text-sm text-muted-foreground">
                  {member.user.fullName || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-sm text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Role:</span>
                <p className="text-sm text-muted-foreground">
                  {member.role}
                </p>
              </div>
              {member.warehouses && member.warehouses.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Warehouses:</span>
                  <p className="text-sm text-muted-foreground">
                    {member.warehouses.map(w => w.warehouseName).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Removing this member will:
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Revoke all company access</li>
                <li>Remove all warehouse assignments</li>
                <li>Prevent them from logging into this workspace</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
