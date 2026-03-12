'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import CompanyGuard from '@/components/CompanyGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, RefreshCw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/apollo';

function parseUtc(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

interface Notification {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  metadata: unknown;
  readAt: string | null;
  createdAt: string;
}

function getStringMetadataValue(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  WARNING: 'bg-amber-500',
  INFO: 'bg-blue-500',
};

type TabFilter = 'all' | 'unread' | 'critical';

function NotificationsPageContent() {
  const [filter, setFilter] = useState<TabFilter>('all');
  const [page] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 50;
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const companySlug = params?.slug as string;
  const didInitFromQuery = useRef(false);

  const queryFilters = useMemo(() => {
    const severityRaw = (searchParams.get('severity') || '').toUpperCase();
    const severity =
      severityRaw === 'INFO' || severityRaw === 'WARNING' || severityRaw === 'CRITICAL'
        ? (severityRaw as Notification['severity'])
        : null;

    const typeParam = searchParams.get('type');
    const types = (typeParam || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const filterRaw = (searchParams.get('filter') || '').toLowerCase();
    const tabFilter =
      filterRaw === 'unread' || filterRaw === 'critical' || filterRaw === 'all'
        ? (filterRaw as TabFilter)
        : null;

    return { severity, types, tabFilter };
  }, [searchParams]);

  const buildNotificationsUrl = (updates: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') sp.delete(key);
      else sp.set(key, value);
    }
    const qs = sp.toString();
    return qs ? `/${companySlug}/notifications?${qs}` : `/${companySlug}/notifications`;
  };

  useEffect(() => {
    if (didInitFromQuery.current) return;
    if (queryFilters.tabFilter) {
      setFilter(queryFilters.tabFilter);
      didInitFromQuery.current = true;
      return;
    }
    if (queryFilters.severity === 'CRITICAL') {
      setFilter('critical');
      didInitFromQuery.current = true;
      return;
    }
    if (queryFilters.types.length > 0 || queryFilters.severity) {
      setFilter('all');
      didInitFromQuery.current = true;
    }
  }, [queryFilters, searchParams]);

  const { data, loading, refetch } = useNotifications({ limit: pageSize, offset: page * pageSize });
  const { data: countData } = useUnreadNotificationCount();
  const [markAsRead] = useMarkNotificationAsRead();
  const [markAllAsRead] = useMarkAllNotificationsAsRead();

  const notifications: Notification[] = useMemo(() => {
    const seen = new Set<string>();
    return (data?.notifications || []).filter((n: Notification) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [data]);
  const unreadCount = countData?.unreadNotificationCount || 0;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.readAt;
    if (filter === 'critical') return n.severity === 'CRITICAL';
    if (queryFilters.severity && n.severity !== queryFilters.severity) return false;
    if (queryFilters.types.length > 0 && !queryFilters.types.includes(n.type)) return false;
    return true;
  });

  const groupByDate = (items: Notification[]) => {
    const today = new Date();
    const todayStr = today.toDateString();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const groups = {
      today: [] as Notification[],
      thisWeek: [] as Notification[],
      older: [] as Notification[],
    };

    items.forEach((n) => {
      const d = parseUtc(n.createdAt);
      if (d.toDateString() === todayStr) groups.today.push(n);
      else if (d >= weekAgo) groups.thisWeek.push(n);
      else groups.older.push(n);
    });
    return groups;
  };

  const groupedNotifications = groupByDate(filteredNotifications);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      markAsRead({ variables: { id: notification.id } });
    }

    const { entityType, entityId, metadata } = notification;
    const warehouseSlug = getStringMetadataValue(metadata, 'warehouseSlug');
    const warehouseId = getStringMetadataValue(metadata, 'warehouseId');

    if (!companySlug) return;

    switch (entityType) {
      case 'GRN':
        router.push(`/${companySlug}/purchase/grn/${entityId}`);
        break;
      case 'Issue':
        if (warehouseSlug) router.push(`/${companySlug}/warehouses/${warehouseSlug}/issues`);
        break;
      case 'Transfer':
        router.push(`/${companySlug}/transfers/${entityId}`);
        break;
      case 'Product':
        if (warehouseId) router.push(`/${companySlug}/inventory/products`);
        break;
      case 'StockLot':
        if (warehouseSlug)
          router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/reports`);
        break;
      case 'Adjustment':
        if (warehouseSlug)
          router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/reports`);
        else router.push(`/${companySlug}/inventory/products`);
        break;
      case 'User':
      case 'Role':
        router.push(`/${companySlug}/settings?tab=team`);
        break;
      case 'Warehouse':
        router.push(`/${companySlug}/warehouses`);
        break;
      default:
        break;
    }
  };

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-1">
        <p className="px-5 pt-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className="divide-y">
          {items.map((n) => {
            const isUnread = !n.readAt;
            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(n)}
                onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)}
                className={`group flex gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  isUnread ? 'bg-muted/30' : ''
                }`}
              >
                {/* Severity dot */}
                <span className="relative mt-2 shrink-0">
                  <span
                    className={`block h-2 w-2 rounded-full ${SEVERITY_DOT[n.severity] || SEVERITY_DOT.INFO}`}
                  />
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-sm leading-snug ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground/60 whitespace-nowrap mt-0.5">
                      {formatDistanceToNow(parseUtc(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <span className="inline-block mt-1.5 text-[11px] text-muted-foreground/50 capitalize">
                    {n.type.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>

                {/* Mark-as-read button */}
                {isUnread && (
                  <button
                    type="button"
                    className="self-center shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted transition-all"
                    title="Mark as read"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead({ variables: { id: n.id } });
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}

                {/* Unread indicator */}
                {isUnread && (
                  <span className="self-center shrink-0 w-2 h-2 rounded-full bg-foreground group-hover:hidden" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasActiveFilters = queryFilters.severity || queryFilters.types.length > 0;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1 text-sm">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                setRefreshing(true);
                try {
                  await refetch();
                } finally {
                  setRefreshing(false);
                }
              }}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            {unreadCount > 0 && (
              <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
                <Check className="h-4 w-4 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => {
            const next: TabFilter = v === 'unread' || v === 'critical' || v === 'all' ? v : 'all';
            setFilter(next);
            router.replace(buildNotificationsUrl({ filter: next === 'all' ? null : next }));
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-[11px] px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Active query-param filters banner */}
                {hasActiveFilters && (
                  <div className="px-5 py-3 border-b flex items-center justify-between bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      Filtered by{' '}
                      {queryFilters.severity && (
                        <span className="font-medium text-foreground">
                          severity: {queryFilters.severity}
                        </span>
                      )}
                      {queryFilters.severity && queryFilters.types.length > 0 && ' · '}
                      {queryFilters.types.length > 0 && (
                        <span className="font-medium text-foreground">
                          type: {queryFilters.types.join(', ')}
                        </span>
                      )}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => router.push(`/${companySlug}/notifications`)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* Content */}
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-foreground/70">
                      {filter === 'unread'
                        ? 'All caught up'
                        : filter === 'critical'
                          ? 'No critical alerts'
                          : 'No notifications yet'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filter === 'unread'
                        ? 'You have no unread notifications'
                        : filter === 'critical'
                          ? 'No critical notifications at this time'
                          : 'Notifications will appear here as activity happens'}
                    </p>
                  </div>
                ) : (
                  <>
                    {renderGroup('Today', groupedNotifications.today)}
                    {renderGroup('This Week', groupedNotifications.thisWeek)}
                    {renderGroup('Older', groupedNotifications.older)}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <CompanyGuard>
      <NotificationsPageContent />
    </CompanyGuard>
  );
}
