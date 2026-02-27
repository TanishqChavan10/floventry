import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useParams } from 'next/navigation';

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';

const ROLE_RANK: Record<Role, number> = {
    OWNER: 4,
    ADMIN: 3,
    MANAGER: 2,
    STAFF: 1,
};

export function useRbac() {
    const { user } = useAuth();
    const { activeWarehouse } = useWarehouse();
    const params = useParams();

    const companySlug = params?.slug as string;
    const urlWarehouseSlug = params?.warehouseSlug as string;

    // Active company role
    const activeCompany = user?.companies?.find((c) => c.slug === companySlug) || user?.companies?.[0];
    const roleName = (activeCompany?.role || user?.role || 'STAFF').toUpperCase() as Role;

    // Ranks
    const userRank = ROLE_RANK[roleName] || 0;

    // Basic checks
    const isOwner = roleName === 'OWNER';
    const isAdmin = roleName === 'ADMIN';
    const isManager = roleName === 'MANAGER';
    const isStaff = roleName === 'STAFF';

    // Compare roles
    const isAtLeast = (minRole: Role) => userRank >= ROLE_RANK[minRole];

    // Are they the assigned manager for the *currently viewed* warehouse?
    // Check the URL slug first, then fallback to global active warehouse
    const targetWarehouseSlug = urlWarehouseSlug || activeWarehouse?.slug;
    const isTargetWarehouseManager = !!user?.warehouses?.some(
        (w) => w.warehouseSlug === targetWarehouseSlug && w.isManager
    );

    return {
        role: roleName,
        isOwner,
        isAdmin,
        isManager,
        isStaff,

        // Core capabilities
        canPost: isAtLeast('MANAGER'),
        canCancel: isOwner,
        canEditCatalog: isAtLeast('MANAGER'),
        canViewCompanyLevel: isAtLeast('ADMIN'), // OWNER or ADMIN

        // Specific edge cases
        canAccessWarehouseSettings: isOwner || isAdmin || (isManager && isTargetWarehouseManager),
        canEditWarehouseSettings: isOwner || isAdmin, // Managers can only VIEW
        canManageTeamRoles: isAdmin || isOwner,
        canEditPurchaseOrders: isAtLeast('MANAGER'),
    };
}
