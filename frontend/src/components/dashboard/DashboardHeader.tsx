'use client';

import React from 'react';
import { Building2, Settings, Bell, Search, Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserButton } from '@clerk/nextjs';

interface DashboardHeaderProps {
  companyName: string;
  role: string;
  onRoleChange: (role: string) => void; // For testing purposes
}

export default function DashboardHeader({ companyName, role, onRoleChange }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-950 px-6 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 font-semibold text-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="hidden md:inline-block">{companyName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* We would map companies here if we had access to the list from props or context */}
          {/* For now, we'll assume the parent handles the switching or we add useAuth here */}
          <DropdownMenuItem asChild>
            <a href="/company-switcher" className="cursor-pointer">
              <Building2 className="mr-2 h-4 w-4" />
              <span>All Companies</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href="/onboarding/create-company"
              className="cursor-pointer text-indigo-600 dark:text-indigo-400"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Company</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2 ml-2">
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
        {/* Role Switcher for Testing */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-500">
              Switch Role (Dev)
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onRoleChange('admin')}>Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange('manager')}>Manager</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange('employee')}>Employee</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange('viewer')}>Viewer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <a href="/company/settings">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </a>
        </Button>
      </div>
    </header>
  );
}
