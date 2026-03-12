'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useApolloClient } from '@apollo/client';
import { useSwitchCompany } from '@/hooks/apollo';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CompanySwitcher() {
  const { user } = useAuth();
  const router = useRouter();
  const apolloClient = useApolloClient();
  const [switchCompany] = useSwitchCompany();
  const { refreshWarehouses, setActiveWarehouseId } = useWarehouse();

  const activeCompany = user?.companies?.find((c) => c.isActive) || user?.companies?.[0];

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === activeCompany?.id) return;

    const targetCompany = user?.companies?.find((c) => c.id === companyId);

    try {
      const { data } = await switchCompany({ variables: { companyId } });

      if (data?.switchCompany?.success) {
        // Full tenant-safe cache reset: clears in-memory + persisted cache, then refetches active queries
        const { clearPersistedCache: clearPersisted } = await import('@/lib/apollo/client');
        clearPersisted();
        await apolloClient.resetStore();

        // Reset warehouse selection and fetch warehouses for the new company
        setActiveWarehouseId('ALL');
        await refreshWarehouses(companyId);

        toast.success(`Switched to ${targetCompany?.name || 'company'}`);
        // Hard-navigate to the new company's dashboard so [slug] param changes
        router.push(`/${targetCompany?.slug}`);
      }
    } catch (error: any) {
      console.error('Error switching company:', error);
      toast.error(error.message || 'Failed to switch company');
    }
  };

  if (!user?.companies || user.companies.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 font-semibold text-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="hidden md:inline-block">{activeCompany?.name || 'Select Company'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => handleSwitchCompany(company.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-slate-500">{company.role}</p>
                </div>
              </div>
              {company.isActive && <Check className="h-4 w-4 text-indigo-600" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/onboarding/create-company"
            className="cursor-pointer flex items-center w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Company</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
