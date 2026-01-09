'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUpRight, ArrowDownRight, Package, ArrowLeftRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';

interface RecentActivityProps {
  data?: CompanyDashboardData;
}

export function RecentActivity({ data }: RecentActivityProps) {
  const events = data?.recentActivity ?? [];

  const getEventIcon = (eventType: string) => {
    if (eventType === 'GRN_POSTED') return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    if (eventType === 'ISSUE_POSTED') return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    if (eventType === 'TRANSFER_POSTED')
      return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
    return <Package className="h-4 w-4 text-slate-500" />;
  };

  const getEventLabel = (eventType: string) => {
    if (eventType === 'GRN_POSTED') return 'Goods received';
    if (eventType === 'ISSUE_POSTED') return 'Stock issued';
    if (eventType === 'TRANSFER_POSTED') return 'Transfer posted';
    if (eventType === 'ADJUSTMENT') return 'Stock adjusted';
    return eventType;
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
          {events.map((event, idx) => (
            <div
              key={`${event.eventType}-${event.referenceNumber ?? 'na'}-${event.occurredAt}-${idx}`}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {getInitials(event.performedBy || 'System')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.eventType)}
                  <p className="text-sm font-medium leading-none">
                    {getEventLabel(event.eventType)}
                    {event.referenceNumber ? ` • ${event.referenceNumber}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{event.performedBy || 'System'}</span>
                  {event.warehouseName && (
                    <>
                      <span>•</span>
                      <span>{event.warehouseName}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-sm text-muted-foreground">No recent activity yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
