'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useRouter, useParams } from 'next/navigation';
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

export function Navbar() {
  const { user } = useAuth();
  const { warehouses, activeWarehouse } = useWarehouse();
  const router = useRouter();
  const params = useParams();
  const { signOut } = useClerk();

  const companySlug = params?.slug as string;
  
  // Get current active company from user's companies
  const activeCompany = user?.companies?.find((c) => c.slug === companySlug);

  const handleWarehouseSwitch = (warehouseSlug: string) => {
    if (companySlug) {
      router.push(`/${companySlug}/${warehouseSlug}`);
    }
  };

  const handleCompanySwitch = () => {
    router.push('/company-switcher');
  };

  if (!activeCompany) return null;

  return (
    <div className="h-16 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 flex items-center justify-between gap-4">
      
      {/* Left Side: Switchers */}
      <div className="flex items-center gap-4">
        {/* Company Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-neutral-50 dark:bg-neutral-800',
                'border border-neutral-200 dark:border-neutral-700',
                'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                'transition-colors duration-200'
              )}
            >
              <IconBuilding className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 max-w-[150px] truncate">
                {activeCompany.name}
              </span>
              <IconChevronDown className="h-4 w-4 text-neutral-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
             <DropdownMenuLabel>Current Company</DropdownMenuLabel>
             <DropdownMenuItem disabled>
                {activeCompany.name}
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem onClick={handleCompanySwitch} className="cursor-pointer">
                Switch Company
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Warehouse Switcher */}
         {/* Only show if activeWarehouse is available (it might not be if we are in company settings context, but we want it for navigation consistency if possible. 
             If we are in a purely company context (e.g. /slug/settings), activeWarehouse might be undefined unless we default one or allow selecting one to navigate to.) 
             For now, let's show it if we have warehouses list.
         */}
        {warehouses.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg',
                  'bg-indigo-50 dark:bg-indigo-950/30',
                  'border border-indigo-200 dark:border-indigo-800',
                  'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
                  'transition-colors duration-200'
                )}
              >
                  <span className="font-medium text-sm text-indigo-700 dark:text-indigo-300 max-w-[150px] truncate">
                    {activeWarehouse ? activeWarehouse.name : 'Select Warehouse'}
                  </span>
                <IconChevronDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[250px]">
              <DropdownMenuLabel>Switch Warehouse</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {warehouses.map((warehouse) => (
                <DropdownMenuItem
                  key={warehouse.id}
                  onClick={() => handleWarehouseSwitch(warehouse.slug)}
                  className={cn(
                    'cursor-pointer',
                    activeWarehouse && warehouse.id === activeWarehouse.id &&
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
        )}
      </div>

      {/* Center/Right: Search, Alerts, User */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        
        {/* Search Bar */}
        <div className="relative max-w-md w-full hidden md:block">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search..."
            className={cn(
                "w-full h-9 pl-9 pr-4 text-sm rounded-lg",
                "bg-neutral-100 dark:bg-neutral-800", 
                 "border-none outline-none focus:ring-2 focus:ring-indigo-500/20",
                 "placeholder:text-neutral-500"
            )}
          />
        </div>

        {/* Settings Button (Company Level) */}
        <Link 
            href={`/${companySlug}/settings`}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Company Settings"
        >
            <IconSettings className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        
        {/* Alerts */}
        <button className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <IconBell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
             <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-neutral-900" />
        </button>

        {/* User Role Badge */}
        <div className="hidden md:flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
             <IconShield className="h-3 w-3 mr-1 text-neutral-500" />
             <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase">
                {activeCompany.role}
             </span>
        </div>

        {/* User Menu */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                     <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="font-medium text-sm text-indigo-700 dark:text-indigo-300">
                            {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                        </span>
                     </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer flex items-center gap-2">
                         <IconUser className="h-4 w-4" />
                         <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 dark:text-red-400 flex items-center gap-2">
                     <IconLogout className="h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
