'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Users, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const GET_WAREHOUSE_MEMBERS = gql`
  query GetWarehouseMembers($warehouseId: String!) {
    warehouseMembers(warehouseId: $warehouseId) {
      userId
      email
      fullName
      role
      isManager
    }
  }
`;

interface WarehouseMember {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
  isManager: boolean;
}

interface WarehouseAccessListProps {
  warehouseId: string;
  companySlug: string;
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
  MANAGER: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

const roleIcons: Record<string, string> = {
  OWNER: '👑',
  ADMIN: '🛡️',
  MANAGER: '📊',
  STAFF: '👤',
};

export function WarehouseAccessList({ warehouseId, companySlug }: WarehouseAccessListProps) {
  const { data, loading, error } = useQuery(GET_WAREHOUSE_MEMBERS, {
    variables: { warehouseId },
    skip: !warehouseId,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
        Error loading user access: {error.message}
      </div>
    );
  }

  const members: WarehouseMember[] = data?.warehouseMembers || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">User Access</h3>
        </div>
        <Link
          href={`/${companySlug}/settings/team`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Manage team members
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Read-only view:</strong> To modify user access or warehouse assignments, use the{' '}
          <Link href={`/${companySlug}/settings/team`} className="underline font-medium">
            Team Management
          </Link>{' '}
          page.
        </p>
      </div>

      {/* Members Grid */}
      {members.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No users have access to this warehouse yet
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <Card key={member.userId} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {member.fullName?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </div>

                  {/* Name & Email */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {member.fullName || member.email}
                      </p>
                      {member.isManager && (
                        <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300">
                          <Building2 className="h-3 w-3 mr-1" />
                          Manages this warehouse
                        </Badge>
                      )}
                    </div>
                    {member.fullName && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </div>

                {/* Role Badge */}
                <Badge className={`${roleColors[member.role] || roleColors.STAFF} border`}>
                  <span className="mr-1">{roleIcons[member.role]}</span>
                  {member.role}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p>
          {members.length} {members.length === 1 ? 'user has' : 'users have'} access to this warehouse
          {members.some(m => m.role === 'OWNER' || m.role === 'ADMIN') && (
            <> (including OWNER/ADMIN with access to all warehouses)</>
          )}
        </p>
      </div>
    </div>
  );
}
