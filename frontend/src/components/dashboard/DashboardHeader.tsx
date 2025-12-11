'use client';

import React from 'react';
import { Settings, Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserButton } from '@clerk/nextjs';
import WarehouseSwitcher from './WarehouseSwitcher';
import CompanySwitcher from './CompanySwitcher';

interface DashboardHeaderProps {
  companyName: string;
  role: string;
  onRoleChange: (role: string) => void; // For testing purposes
}

import { useParams } from 'next/navigation';

export default function DashboardHeader({ companyName, role, onRoleChange }: DashboardHeaderProps) {
  const params = useParams();
  const companySlug = params?.slug as string;

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

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="w-[200px] lg:w-[300px] pl-9 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Button variant="ghost" size="icon" asChild>
          <a href={`/${companySlug}/settings`}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </a>
        </Button>
      </div>
    </header>
  );
}
