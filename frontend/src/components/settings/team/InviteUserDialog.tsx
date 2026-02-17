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
import { Loader2, Mail, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions, Role } from '@/hooks/usePermissions';
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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSend}>
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Invite Team Member</DialogTitle>
                <DialogDescription className="mt-1">
                  Invite a new member to join your workspace.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label htmlFor="role" className="text-sm font-medium">
                Role Assignment
              </Label>
              {permissions.isManager ? (
                <div className="h-auto py-3 px-3 rounded-md bg-muted/30 border text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">👤</span>
                    <div>
                      <div className="font-medium text-base">Staff</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Managers can invite STAFF only
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-auto py-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.isOwner && (
                      <>
                        <SelectItem value="OWNER" className="py-3">
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">👑</span>
                            <div>
                              <div className="font-medium text-base">Owner</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Full company control & billing
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN" className="py-3">
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">🛡️</span>
                            <div>
                              <div className="font-medium text-base">Admin</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Full access to all warehouses
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </>
                    )}
                    {(permissions.isOwner || permissions.isAdmin) && (
                      <SelectItem value="MANAGER" className="py-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">📊</span>
                          <div>
                            <div className="font-medium text-base">Manager</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Manages operations in specific warehouses
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    )}
                    <SelectItem value="STAFF" className="py-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">👤</span>
                        <div>
                          <div className="font-medium text-base">Staff</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Limited access to specific warehouses
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Warehouse Assignment */}
            {needsWarehouseAssignment && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {role === 'MANAGER' ? 'Managed Warehouses' : 'Warehouse Access'}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {role === 'MANAGER'
                      ? 'Select warehouses to manage'
                      : 'Select warehouses to access'}
                  </span>
                </div>

                <div className="border rounded-xl bg-muted/30 p-1 max-h-[220px] overflow-y-auto">
                  {availableWarehouses.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No warehouses available to assign
                    </div>
                  ) : (
                    <div className="grid gap-1">
                      {availableWarehouses.map((warehouse) => {
                        const isSelected =
                          role === 'MANAGER'
                            ? managedWarehouseIds.includes(warehouse.id)
                            : selectedWarehouses.includes(warehouse.id);

                        return (
                          <div
                            key={warehouse.id}
                            className={`
                              flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border
                              ${
                                isSelected
                                  ? 'bg-background border-primary/20 shadow-sm'
                                  : 'hover:bg-accent border-transparent hover:shadow-sm'
                              }
                            `}
                          >
                            <Checkbox
                              id={`wh-${warehouse.id}`}
                              checked={isSelected}
                              onCheckedChange={() =>
                                role === 'MANAGER'
                                  ? handleManagerWarehouseToggle(warehouse.id)
                                  : handleWarehouseToggle(warehouse.id)
                              }
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div
                              className="flex-1"
                              onClick={() =>
                                role === 'MANAGER'
                                  ? handleManagerWarehouseToggle(warehouse.id)
                                  : handleWarehouseToggle(warehouse.id)
                              }
                            >
                              <label
                                htmlFor={`wh-${warehouse.id}`}
                                className="text-sm font-medium leading-none cursor-pointer block text-foreground"
                              >
                                {warehouse.name}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!needsWarehouseAssignment && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs text-primary/80 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                <span className="text-lg">ℹ️</span>
                {role === 'OWNER'
                  ? 'Owners automatically have full access to all warehouses and settings.'
                  : 'Admins automatically have access to all warehouses.'}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
