'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  ShoppingCart,
  FileText,
  Users,
  Truck,
  ArrowRightLeft,
  Download,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  role: string;
}

export default function QuickActions({ role }: QuickActionsProps) {
  const params = useParams();
  const companySlug = params?.slug as string;

  const actions = [
    {
      label: 'Add Item',
      icon: Plus,
      href: `/${companySlug}/inventory/add`,
      roles: ['admin', 'manager'],
      variant: 'default' as const,
    },
    {
      label: 'Create PO',
      icon: ShoppingCart,
      href: `/${companySlug}/purchase-orders/new`,
      roles: ['admin', 'manager'],
      variant: 'outline' as const,
    },
    {
      label: 'Receive Stock',
      icon: Truck,
      href: `/${companySlug}/inventory/receive`,
      roles: ['admin', 'manager', 'employee'],
      variant: 'outline' as const,
    },
    {
      label: 'Transfer Stock',
      icon: ArrowRightLeft,
      href: `/${companySlug}/inventory/transfer`,
      roles: ['admin', 'manager'],
      variant: 'outline' as const,
    },
    {
      label: 'Invite Team',
      icon: Users,
      href: `/${companySlug}/settings/team`,
      roles: ['admin'],
      variant: 'outline' as const,
    },
    {
      label: 'Reports',
      icon: FileText,
      href: `/${companySlug}/reports`,
      roles: ['admin', 'manager'],
      variant: 'outline' as const,
    },
  ];

  const filteredActions = actions.filter((action) => action.roles.includes(role));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {filteredActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="w-full justify-start h-auto py-4 flex-col items-start gap-2"
              asChild
            >
              <a href={action.href}>
                <action.icon className="h-5 w-5 mb-1" />
                <span>{action.label}</span>
              </a>
            </Button>
          ))}
          {role === 'viewer' && (
            <div className="col-span-2 text-center text-sm text-slate-500 py-4">
              Read-only access. No actions available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
