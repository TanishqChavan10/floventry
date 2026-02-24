'use client';

import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const UPDATE_MEMBER_WAREHOUSES = gql`
  mutation UpdateMemberWarehouses($membershipId: String!, $warehouseIds: [String!]!) {
    updateMemberWarehouses(membershipId: $membershipId, warehouseIds: $warehouseIds)
  }
`;

interface Warehouse {
  id: string;
  name: string;
  slug: string;
}

interface Member {
  membership_id: string;
  user_id: string;
  user: {
    email: string;
    fullName?: string;
  };
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
  }>;
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  availableWarehouses: Warehouse[];
  currentUser: any; // Current logged-in user
  onSuccess: () => void;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  availableWarehouses,
  currentUser,
  onSuccess,
}: EditMemberDialogProps) {
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [updateWarehouses, { loading }] = useMutation(UPDATE_MEMBER_WAREHOUSES);
  const permissions = usePermissions();

  // Filter warehouses based on current user's role
  // If current user is a MANAGER, only show warehouses they manage
  const filteredWarehouses = (() => {
    if (!currentUser) return availableWarehouses;

    if (permissions.isOwner || permissions.isAdmin) {
      return availableWarehouses;
    }

    if (permissions.isManager) {
      const managedWarehouseIds =
        currentUser.warehouses?.filter((w: any) => w.isManager).map((w: any) => w.warehouseId) ||
        [];

      return availableWarehouses.filter((w) => managedWarehouseIds.includes(w.id));
    }

    return [];
  })();

  // Initialize selected warehouses when member changes
  useEffect(() => {
    if (member) {
      const warehouseIds = member.warehouses?.map((w) => w.warehouseId) || [];
      if (permissions.isManager) {
        const allowedIds = new Set(filteredWarehouses.map((w) => w.id));
        setSelectedWarehouses(warehouseIds.filter((id) => allowedIds.has(id)));
      } else {
        setSelectedWarehouses(warehouseIds);
      }
    }
  }, [member, permissions.isManager, filteredWarehouses]);

  const handleToggle = (warehouseId: string) => {
    setSelectedWarehouses((prev) =>
      prev.includes(warehouseId) ? prev.filter((id) => id !== warehouseId) : [...prev, warehouseId],
    );
  };

  const handleSave = async () => {
    if (!member) return;

    if (selectedWarehouses.length === 0) {
      toast.error('Please select at least one warehouse');
      return;
    }

    try {
      await updateWarehouses({
        variables: {
          membershipId: member.membership_id,
          warehouseIds: selectedWarehouses,
        },
      });

      toast.success('Warehouse assignments updated');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update warehouses');
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Transfer warehouses</DialogTitle>
          <DialogDescription>
            Update warehouse access for{' '}
            <span className="font-medium text-foreground">
              {member.user.fullName || member.user.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Label className="text-sm">Warehouse access</Label>
          <div className="mt-2 border rounded-md max-h-70 overflow-y-auto divide-y">
            {filteredWarehouses.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No warehouses available.</p>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <label
                  key={warehouse.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    id={`wh-${warehouse.id}`}
                    checked={selectedWarehouses.includes(warehouse.id)}
                    onCheckedChange={() => handleToggle(warehouse.id)}
                  />
                  <span className="text-sm">{warehouse.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
