'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  Barcode,
  UserPlus,
  UserMinus,
  Shield,
  Archive,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';

interface RecentActivityProps {
  data?: CompanyDashboardData;
}

export function RecentActivity({ data }: RecentActivityProps) {
  const events = (data?.recentActivity ?? []).slice(0, 5);

  const formatEventType = (eventType: string) => {
    const cleaned = (eventType || '')
      .trim()
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    if (!cleaned) return 'Activity';

    return cleaned
      .split(' ')
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  const getEventMeta = (eventType: string) => {
    switch (eventType) {
      case 'GRN_POSTED':
        return {
          label: 'Goods received',
          icon: <ArrowDownRight className="h-4 w-4 text-[var(--chart-2)]" />,
        };
      case 'ISSUE_POSTED':
        return {
          label: 'Stock issued',
          icon: <ArrowUpRight className="h-4 w-4 text-destructive" />,
        };
      case 'TRANSFER_POSTED':
        return {
          label: 'Transfer posted',
          icon: <ArrowLeftRight className="h-4 w-4 text-[var(--chart-3)]" />,
        };
      case 'ADJUSTMENT_CREATED':
      case 'ADJUSTMENT':
        return {
          label: 'Stock adjusted',
          icon: <Activity className="h-4 w-4 text-muted-foreground" />,
        };
      case 'OPENING_STOCK_SET':
        return {
          label: 'Opening stock set',
          icon: <Package className="h-4 w-4 text-muted-foreground" />,
        };
      case 'BULK_IMPORT_STARTED':
        return {
          label: 'Import started',
          icon: <Activity className="h-4 w-4 text-muted-foreground" />,
        };
      case 'BULK_IMPORT_COMPLETED':
        return {
          label: 'Import completed',
          icon: <Package className="h-4 w-4 text-muted-foreground" />,
        };
      case 'EXPIRY_SCAN_RUN':
        return {
          label: 'Expiry scan run',
          icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
        };
      case 'BARCODE_LABELS_GENERATED':
        return {
          label: 'Barcode labels generated',
          icon: <Barcode className="h-4 w-4 text-muted-foreground" />,
        };
      case 'USER_INVITED':
        return {
          label: 'User invited',
          icon: <UserPlus className="h-4 w-4 text-muted-foreground" />,
        };
      case 'ROLE_CHANGED':
        return {
          label: 'Role changed',
          icon: <Shield className="h-4 w-4 text-muted-foreground" />,
        };
      case 'ADJUSTMENT_POSTED':
        return {
          label: 'Stock adjustment posted',
          icon: <Activity className="h-4 w-4 text-[var(--chart-3)]" />,
        };
      case 'USER_REMOVED':
        return {
          label: 'User removed',
          icon: <UserMinus className="h-4 w-4 text-destructive" />,
        };
      case 'WAREHOUSE_ARCHIVED':
        return {
          label: 'Warehouse archived',
          icon: <Archive className="h-4 w-4 text-muted-foreground" />,
        };
      default:
        return {
          label: formatEventType(eventType),
          icon: <Package className="h-4 w-4 text-muted-foreground" />,
        };
    }
  };

  const getInitials = (name: string) => {
    const cleaned = (name || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return 'SY';

    const parts = cleaned.split(' ').filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('');
    return initials.toUpperCase() || 'SY';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>Latest actions across your company</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="px-6 py-4">
          <div className="space-y-4">
            {events.map((event, idx) =>
              (() => {
                const meta = getEventMeta(event.eventType);
                return (
                  <div
                    key={`${event.eventType}-${event.referenceNumber ?? 'na'}-${event.occurredAt}-${idx}`}
                    className="flex items-start gap-3 py-3 border-b last:border-0"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(event.performedBy || 'System')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {meta.icon}
                            <p className="text-sm font-medium leading-none truncate">
                              {meta.label}
                            </p>
                          </div>
                          {event.referenceNumber ? (
                            <p
                              className="mt-1 text-xs text-muted-foreground truncate"
                              title={event.referenceNumber}
                            >
                              {event.referenceNumber}
                            </p>
                          ) : null}
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                        <span className="truncate">{event.performedBy || 'System'}</span>
                        {event.warehouseName ? (
                          <>
                            <span className="shrink-0">•</span>
                            <span className="truncate">{event.warehouseName}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })(),
            )}

            {events.length === 0 && (
              <div className="text-sm text-muted-foreground">No recent activity yet.</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
