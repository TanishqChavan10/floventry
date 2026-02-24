'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { SEND_INVITE } from '@/lib/graphql/invite';

interface Warehouse {
  id: string;
  name: string;
  slug: string;
}

interface InviteUserDialogProps {
  companyId: string;
  warehouses: Warehouse[];
  managedWarehouses?: string[]; // For MANAGER users
  onSuccess: () => void;
}

export function InviteUserDialog({
  companyId,
  warehouses,
  managedWarehouses = [],
  onSuccess,
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('STAFF');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [managedWarehouseIds, setManagedWarehouseIds] = useState<string[]>([]);

  const permissions = usePermissions();
  const [sendInviteMutation, { loading: isLoading }] = useMutation(SEND_INVITE);

  // Managers can only invite STAFF (role fixed)
  useEffect(() => {
    if (permissions.isManager) {
      setRole('STAFF');
      setManagedWarehouseIds([]);
    }
  }, [permissions.isManager]);

  // Available warehouses for assignment
  const availableWarehouses = permissions.isManager
    ? warehouses.filter((w) => managedWarehouses.includes(w.id))
    : warehouses;

  // Reset selections when role changes
  useEffect(() => {
    setSelectedWarehouses([]);
    setManagedWarehouseIds([]);
  }, [role]);

  const needsWarehouseAssignment = role === 'MANAGER' || role === 'STAFF';

  const handleWarehouseToggle = (warehouseId: string) => {
    setSelectedWarehouses((prev) =>
      prev.includes(warehouseId) ? prev.filter((id) => id !== warehouseId) : [...prev, warehouseId],
    );
  };

  const handleManagerWarehouseToggle = (warehouseId: string) => {
    setManagedWarehouseIds((prev) => {
      const newManaged = prev.includes(warehouseId)
        ? prev.filter((id) => id !== warehouseId)
        : [...prev, warehouseId];

      // Auto-add to selectedWarehouses if adding to managed
      if (!prev.includes(warehouseId)) {
        setSelectedWarehouses((current) =>
          current.includes(warehouseId) ? current : [...current, warehouseId],
        );
      }

      return newManaged;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (permissions.isManager && role !== 'STAFF') {
      toast.error('Managers can only invite STAFF');
      return;
    }

    // Validation
    if (role === 'MANAGER' && managedWarehouseIds.length === 0) {
      toast.error('Please select at least one warehouse for the manager to manage');
      return;
    }

    if (role === 'STAFF' && selectedWarehouses.length === 0) {
      toast.error('Please select at least one warehouse for staff access');
      return;
    }

    try {
      const input: any = {
        email,
        role: permissions.isManager ? 'STAFF' : role,
      };

      if (needsWarehouseAssignment) {
        input.warehouseIds = selectedWarehouses;
        if (!permissions.isManager && role === 'MANAGER') {
          input.managesWarehouseIds = managedWarehouseIds;
        }
      }

      await sendInviteMutation({
        variables: { input },
      });

      toast.success('Invite sent successfully');
      setOpen(false);
      setEmail('');
      setRole('STAFF');
      setSelectedWarehouses([]);
      setManagedWarehouseIds([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite');
    }
  };

  // Don't show button if user doesn't have permission
  if (!permissions.canInviteUsers) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-110">
        <form onSubmit={handleSend}>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>Send an invitation to join your workspace.</DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-sm">
                Role
              </Label>
              {permissions.isManager ? (
                <p className="text-sm text-muted-foreground">Staff</p>
              ) : (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.isOwner && (
                      <>
                        <SelectItem value="OWNER">Owner</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </>
                    )}
                    {(permissions.isOwner || permissions.isAdmin) && (
                      <SelectItem value="MANAGER">Manager</SelectItem>
                    )}
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Warehouse Assignment */}
            {needsWarehouseAssignment && (
              <div className="space-y-1.5">
                <Label className="text-sm">
                  {role === 'MANAGER' ? 'Managed warehouses' : 'Warehouse access'}
                </Label>
                <div className="border rounded-md max-h-50 overflow-y-auto divide-y">
                  {availableWarehouses.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No warehouses available.</p>
                  ) : (
                    availableWarehouses.map((warehouse) => {
                      const isSelected =
                        role === 'MANAGER'
                          ? managedWarehouseIds.includes(warehouse.id)
                          : selectedWarehouses.includes(warehouse.id);
                      return (
                        <label
                          key={warehouse.id}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              role === 'MANAGER'
                                ? handleManagerWarehouseToggle(warehouse.id)
                                : handleWarehouseToggle(warehouse.id)
                            }
                          />
                          <span className="text-sm">{warehouse.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {!needsWarehouseAssignment && (
              <p className="text-xs text-muted-foreground">
                {role === 'OWNER'
                  ? 'Owners have full access to all warehouses and settings.'
                  : 'Admins have access to all warehouses.'}
              </p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
