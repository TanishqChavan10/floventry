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
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

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
  onSuccess: () => void;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  availableWarehouses,
  onSuccess,
}: EditMemberDialogProps) {
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [updateWarehouses, { loading }] = useMutation(UPDATE_MEMBER_WAREHOUSES);

  // Initialize selected warehouses when member changes
  useEffect(() => {
    if (member) {
      const warehouseIds = member.warehouses?.map(w => w.warehouseId) || [];
      setSelectedWarehouses(warehouseIds);
    }
  }, [member]);

  const handleToggle = (warehouseId: string) => {
    setSelectedWarehouses(prev =>
      prev.includes(warehouseId)
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Warehouse Access</DialogTitle>
          <DialogDescription>
            Update warehouse assignments for{' '}
            <span className="font-medium text-foreground">
              {member.user.fullName || member.user.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid gap-3 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Warehouse Access</Label>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableWarehouses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No warehouses available
                </p>
              ) : (
                availableWarehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className="flex items-start space-x-3 p-2 hover:bg-background rounded"
                  >
                    <Checkbox
                      id={`wh-${warehouse.id}`}
                      checked={selectedWarehouses.includes(warehouse.id)}
                      onCheckedChange={() => handleToggle(warehouse.id)}
                    />
                    <label
                      htmlFor={`wh-${warehouse.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {warehouse.name}
                    </label>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Select warehouses this member can access
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
