'use client';

import { Fragment } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { ManagerGuard } from '@/components/guards/ManagerGuard';
import { Sidebar, SidebarBody, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { IconRail } from '@/components/navigation/IconRail';
import { SidebarSection } from '@/components/navigation/SidebarSection';
import { SidebarItem } from '@/components/navigation/SidebarItem';
import {
  filterNavigationByRole,
  getCompanyNavigation,
  getWarehouseNavigation,
  type UserRole,
} from '@/lib/navigation-config';
import { IconUser, IconBell, IconLogout } from '@tabler/icons-react';
import { useClerk, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useParams, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import {
  extractWarehouseRouteSuffix,
  setPendingWarehouseRoute,
} from '@/lib/warehouse-pending-route';

function BottomSection() {
  const { user, isClerkSignedIn } = useAuth();
  const { open } = useSidebar();

  // Show skeleton bottom row while DB user is loading but Clerk confirms signed-in.
  if (!user && isClerkSignedIn) {
    return (
      <div className="border-t border-border pt-2">
        <div
          className={cn(
            'flex items-center rounded-xl mx-2 px-3 py-2.5 gap-3',
            open ? '' : 'justify-center mx-1 px-0',
          )}
        >
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
          {open && (
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              <div className="h-2.5 w-32 bg-muted animate-pulse rounded" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="border-t border-border pt-2">
      <div
        className={cn(
          'flex items-center rounded-xl transition-all duration-300 ease-out group',
          open ? 'gap-3 px-3 mx-2 py-2.5' : 'justify-center mx-1 px-0 py-2.5',
          'hover:bg-muted',
        )}
      >
        {/* Clerk UserButton with custom appearance */}
        <div className="flex-shrink-0">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
                userButtonPopoverCard: 'shadow-none border border-border',
              },
            }}
            afterSignOutUrl="/"
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label="Profile"
                labelIcon={<IconUser className="h-4 w-4" />}
                href="/profile"
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>

        {/* User Info - Only visible when sidebar is open */}
        {open && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppSidebarContent() {
  const { user, isClerkSignedIn } = useAuth();
  const permissions = usePermissions();
  const params = useParams();
  const pathname = usePathname();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;

  // Don't show sidebar if no user is authenticated
  if (!user && !isClerkSignedIn) {
    return null;
  }

  // Clerk confirms signed-in but DB user is still loading — show a skeleton shell
  // so the layout structure is already visible when data arrives.
  if (!user) {
    return (
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mb-6 px-3">
            <div className="h-6 w-28 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex-1 space-y-2 px-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <BottomSection />
      </SidebarBody>
    );
  }

  // Get navigation configuration based on context
  let navigationSections = [];

  // Use warehouse navigation if we're in a warehouse route OR on the warehouses list page
  const isWarehousesListPage = pathname?.includes('/warehouses') && !warehouseSlug;

  if (warehouseSlug || isWarehousesListPage) {
    // For warehouses list page, we don't have a specific warehouse, so pass empty string
    navigationSections = getWarehouseNavigation(companySlug, warehouseSlug || '');
  } else {
    navigationSections = getCompanyNavigation(companySlug);
  }

  const handleWarehouseNavWithoutSelection =
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only apply this guard on the warehouses list page (no warehouse selected)
      if (!isWarehousesListPage) return;

      const suffix = extractWarehouseRouteSuffix(companySlug, href);
      // Guard all warehouse-scoped links (including the warehouse Overview root)
      // so users must select a warehouse first.
      if (!suffix) return;

      e.preventDefault();
      setPendingWarehouseRoute(companySlug, suffix);
      toast.error('No warehouse selected');
    };

  const logoHref = warehouseSlug
    ? `/${companySlug}/warehouses/${warehouseSlug}`
    : `/${companySlug}/dashboard`;

  const userRole: UserRole = permissions.isOwner
    ? 'OWNER'
    : permissions.isAdmin
      ? 'ADMIN'
      : permissions.isManager
        ? 'MANAGER'
        : 'STAFF';

  let filteredSections = filterNavigationByRole(navigationSections, userRole);

  // Sidebar behavior for MANAGER in company context:
  // show: Dashboard, Warehouses, Team
  // hide: Settings (parent), Billing, Roles, Audit, and other company-level sections
  if (permissions.isManager && !(warehouseSlug || isWarehousesListPage)) {
    const allowedHrefs = new Set([
      `/${companySlug}/dashboard`,
      `/${companySlug}/warehouses`,
      `/${companySlug}/purchase-orders`,
      `/${companySlug}/settings/team`,
    ]);

    filteredSections = filteredSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => allowedHrefs.has(item.href)),
      }))
      .filter((section) => section.items.length > 0);
  }

  return (
    <SidebarBody className="justify-between gap-10">
      <div
        className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Logo/Brand (optional) */}
        <div className="mb-6 px-3">
          <Link href={logoHref}>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Flowventory<span className="text-primary">.</span>
            </h1>
          </Link>
        </div>

        {/* Main Navigation Sections */}
        <div className="flex-1">
          {filteredSections.map((section, index) => (
            <Fragment key={index}>
              <SidebarSection title={section.title}>
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    {...item}
                    onClick={
                      isWarehousesListPage
                        ? handleWarehouseNavWithoutSelection(item.href)
                        : undefined
                    }
                  />
                ))}
              </SidebarSection>
              {index === 0 && <div className="my-3 mx-4 h-px bg-border" />}
            </Fragment>
          ))}
        </div>

        {/* Bottom Section */}
        <BottomSection />
      </div>
    </SidebarBody>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show sidebar for landing page, auth pages, onboarding, and invite pages
  const shouldShowSidebar =
    !pathname?.startsWith('/auth') &&
    !pathname?.startsWith('/onboarding') &&
    !pathname?.startsWith('/invite') &&
    !pathname?.startsWith('/notifications') &&
    pathname !== '/';

  return (
    <AuthGuard>
      <ManagerGuard>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar - only show for authenticated pages that are not landing/auth */}
          {shouldShowSidebar && (
            <>
              <IconRail />
            </>
          )}

          {/* Main Content */}
          <main
            className={`flex-1 flex flex-col overflow-hidden ${shouldShowSidebar ? '' : 'w-full'}`}
          >
            {shouldShowSidebar && <Navbar />}
            {shouldShowSidebar && <ArchivedWarehouseBanner />}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </ManagerGuard>
    </AuthGuard>
  );
}

function ArchivedWarehouseBanner() {
  const params = useParams();
  const warehouseSlug = params?.warehouseSlug as string | undefined;
  const { activeWarehouse } = useWarehouse();

  if (!warehouseSlug || !activeWarehouse) return null;
  if (String(activeWarehouse.status ?? 'active').toLowerCase() === 'active') return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span className="font-medium">Archived warehouse.</span> Read-only access — restore it to
      resume operations.
    </div>
  );
}
