'use client';

import React, { useState, useEffect } from 'react';
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
  onSuccess 
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('MANAGER');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [managedWarehouseIds, setManagedWarehouseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const permissions = usePermissions();

  // Available warehouses for assignment
  const availableWarehouses = permissions.isManager
    ? warehouses.filter(w => managedWarehouses.includes(w.id))
    : warehouses;

  // Reset selections when role changes
  useEffect(() => {
    setSelectedWarehouses([]);
    setManagedWarehouseIds([]);
  }, [role]);

  const needsWarehouseAssignment = role === 'MANAGER' || role === 'WAREHOUSE_STAFF';

  const handleWarehouseToggle = (warehouseId: string) => {
    setSelectedWarehouses(prev =>
      prev.includes(warehouseId)
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const handleManagerWarehouseToggle = (warehouseId: string) => {
    setManagedWarehouseIds(prev => {
      const newManaged = prev.includes(warehouseId)
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId];
      
      // Auto-add to selectedWarehouses if adding to managed
      if (!prev.includes(warehouseId)) {
        setSelectedWarehouses(current => 
          current.includes(warehouseId) ? current : [...current, warehouseId]
        );
      }
      
      return newManaged;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (role === 'MANAGER' && managedWarehouseIds.length === 0) {
      toast.error('Please select at least one warehouse for the manager to manage');
      return;
    }
    
    if (role === 'WAREHOUSE_STAFF' && selectedWarehouses.length === 0) {
      toast.error('Please select at least one warehouse for staff access');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        email,
        role,
        companyId,
      };

      if (needsWarehouseAssignment) {
        payload.warehouseIds = selectedWarehouses;
        if (role === 'MANAGER') {
          payload.managesWarehouseIds = managedWarehouseIds;
        }
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send invite');
      }

      toast.success('Invite sent successfully');
      setOpen(false);
      setEmail('');
      setRole('MANAGER');
      setSelectedWarehouses([]);
      setManagedWarehouseIds([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSend}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join your company workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Role Selection */}
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {permissions.isOwner && (
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  )}
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="WAREHOUSE_STAFF">Warehouse Staff</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'ADMIN' && 'Full access except billing'}
                {role === 'MANAGER' && 'Can manage assigned warehouses'}
                {role === 'WAREHOUSE_STAFF' && 'Limited warehouse access'}
              </p>
            </div>

            {/* Warehouse Assignment */}
            {needsWarehouseAssignment && (
              <div className="grid gap-3 border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    {role === 'MANAGER' ? 'Warehouse Management' : 'Warehouse Access'}
                  </Label>
                </div>

                {role === 'MANAGER' && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Select warehouses this manager will manage and have access to:
                    </p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {availableWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="flex items-start space-x-3 p-2 hover:bg-background rounded">
                          <Checkbox
                            id={`manage-${warehouse.id}`}
                            checked={managedWarehouseIds.includes(warehouse.id)}
                            onCheckedChange={() => handleManagerWarehouseToggle(warehouse.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`manage-${warehouse.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {warehouse.name}
                              {managedWarehouseIds.includes(warehouse.id) && (
                                <span className="ml-2 text-xs text-primary">(Manager)</span>
                              )}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {role === 'WAREHOUSE_STAFF' && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Select warehouses this staff member can access:
                    </p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {availableWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="flex items-start space-x-3 p-2 hover:bg-background rounded">
                          <Checkbox
                            id={`access-${warehouse.id}`}
                            checked={selectedWarehouses.includes(warehouse.id)}
                            onCheckedChange={() => handleWarehouseToggle(warehouse.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`access-${warehouse.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {warehouse.name}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableWarehouses.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No warehouses available for assignment
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
