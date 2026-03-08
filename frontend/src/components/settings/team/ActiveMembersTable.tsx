'use client';

import React, { useState } from 'react';
import { useCompanyMembers } from '@/hooks/apollo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Search, UserCog, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/auth-context';

interface Warehouse {
  warehouseId: string;
  warehouseName: string;
  isManager: boolean;
}

interface Member {
  membership_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  status: string;
  invited_by?: string;
  user: {
    email: string;
    fullName?: string;
  };
  warehouses: Warehouse[];
}

interface ActiveMembersTableProps {
  companyId: string;
  onEditMember: (member: Member) => void;
  onRemoveMember: (member: Member) => void;
}

const roleLabel: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export function ActiveMembersTable({
  companyId,
  onEditMember,
  onRemoveMember,
}: ActiveMembersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const permissions = usePermissions();
  const { user } = useAuth();

  const managedWarehouseIds =
    user?.warehouses?.filter((w) => w.isManager).map((w) => w.warehouseId) || [];

  const { data, loading, error } = useCompanyMembers(companyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-4">
        Error loading team members: {error.message}
      </div>
    );
  }

  const members: Member[] = data?.companyMembers || [];

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchQuery === '' ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Determine if user can modify this member
  const canModify = (member: Member) => {
    if (permissions.isOwner) return member.role !== 'OWNER'; // Owner can modify all except other owners
    if (permissions.isAdmin) return ['MANAGER', 'STAFF'].includes(member.role);
    if (permissions.isManager) {
      const hasOverlap = member.warehouses?.some((wh) =>
        managedWarehouseIds.includes(wh.warehouseId),
      );
      return member.role === 'STAFF' && hasOverlap;
    }
    return false;
  };

  // Determine if user can transfer warehouses for this member
  const canTransferWarehouses = (member: Member) => {
    // OWNER and ADMIN can transfer both MANAGER and STAFF
    if (permissions.isOwner || permissions.isAdmin) {
      return ['MANAGER', 'STAFF'].includes(member.role);
    }
    // MANAGER can only transfer STAFF (within their warehouses)
    if (permissions.isManager) {
      const hasOverlap = member.warehouses?.some((wh) =>
        managedWarehouseIds.includes(wh.warehouseId),
      );
      return member.role === 'STAFF' && hasOverlap;
    }
    // STAFF cannot transfer anyone
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
              {roleFilter === 'ALL' ? 'All roles' : (roleLabel[roleFilter] ?? roleFilter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-sm">
            <DropdownMenuItem onClick={() => setRoleFilter('ALL')}>All roles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('OWNER')}>Owner</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('ADMIN')}>Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('MANAGER')}>Manager</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('STAFF')}>Staff</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Members Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="text-xs font-medium">Member</TableHead>
            <TableHead className="text-xs font-medium">Role</TableHead>
            <TableHead className="text-xs font-medium">Warehouses</TableHead>
            <TableHead className="text-xs font-medium">Joined</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                No members found.
              </TableCell>
            </TableRow>
          ) : (
            filteredMembers.map((member) => (
              <TableRow key={member.membership_id} className="group">
                {/* Member */}
                <TableCell className="py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none">
                      {member.user.fullName || member.user.email}
                    </span>
                    {member.user.fullName && (
                      <span className="text-xs text-muted-foreground">{member.user.email}</span>
                    )}
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell className="py-3">
                  <span className="text-xs text-muted-foreground">
                    {roleLabel[member.role] ?? member.role}
                  </span>
                </TableCell>

                {/* Warehouses */}
                <TableCell className="py-3">
                  {member.role === 'OWNER' || member.role === 'ADMIN' ? (
                    <span className="text-xs text-muted-foreground">All warehouses</span>
                  ) : member.warehouses && member.warehouses.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {member.warehouses.map((wh) => wh.warehouseName).join(', ')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Joined Date */}
                <TableCell className="py-3">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(member.joined_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3">
                  {canModify(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-sm">
                        {canTransferWarehouses(member) && (
                          <DropdownMenuItem onClick={() => onEditMember(member)}>
                            <UserCog className="mr-2 h-3.5 w-3.5" />
                            Transfer Warehouses
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onRemoveMember(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="mr-2 h-3.5 w-3.5" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <p className="text-xs text-muted-foreground">
        {filteredMembers.length} of {members.length} members
      </p>
    </div>
  );
}
