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
                    roles: ['OWNER', 'ADMIN'],
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
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
                {
                    label: 'Categories',
                    href: `${basePath}/catalog/categories`,
                    icon: IconCategory,
                    roles: ['OWNER', 'ADMIN', 'MANAGER'],
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
                    label: 'Sales Orders',
                    href: `${basePath}/sales/orders`,
                    icon: IconFileInvoice,
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
            ],
        },
        {
            items: [
                {
                    label: 'Suppliers',
                    href: `${basePath}/suppliers`,
                    icon: IconTruck,
                    roles: ['OWNER', 'ADMIN', 'MANAGER'], // Staff shouldn't access Suppliers
                },
                {
                    label: 'Purchase Orders',
                    href: `${basePath}/purchase-orders`,
                    icon: IconShoppingCart,
                    roles: ['OWNER', 'ADMIN', 'MANAGER'],
                },
                {
                    label: 'Reports',
                    href: `${basePath}/reports`,
                    icon: IconClipboardList,
                    roles: ['OWNER', 'ADMIN', 'MANAGER'], // Only Owner/Admin/Manager for Company level
                },
            ],
        },
        {
            items: [
                {
                    label: 'Audit Log',
                    href: `${basePath}/audit-log`,
                    icon: IconHistory,
                    roles: ['OWNER', 'ADMIN'],
                },
            ]
        },
        {
            items: [
                {
                    label: 'Team',
                    href: `${basePath}/settings/team`,
                    icon: IconUsers,
                    roles: ['OWNER', 'ADMIN'], // Matrix: Manager cannot access team management
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
                    roles: ['OWNER', 'ADMIN', 'MANAGER'], // Staff cannot access Adjustments
                },
                {
                    label: 'GRN',
                    href: `${basePath}/inventory/grn`,
                    icon: IconBoxSeam,
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
                {
                    label: 'Reports',
                    href: `${basePath}/inventory/reports`,
                    icon: IconFileText,
                    roles: ['OWNER', 'ADMIN', 'MANAGER'],
                },
                {
                    label: 'Stock Movements',
                    href: `${basePath}/inventory/stock-movements`,
                    icon: IconArrowsExchange,
                },
                {
                    label: 'Issues',
                    href: `${basePath}/issues`,
                    icon: IconInfoCircle,
                    roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'],
                },
            ]
        },
        {
            items: [
                {
                    label: 'Transfers',
                    href: `${basePath}/inventory/transfers`,
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
                    roles: ['OWNER', 'ADMIN', 'MANAGER'], // Managers restricted via useRbac on the page
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
