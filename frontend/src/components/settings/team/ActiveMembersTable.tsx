'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Search, UserCog, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/auth-context';

// GraphQL Query
const GET_COMPANY_MEMBERS = gql`
  query GetCompanyMembers($companyId: String!) {
    companyMembers(companyId: $companyId) {
      membership_id
      user_id
      role
      joined_at
      status
      invited_by
      user {
        email
        fullName
      }
      warehouses {
        warehouseId
        warehouseName
        isManager
      }
    }
  }
`;

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

const roleColors: Record<string, string> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  MANAGER: 'outline',
  STAFF: 'outline',
};

const roleIcons: Record<string, string> = {
  OWNER: '👑',
  ADMIN: '🛡️',
  MANAGER: '📊',
  STAFF: '👤',
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

  const { data, loading, error } = useQuery(GET_COMPANY_MEMBERS, {
    variables: { companyId },
    skip: !companyId,
  });

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
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              {roleFilter === 'ALL' ? 'All Roles' : roleFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRoleFilter('ALL')}>All Roles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('OWNER')}>👑 Owner</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('ADMIN')}>🛡️ Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('MANAGER')}>📊 Manager</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRoleFilter('STAFF')}>👤 Staff</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Members Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Warehouses</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.membership_id}>
                  {/* Member Name & Email */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {member.user.fullName || member.user.email}
                      </span>
                      {member.user.fullName && (
                        <span className="text-xs text-muted-foreground">{member.user.email}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Role Badge */}
                  <TableCell>
                    <Badge variant={(roleColors[member.role] as any) || 'outline'}>
                      <span className="mr-1">{roleIcons[member.role]}</span>
                      {member.role}
                    </Badge>
                  </TableCell>

                  {/* Warehouses */}
                  <TableCell>
                    {member.role === 'OWNER' || member.role === 'ADMIN' ? (
                      <span className="text-xs text-muted-foreground italic">All warehouses</span>
                    ) : member.warehouses && member.warehouses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.warehouses.map((wh) => (
                          <Badge
                            key={wh.warehouseId}
                            variant={wh.isManager ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {wh.warehouseName}
                            {wh.isManager && ' 📊'}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No warehouses</span>
                    )}
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    {canModify(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canTransferWarehouses(member) && (
                            <DropdownMenuItem onClick={() => onEditMember(member)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Transfer Warehouses
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onRemoveMember(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove from Company
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
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredMembers.length} of {members.length} members
      </div>
    </div>
  );
}
