'use client';

import { useAuth } from '@/context/auth-context';
import { useMemo } from 'react';

export enum Role {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
}

interface PermissionsReturn {
    role: Role | null;
    canInviteUsers: boolean;
    canRemoveUsers: boolean;
    canManageRoles: boolean;
    canAssignWarehouses: boolean;
    canViewFullUserDetails: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isStaff: boolean;
}

export function usePermissions(): PermissionsReturn {
    const { user } = useAuth();

    const role = useMemo(() => {
        // Get role from the active company in our DB user
        const activeCompany = user?.companies?.find((c) => c.isActive);
        const activeRole = activeCompany?.role;
        if (!activeRole) return null;

        // Normalize role to enum
        const normalized = activeRole.toUpperCase();
        if (Object.values(Role).includes(normalized as Role)) {
            return normalized as Role;
        }

        return null;
    }, [user]);

    const permissions = useMemo(() => {
        if (!role) {
            return {
                role: null,
                canInviteUsers: false,
                canRemoveUsers: false,
                canManageRoles: false,
                canAssignWarehouses: false,
                canViewFullUserDetails: false,
                isOwner: false,
                isAdmin: false,
                isManager: false,
                isStaff: false,
            };
        }

        const isOwner = role === Role.OWNER;
        const isAdmin = role === Role.ADMIN;
        const isManager = role === Role.MANAGER;
        const isStaff = role === Role.STAFF;

        return {
            role,
            // Invite users - OWNER/ADMIN + MANAGER (MANAGER is limited to STAFF-only in UI + backend)
            canInviteUsers: isOwner || isAdmin || isManager,
            // Remove users - OWNER/ADMIN + MANAGER (MANAGER is limited to removing STAFF only, scoped by warehouses)
            canRemoveUsers: isOwner || isAdmin || isManager,

            // Manage roles - OWNER and ADMIN only
            canManageRoles: isOwner || isAdmin,

            // Assign warehouses - OWNER, ADMIN, and MANAGER (with restrictions)
            canAssignWarehouses: isOwner || isAdmin || isManager,

            // View full user details - OWNER and ADMIN see everything
            canViewFullUserDetails: isOwner || isAdmin,

            // Role flags
            isOwner,
            isAdmin,
            isManager,
            isStaff,
        };
    }, [role]);

    return permissions;
}
