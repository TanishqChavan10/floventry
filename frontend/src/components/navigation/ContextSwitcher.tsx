'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { IconBuilding, IconChevronDown } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function ContextSwitcher() {
  const { user } = useAuth();
  const { warehouses, activeWarehouse } = useWarehouse();
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;

  // Get current active company from user's companies
  const activeCompany = user?.companies?.find((c) => c.slug === companySlug);

  const handleWarehouseSwitch = (warehouseSlug: string) => {
    if (companySlug) {
      router.push(`/${companySlug}/warehouses/${warehouseSlug}`);
    }
  };

  const handleCompanySwitch = (newSlug: string) => {
    // Navigate to the new company's dashboard
    router.push(`/${newSlug}`);
  };

  if (!activeCompany || !activeWarehouse) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Company Switcher */}
      <div className="px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center justify-between',
                'px-3 py-2.5 rounded-lg',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-700',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                'transition-colors duration-200'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <IconBuilding className="h-4 w-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
                <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {activeCompany.name}
                </span>
              </div>
              <IconChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[250px]">
            <div className="px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Switch Company
            </div>
            <DropdownMenuSeparator />
            {user?.companies?.map((company) => (
              <DropdownMenuItem 
                key={company.slug}
                onClick={() => handleCompanySwitch(company.slug)}
                className={cn(
                  'cursor-pointer',
                  company.slug === companySlug && 'bg-neutral-100 dark:bg-neutral-800'
                )}
              >
                {company.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Warehouse Switcher */}
      {warehouses.length > 0 && (
        <div className="px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center justify-between',
                  'px-3 py-2.5 rounded-lg',
                  'bg-indigo-50 dark:bg-indigo-950/30',
                  'border border-indigo-200 dark:border-indigo-800',
                  'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
                  'transition-colors duration-200'
                )}
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Current Warehouse
                  </span>
                  <span className="font-medium text-sm text-indigo-700 dark:text-indigo-300 truncate w-full">
                    {activeWarehouse.name}
                  </span>
                </div>
                <IconChevronDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[250px]">
              <div className="px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Switch Warehouse
              </div>
              <DropdownMenuSeparator />
              {warehouses.map((warehouse) => (
                <DropdownMenuItem
                  key={warehouse.id}
                  onClick={() => handleWarehouseSwitch(warehouse.slug)}
                  className={cn(
                    'cursor-pointer',
                    warehouse.id === activeWarehouse.id &&
                      'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{warehouse.name}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {warehouse.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
