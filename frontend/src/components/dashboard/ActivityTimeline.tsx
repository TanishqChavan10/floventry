'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PackagePlus, Truck, FileText, UserPlus, Settings } from 'lucide-react';

interface ActivityTimelineProps {
  role: string;
}

export default function ActivityTimeline({ role }: ActivityTimelineProps) {
  const activities = [
    {
      id: 1,
      type: 'stock_add',
      message: 'Added 50 units of "Wireless Mouse"',
      user: 'Sarah Manager',
      time: '2 hours ago',
      icon: PackagePlus,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      id: 2,
      type: 'delivery',
      message: 'Received shipment from TechSupplies Inc.',
      user: 'Mike Staff',
      time: '4 hours ago',
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      id: 3,
      type: 'invoice',
      message: 'Created Invoice #INV-2024-001',
      user: 'John Admin',
      time: 'Yesterday',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      id: 4,
      type: 'user',
      message: 'Invited new member: Alex Design',
      user: 'John Admin',
      time: 'Yesterday',
      icon: UserPlus,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      id: 5,
      type: 'settings',
      message: 'Updated company address',
      user: 'John Admin',
      time: '2 days ago',
      icon: Settings,
      color: 'text-slate-600',
      bg: 'bg-slate-100 dark:bg-slate-800',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-6 pb-6">
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 relative">
                {/* Timeline Line */}
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-800 last:hidden" />
                
                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activity.bg}`}>
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">{activity.user}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
