import {
    IconHome,
    IconPackage,
    IconCategory,
    IconTruck,
    IconShoppingCart,
    IconFileText,
    IconSettings,
    IconBuilding,
    IconCreditCard,
    IconBoxSeam,
    IconArrowsExchange,
    IconUsers,
    IconFileInvoice,
    IconAlertTriangle,
    IconCalendarTime,
    IconClipboardList,
    IconHistory,
    IconTruckDelivery,
    IconInfoCircle,
    IconRuler,
    IconAdjustments,
} from '@tabler/icons-react';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';

export interface NavigationItem {
    label: string;
    href: string;
    icon: React.ComponentType<any>;
    roles?: UserRole[]; // If undefined, visible to all roles
    children?: NavigationItem[];
}

export interface NavigationSection {
    title?: string;
    items: NavigationItem[];
    roles?: UserRole[]; // If undefined, visible to all roles
}

/**
 * Get navigation configuration for Company Context
 */
export function getCompanyNavigation(companySlug: string): NavigationSection[] {
    const basePath = `/${companySlug}`;

    return [
        {
            items: [
                {
                    label: 'Dashboard',
                    href: `${basePath}/dashboard`,
                    icon: IconHome,
                },
                {
                    label: 'Warehouses',
                    href: `${basePath}/warehouses`,
                    icon: IconBuilding,
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
            ],
        },
        {
            items: [
                {
                    label: 'Products',
                    href: `${basePath}/catalog/products`,
                    icon: IconBoxSeam,
                },
                {
                    label: 'Categories',
                    href: `${basePath}/catalog/categories`,
                    icon: IconCategory,
                },
                {
                    label: 'Units',
                    href: `${basePath}/catalog/units`,
                    icon: IconRuler,
                    roles: ['OWNER', 'ADMIN'], // Only Owner/Admin can access Units
                },
            ],
        },
        {
            items: [
                {
                    label: 'Suppliers',
                    href: `${basePath}/suppliers`,
                    icon: IconTruck,
                },
                {
                    label: 'Purchase Orders',
                    href: `${basePath}/purchase-orders`,
                    icon: IconShoppingCart,
                    roles: ['OWNER', 'ADMIN', 'MANAGER'], // Only OWNER, ADMIN, and MANAGER can access
                },
                {
                    label: 'Inventory Reports',
                    href: `${basePath}/inventory/reports`,
                    icon: IconClipboardList,
                    roles: ['OWNER', 'ADMIN'],
                },
            ],
        },
        {
            items: [
                {
                    label: 'Audit Log',
                    href: `${basePath}/audit-log`,
                    icon: IconHistory,
                },
            ]
        },
        {
            items: [
                {
                    label: 'Team',
                    href: `${basePath}/settings/team`,
                    icon: IconUsers,
                    roles: ['MANAGER'], // Only for MANAGER; OWNER/ADMIN access via Settings menu
                },
            ],
        },
        {
            items: [
                {
                    label: 'Settings',
                    href: `${basePath}/settings`,
                    icon: IconSettings,
                },
            ],
            roles: ['OWNER', 'ADMIN'],
        },
    ];
}

/**
 * Get navigation configuration for Warehouse Context
 */
export function getWarehouseNavigation(
    companySlug: string,
    warehouseSlug: string
): NavigationSection[] {
    const basePath = `/${companySlug}/warehouses/${warehouseSlug}`;

    return [
        {
            items: [
                {
                    label: 'Overview',
                    href: basePath,
                    icon: IconHome,
                },
                {
                    label: 'Company',
                    href: `/${companySlug}`,
                    icon: IconBuilding,
                },
            ],
        },
        {
            items: [
                {
                    label: 'Inventory',
                    href: `${basePath}/inventory`,
                    icon: IconClipboardList,
                },
                {
                    label: 'Stock',
                    href: `${basePath}/inventory/stock`,
                    icon: IconPackage,
                },
                {
                    label: 'Low Stock',
                    href: `${basePath}/inventory/low-stock`,
                    icon: IconAlertTriangle,
                },
                {
                    label: 'Adjustments',
                    href: `${basePath}/inventory/adjustments`,
                    icon: IconAdjustments,
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
                {
                    label: 'GRN',
                    href: `${basePath}/inventory/grn`,
                    icon: IconBoxSeam,
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
                {
                    label: 'Stock Movements',
                    href: `${basePath}/stock-movements`,
                    icon: IconArrowsExchange,
                },
                {
                    label: 'Expiry',
                    href: `${basePath}/expiry`,
                    icon: IconCalendarTime,
                },
            ]
        },
        {
            items: [
                {
                    label: 'Transfers',
                    href: `${basePath}/transfers`,
                    icon: IconTruckDelivery,
                },
            ]
        },
        {
            items: [
                {
                    label: 'Settings',
                    href: `${basePath}/settings`,
                    icon: IconSettings,
                },
            ],
        },
    ];
}


/**
 * Filter navigation sections based on user role
 */
export function filterNavigationByRole(
    sections: NavigationSection[],
    userRole: UserRole
): NavigationSection[] {
    return sections
        .filter((section) => {
            // If section has role restrictions, check if user has access
            if (section.roles && !section.roles.includes(userRole)) {
                return false;
            }
            return true;
        })
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
                // If item has role restrictions, check if user has access
                if (item.roles && !item.roles.includes(userRole)) {
                    return false;
                }
                return true;
            }),
        }))
        .filter((section) => section.items.length > 0); // Remove empty sections
}
