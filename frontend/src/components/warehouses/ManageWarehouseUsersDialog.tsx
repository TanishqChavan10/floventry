'use client';

import React, { useState } from 'react';
import { useAssignUserToWarehouse, useRemoveUserFromWarehouse } from '@/hooks/apollo';
import { toast } from 'sonner';
import { UserPlus, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface WarehouseAssignment {
  userId: string;
  userName: string;
  userEmail: string;
  role?: string;
  isManagerOfWarehouse: boolean;
}

interface ManageWarehouseUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  currentAssignments: WarehouseAssignment[];
  availableUsers: User[];
  onRefetch?: () => void;
}

export function ManageWarehouseUsersDialog({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  currentAssignments,
  availableUsers,
  onRefetch,
}: ManageWarehouseUsersDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('STAFF');

  const [assignUser, { loading: assigning }] = useAssignUserToWarehouse();
  const [removeUser, { loading: removing }] = useRemoveUserFromWarehouse();

  const assignedUserIds = new Set(currentAssignments.map((a) => a.userId));
  const unassignedUsers = availableUsers.filter((u) => !assignedUserIds.has(u.id));

  async function handleAssignUser() {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      await assignUser({
        variables: {
          warehouseId,
          input: {
            userId: selectedUserId,
            role: selectedRole,
          },
        },
      });

      const user = availableUsers.find((u) => u.id === selectedUserId);
      toast.success(`${user?.full_name || 'User'} assigned to ${warehouseName}`);
      setSelectedUserId('');
      setSelectedRole('STAFF');
      onRefetch?.();
    } catch (error: any) {
      toast.error('Failed to assign user: ' + error.message);
    }
  }

  async function handleRemoveUser(userId: string, userName: string) {
    try {
      await removeUser({
        variables: {
          warehouseId,
          userId,
        },
      });

      toast.success(`${userName} removed from ${warehouseName}`);
      onRefetch?.();
    } catch (error: any) {
      toast.error('Failed to remove user: ' + error.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Warehouse Team</DialogTitle>
          <DialogDescription>
            Assign users to <strong>{warehouseName}</strong> and manage their access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assign New User Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Assign New User</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedUsers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        All users assigned
                      </div>
                    ) : (
                      unassignedUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span>{user.full_name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAssignUser}
              disabled={!selectedUserId || assigning}
              className="w-full"
            >
              {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              Assign User
            </Button>
          </div>

          {/* Current Assignments Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Current Team Members</h4>
            {currentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users assigned to this warehouse
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {currentAssignments.map((assignment) => (
                  <div
                    key={assignment.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{assignment.userName}</p>
                      <p className="text-xs text-muted-foreground">{assignment.userEmail}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={assignment.isManagerOfWarehouse ? 'default' : 'secondary'}>
                        {assignment.role || 'STAFF'}
                      </Badge>
                      {assignment.isManagerOfWarehouse && <Badge variant="outline">Manager</Badge>}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(assignment.userId, assignment.userName)}
                        disabled={removing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
