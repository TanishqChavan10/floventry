'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { usePermissions } from '@/hooks/usePermissions';
import {
  filterNavigationByRole,
  getCompanyNavigation,
  getWarehouseNavigation,
  type NavigationItem,
  type NavigationSection,
  type UserRole,
} from '@/lib/navigation-config';
import {
  extractWarehouseRouteSuffix,
  setPendingWarehouseRoute,
} from '@/lib/warehouse-pending-route';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

function isHrefActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;

  // If href is a warehouse overview root (e.g., /company/warehouses/warehouse),
  // only treat it as active on the exact page (not on sub-pages).
  if (href.match(/^\/[^\/]+\/warehouses\/[^\/]+$/)) {
    return false;
  }

  // If href is a company root (e.g., /company-slug) and we're in a warehouse route,
  // don't mark as active.
  if (href.match(/^\/[^\/]+$/) && pathname.includes('/warehouses/')) {
    return false;
  }

  return pathname.startsWith(href + '/');
}

export function IconRail() {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuth();
  const permissions = usePermissions();

  const companySlug = params?.slug as string | undefined;
  const warehouseSlug = params?.warehouseSlug as string | undefined;

  if (!user || !companySlug) return null;

  const isWarehousesListPage = pathname?.includes('/warehouses') && !warehouseSlug;

  const navigationSections =
    warehouseSlug || isWarehousesListPage
      ? getWarehouseNavigation(companySlug, warehouseSlug || '')
      : getCompanyNavigation(companySlug);

  const userRole: UserRole = permissions.isOwner
    ? 'OWNER'
    : permissions.isAdmin
      ? 'ADMIN'
      : permissions.isManager
        ? 'MANAGER'
        : 'STAFF';

  let filteredSections = filterNavigationByRole(navigationSections, userRole);

  // Same MANAGER restrictions as the sidebar (company context only)
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

  const logoHref = warehouseSlug
    ? `/${companySlug}/warehouses/${warehouseSlug}`
    : `/${companySlug}/dashboard`;

  // Check if we're exactly on the home/overview page (not a sub-page)
  const isOnHomePage = pathname === logoHref;

  const handleNavWithoutSelection = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isWarehousesListPage) return;

    const suffix = extractWarehouseRouteSuffix(companySlug, href);
    if (!suffix) return;

    e.preventDefault();
    setPendingWarehouseRoute(companySlug, suffix);
    toast.error('No warehouse selected');
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="hidden md:flex w-20 shrink-0 bg-primary text-primary-foreground flex-col items-center py-4">
        <Link
          href={logoHref}
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            'transition-all duration-200',
            isOnHomePage
              ? 'bg-white/10 hover:bg-white/15 opacity-100'
              : 'bg-white/5 hover:bg-white/10 opacity-30',
          )}
          title="Home"
          aria-label="Home"
        >
          <span className="text-lg font-semibold leading-none">F</span>
        </Link>

        <div className="mt-4 flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto px-2">
          {filteredSections.flatMap((section, sectionIndex) => {
            const nodes = section.items.map((item) => {
              const active = isHrefActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={
                        isWarehousesListPage ? handleNavWithoutSelection(item.href) : undefined
                      }
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center',
                        'transition-colors',
                        active
                          ? 'bg-primary-foreground text-primary'
                          : 'text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                      )}
                      aria-label={item.label}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          active ? 'text-primary' : 'text-primary-foreground',
                        )}
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-foreground text-background border-none"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            });

            if (sectionIndex === 0) {
              nodes.push(
                <div
                  key="__section_divider__"
                  aria-hidden
                  className="my-2 h-px w-10 bg-primary-foreground/15"
                />,
              );
            }

            return nodes;
          })}
        </div>

        <div className="mt-4" />
      </div>
    </TooltipProvider>
  );
}
