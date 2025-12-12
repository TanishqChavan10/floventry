'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUpRight, ArrowDownRight, Package, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ActivityItem {
  id: string;
  type: 'stock_in' | 'stock_out' | 'user_added' | 'po_created';
  message: string;
  user: string;
  warehouse?: string;
  timestamp: string;
}

// Mock data
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'stock_in',
    message: 'Received 50 units of Premium LED Bulbs',
    user: 'Sarah Staff',
    warehouse: 'Main Warehouse',
    timestamp: '5 minutes ago',
  },
  {
    id: '2',
    type: 'po_created',
    message: 'Created Purchase Order PO-1236',
    user: 'John Manager',
    warehouse: 'Downtown Store',
    timestamp: '1 hour ago',
  },
  {
    id: '3',
    type: 'stock_out',
    message: 'Dispatched 25 units of Wireless Mouse',
    user: 'Mike Warehouse',
    warehouse: 'East Warehouse',
    timestamp: '2 hours ago',
  },
  {
    id: '4',
    type: 'user_added',
    message: 'New user invited: emma@example.com',
    user: 'Admin',
    timestamp: '3 hours ago',
  },
  {
    id: '5',
    type: 'stock_in',
    message: 'Received 100 units of Office Chairs',
    user: 'Sarah Staff',
    warehouse: 'Main Warehouse',
    timestamp: '5 hours ago',
  },
];

export function RecentActivity() {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'stock_in':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'stock_out':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'po_created':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'user_added':
        return <Users className="h-4 w-4 text-purple-600" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>Latest actions across your company</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_ACTIVITIES.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {getInitials(activity.user)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <p className="text-sm font-medium leading-none">
                    {activity.message}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activity.user}</span>
                  {activity.warehouse && (
                    <>
                      <span>•</span>
                      <span>{activity.warehouse}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
