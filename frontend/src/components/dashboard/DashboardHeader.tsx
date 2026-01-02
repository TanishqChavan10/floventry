'use client';

import React from 'react';
import { Settings, Bell, Search, Menu, Package, Tags, Truck, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserButton } from '@clerk/nextjs';
import WarehouseSwitcher from './WarehouseSwitcher';
import CompanySwitcher from './CompanySwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useWarehouse } from '@/context/warehouse-context';
import { useParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

export default function DashboardHeader() {
  const params = useParams();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const { activeWarehouse } = useWarehouse();
  const permissions = usePermissions();
  const role = permissions.role || 'user';

  // Determine if we're in a warehouse context
  const isWarehouseContext = !!warehouseSlug;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-950 px-6 shadow-sm">
      <CompanySwitcher />

      <div className="hidden md:block">
        <WarehouseSwitcher />
      </div>

      <div className="flex items-center gap-2 ml-2">
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="w-[200px] lg:w-[300px] pl-9 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Package className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Catalog</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Manage products & suppliers
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`/${companySlug}/catalog/products`}>
                <Package className="mr-2 h-4 w-4" />
                <span>Products</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/${companySlug}/catalog/categories`}>
                <Tags className="mr-2 h-4 w-4" />
                <span>Categories</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/${companySlug}/catalog/suppliers`}>
                <Truck className="mr-2 h-4 w-4" />
                <span>Suppliers</span>
              </a>
            </DropdownMenuItem>
            {(() => {
              const isOwnerOrAdmin = role?.toLowerCase() === 'owner' || role?.toLowerCase() === 'admin';
              console.log('🔍 Units visibility check:', { role, isOwnerOrAdmin });
              return isOwnerOrAdmin;
            })() && (
              <DropdownMenuItem asChild>
                <a href={`/${companySlug}/catalog/units`}>
                  <Ruler className="mr-2 h-4 w-4" />
                  <span>Units</span>
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Button variant="ghost" size="icon" asChild>
          <a
            href={
              isWarehouseContext
                ? `/${companySlug}/warehouses/${warehouseSlug}/settings`
                : `/${companySlug}/settings`
            }
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </a>
        </Button>

        <UserButton />
      </div>
    </header>
  );
}
