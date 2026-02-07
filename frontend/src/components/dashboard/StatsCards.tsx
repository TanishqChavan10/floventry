'use client';

import React from 'react';
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Clock,
  FileText,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsProps {
  role: string;
  isLoading?: boolean;
}

export default function StatsCards({ role, isLoading = false }: StatsCardsProps) {
  // Mock Data
  const stats = [
    {
      title: 'Total Inventory Value',
      value: '$124,500',
      icon: DollarSign,
      description: '+12% from last month',
      color: 'text-green-600',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Low Stock Items',
      value: '12',
      icon: AlertTriangle,
      description: 'Requires attention',
      color: 'text-orange-500',
      roles: ['admin', 'manager', 'employee'],
    },
    {
      title: 'Out of Stock',
      value: '3',
      icon: XCircle,
      description: 'Restock immediately',
      color: 'text-red-500',
      roles: ['admin', 'manager', 'employee'],
    },
    {
      title: "Today's Sales",
      value: '$3,450',
      icon: TrendingUp,
      description: '24 orders today',
      color: 'text-blue-600',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Pending Deliveries',
      value: '5',
      icon: Package,
      description: 'Arriving today',
      color: 'text-purple-600',
      roles: ['admin', 'manager', 'employee'],
    },
    {
      title: 'Pending POs',
      value: '2',
      icon: ShoppingCart,
      description: 'Awaiting approval',
      color: 'text-indigo-600',
      roles: ['admin', 'manager'],
    },
  ];

  const filteredStats = stats.filter((stat) => stat.roles.includes(role));

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-[100px]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-4 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {filteredStats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
