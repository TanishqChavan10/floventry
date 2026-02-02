'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  IconBuilding,
  IconChevronDown,
  IconSearch,
  IconBell,
  IconUser,
  IconLogout,
  IconSettings,
  IconShield,
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input'; // Assuming Input component exists
import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';

export function Navbar() {
  const { user } = useAuth();
  const { warehouses, activeWarehouse } = useWarehouse();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { signOut } = useClerk();

  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;

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

  const handleCompanySwitch = (newSlug: string) => {
    // Navigate to the new company's dashboard
    router.push(`/${newSlug}`);
  };

  if (!activeCompany) return null;

  return (
    <div className="h-16 border-b border-neutral-200 bg-white px-4 flex items-center justify-between gap-4">
      {/* Left Side: Switchers */}
      <div className="flex items-center gap-4">
        {/* Company Switcher - Available for all roles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-neutral-50',
                'border border-neutral-200',
                'hover:bg-neutral-100',
                'transition-colors duration-200',
              )}
            >
              <IconBuilding className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-sm text-neutral-900 max-w-[150px] truncate">
                {activeCompany.name}
              </span>
              <IconChevronDown className="h-4 w-4 text-neutral-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.companies?.map((company) => (
              <DropdownMenuItem
                key={company.slug}
                onClick={() => handleCompanySwitch(company.slug)}
                className={cn(
                  'cursor-pointer',
                  company.slug === companySlug && 'bg-neutral-100',
                )}
              >
                {company.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Warehouse Switcher - Always visible for all roles */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full',
                'bg-neutral-50',
                'border border-neutral-200',
                'hover:bg-neutral-100',
                'transition-colors duration-200',
              )}
            >
              <span className="font-medium text-sm text-neutral-900 max-w-[150px] truncate">
                {displayWarehouse
                  ? displayWarehouse.name
                  : warehouses.length > 0
                    ? 'Select Warehouse'
                    : 'No Warehouses'}
              </span>
              <IconChevronDown className="h-4 w-4 text-neutral-500" />
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
                      'bg-neutral-50 text-neutral-900',
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{warehouse.name}</span>
                    <span className="text-xs text-neutral-500">
                      {warehouse.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-neutral-500">
                No warehouses available
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center/Right: Search, Alerts, User */}
      <div className="flex items-center gap-4 flex-1">
        {/* Search Bar */}
        <div className="relative flex-1 w-full max-w-4xl px-4 hidden md:block">
          <IconSearch className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search..."
            className={cn(
              'w-full h-9 pl-9 pr-4 text-sm rounded-lg',
              'bg-neutral-100',
              'border-none outline-none focus:ring-2 focus:ring-[#E53935]/20',
              'placeholder:text-neutral-500',
            )}
          />
        </div>

        {/* Alerts */}
        <NotificationBell />

        {/* User Role Badge */}
        <div className="hidden md:flex items-center px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">
          <IconShield className="h-3 w-3 mr-1 text-neutral-500" />
          <span className="text-xs font-medium text-neutral-600 uppercase">
            {activeCompany.role}
          </span>
        </div>
      </div>
    </div>
  );
}
