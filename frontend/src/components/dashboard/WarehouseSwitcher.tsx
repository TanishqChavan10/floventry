'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Warehouse, Check, ChevronsUpDown, Factory, Store, Wrench, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useWarehouse, Warehouse as WarehouseType } from '@/context/warehouse-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { SWITCH_WAREHOUSE } from '@/lib/graphql/auth';
import { GET_CURRENT_USER } from '@/lib/graphql/auth';
import { toast } from 'sonner';

export default function WarehouseSwitcher() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.slug as string;
  const { warehouses, activeWarehouse, activeWarehouseId, setActiveWarehouseId, isLoading } =
    useWarehouse();

  const [switchWarehouse] = useMutation(SWITCH_WAREHOUSE, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });

  if (isLoading) {
    return <div className="w-[180px] h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />;
  }

  const handleSelect = async (warehouseId: string) => {
    setActiveWarehouseId(warehouseId);
    
    if (warehouseId === 'ALL') {
      // TODO: Handle 'ALL' route if we want a consolidated view
      // For now, maybe redirect to main or keep current logic but we need a route
      router.push(`/${companySlug}/`);
    } else {
      const wh = warehouses.find(w => w.id === warehouseId);
      if (wh && wh.slug) {
        try {
          // Update default warehouse in backend
          await switchWarehouse({
            variables: { warehouseId },
          });
          
          router.push(`/${companySlug}/warehouses/${wh.slug}`);
          toast.success('Warehouse switched successfully');
        } catch (error: any) {
          console.error('Error switching warehouse:', error);
          toast.error(error.message || 'Failed to switch warehouse');
        }
      }
    }
  };

  const getIcon = (type: WarehouseType['type']) => {
    switch (type) {
      case 'MAIN':
        return Factory;
      case 'RETAIL':
        return Store;
      case 'SERVICE_CENTER':
        return Wrench;
      default:
        return Warehouse;
    }
  };

  const ActiveIcon = activeWarehouse ? getIcon(activeWarehouse.type) : Box;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[220px] justify-between border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-2 truncate">
            <ActiveIcon className="h-4 w-4 text-indigo-500" />
            <span className="truncate">
              {activeWarehouseId === 'ALL' ? 'All Warehouses' : activeWarehouse?.name}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Select Warehouse Location
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => handleSelect('ALL')}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-slate-500" />
              <span>All Locations</span>
            </div>
            {activeWarehouseId === 'ALL' && <Check className="h-4 w-4 text-indigo-600" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {warehouses.map((warehouse) => {
            const Icon = getIcon(warehouse.type);
            return (
              <DropdownMenuItem
                key={warehouse.id}
                onSelect={() => handleSelect(warehouse.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span className="truncate">{warehouse.name}</span>
                </div>
                {activeWarehouseId === warehouse.id && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/${companySlug}/${activeWarehouse?.slug || 'main'}/warehouses`} 
            className="cursor-pointer font-medium text-indigo-600"
          >
            <Warehouse className="mr-2 h-4 w-4" />
            Manage Warehouses
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
