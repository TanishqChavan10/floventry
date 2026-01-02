'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, ShoppingCart, Building2, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface QuickActionsProps {
  companySlug: string;
}

export function QuickActions({ companySlug }: QuickActionsProps) {
  const actions = [
    {
      icon: Package,
      label: 'Add Product',
      description: 'Create new inventory item',
      href: `/${companySlug}/products/new`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      icon: ShoppingCart,
      label: 'Create Purchase Order',
      description: 'Order from supplier',
      href: `/${companySlug}/purchase-orders/new`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      icon: Building2,
      label: 'Add Warehouse',
      description: 'Create new location',
      href: `/${companySlug}/warehouses/new`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      icon: UserPlus,
      label: 'Invite Team Member',
      description: 'Add new user',
      href: `/${companySlug}/settings/team`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex items-start gap-3 hover:bg-muted"
                >
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
