'use client';

import React from 'react';
import { useApolloClient } from '@apollo/client';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { clearPersistedCache } from '@/lib/apollo/client';
import { useSwitchCompany } from '@/hooks/apollo';
import {
  IconBuilding,
  IconChevronDown,
  IconSearch,
  IconPlus,
  IconUser,
  IconShield,
  IconHome,
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/auth/UserAvatar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { CreateWarehouseDialog } from '@/components/warehouses/CreateWarehouseDialog';
import { toast } from 'sonner';

export function Navbar() {
  const { user } = useAuth();
  const { warehouses, activeWarehouse, setActiveWarehouseId, refreshWarehouses } = useWarehouse();
  const router = useRouter();
  const apolloClient = useApolloClient();
  const params = useParams();
  const { openPalette } = useGlobalSearch();
  const [switchCompany] = useSwitchCompany();

  const [createWarehouseOpen, setCreateWarehouseOpen] = React.useState(false);

  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';

  const companyPlan: 'Standard' | 'Pro' | null = companySlug ? 'Pro' : null;

  // Get current active company from user's companies
  // If no company slug in URL (e.g., /profile), use the first company as fallback
  const activeCompany =
    user?.companies?.find((c) => c.slug === companySlug) || user?.companies?.[0];

  // Check if we're in a warehouse-specific route (has warehouseSlug in URL)
  // vs a company-level route (no warehouseSlug)
  const isWarehouseRoute = !!warehouseSlug;

  // Only show active warehouse name when in a warehouse-specific route
  // On company-level routes, show "Select Warehouse" to prompt navigation
  const displayWarehouse = isWarehouseRoute ? activeWarehouse : null;

  const handleWarehouseSwitch = (warehouseSlug: string) => {
    const currentCompanySlug = companySlug || activeCompany?.slug;
    if (currentCompanySlug) {
      router.push(`/${currentCompanySlug}/warehouses/${warehouseSlug}`);
    }
  };

  const handleCompanySwitch = async (companyId: string, newSlug: string) => {
    if (!activeCompany || companyId === activeCompany.id) return;

    const targetCompany = user?.companies?.find((company) => company.id === companyId);

    try {
      const { data } = await switchCompany({ variables: { companyId } });

      if (!data?.switchCompany?.success) {
        throw new Error('Failed to switch company');
      }

      clearPersistedCache();
      await apolloClient.resetStore();
      setActiveWarehouseId('ALL');

      // Explicitly fetch warehouses for the new company by passing the company ID.
      // This bypasses any race condition with activeCompanyId propagation.
      await refreshWarehouses(companyId);

      router.push(`/${newSlug}`);
      router.refresh();
      toast.success(`Switched to ${targetCompany?.name || 'company'}`);
    } catch (error: any) {
      console.error('[Navbar] Failed to switch company:', error);
      toast.error(error.message || 'Failed to switch company');
    }
  };

  const handleCreateCompany = () => {
    router.push('/onboarding/create-company');
  };

  const handleCreateWarehouse = () => {
    setCreateWarehouseOpen(true);
  };

  if (!activeCompany) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="h-16 px-4 flex items-center gap-3">
        {/* Left Side: Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Company Switcher - Available for all roles */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'h-9 flex items-center gap-2 px-3 rounded-lg',
                  'bg-background',
                  'border border-border',
                  'hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'transition-colors duration-200',
                )}
              >
                <IconBuilding className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm text-foreground max-w-[150px] truncate">
                  {activeCompany.name}
                </span>
                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.companies?.map((company) => (
                <DropdownMenuItem
                  key={company.slug}
                  onClick={() => handleCompanySwitch(company.id, company.slug)}
                  className={cn('cursor-pointer', company.slug === companySlug && 'bg-muted')}
                >
                  {company.name}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateCompany} className="cursor-pointer">
                <IconPlus className="h-4 w-4 mr-2 text-muted-foreground" />
                Create company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:block h-6 w-px bg-border" />

          {/* Warehouse Switcher - Hidden on profile page */}
          {!isProfilePage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'h-9 flex items-center gap-2 px-3 rounded-lg',
                    'bg-background',
                    'border border-border',
                    'hover:bg-muted',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'transition-colors duration-200',
                  )}
                >
                  <IconHome className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground max-w-[150px] truncate">
                    {displayWarehouse
                      ? displayWarehouse.name
                      : warehouses.length > 0
                        ? 'Select Warehouse'
                        : 'No Warehouses'}
                  </span>
                  <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                <DropdownMenuLabel>Switch Warehouse</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {warehouses.length > 0 ? (
                  warehouses.map((warehouse) => (
                    <DropdownMenuItem
                      key={warehouse.id}
                      onClick={() => handleWarehouseSwitch(warehouse.slug)}
                      className={cn(
                        'cursor-pointer',
                        displayWarehouse &&
                          warehouse.id === displayWarehouse.id &&
                          'bg-muted text-foreground',
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{warehouse.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {warehouse.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No warehouses available
                  </div>
                )}

                {String(activeCompany.role).toUpperCase() !== 'STAFF' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCreateWarehouse} className="cursor-pointer">
                      <IconPlus className="h-4 w-4 mr-2 text-muted-foreground" />
                      Create warehouse
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl hidden md:block">
            {!isProfilePage && (
              <button
                type="button"
                onClick={openPalette}
                className={cn(
                  'relative w-full h-9 pl-9 pr-3 text-sm rounded-lg',
                  'bg-background',
                  'border border-border',
                  'hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'flex items-center justify-between',
                )}
                aria-label="Open global search"
              >
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Search…</span>
                <span className="text-[11px] text-muted-foreground border border-border bg-muted rounded-md px-2 py-0.5">
                  Ctrl/⌘ K
                </span>
              </button>
            )}
          </div>

          {!isProfilePage && (
            <button
              type="button"
              onClick={openPalette}
              className={cn(
                'md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg',
                'border border-border bg-background',
                'hover:bg-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
              aria-label="Open global search"
            >
              <IconSearch className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Right: Alerts + Role */}
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />

          <div className="hidden md:flex items-center gap-2">
            {companyPlan && (
              <div className="flex items-center h-9 px-2.5 rounded-lg border border-border bg-background">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {companyPlan}
                </span>
              </div>
            )}

            <div className="flex items-center h-9 px-2.5 rounded-lg border border-border bg-background">
              <IconShield className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {activeCompany.role}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <UserAvatar />
          </div>
        </div>
      </div>

      <CreateWarehouseDialog
        open={createWarehouseOpen}
        onOpenChange={setCreateWarehouseOpen}
        companySlug={companySlug || activeCompany.slug}
      />
    </header>
  );
}
