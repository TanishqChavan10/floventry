'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import CompanyGuard from '@/components/CompanyGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/** Ensure a timestamp string is parsed as UTC (appends 'Z' if missing). */
function parseUtc(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_COUNT,
  MARK_AS_READ,
  MARK_ALL_AS_READ,
} from '@/lib/graphql/notifications';

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
        ? (filterRaw as 'all' | 'unread' | 'critical')
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

    // If the URL specifies a filter, or implies it via severity/type, initialize the UI state.
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

  // Fetch notifications (NO polling - load on demand only)
  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: pageSize, offset: page * pageSize },
  });

  // Get unread count
  const { data: countData } = useQuery(GET_UNREAD_COUNT);

  const [markAsRead] = useMutation(MARK_AS_READ, {
    onCompleted: () => refetch(),
  });

  const [markAllAsRead] = useMutation(MARK_ALL_AS_READ, {
    onCompleted: () => refetch(),
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = countData?.unreadNotificationCount || 0;

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.readAt;
    if (filter === 'critical') return n.severity === 'CRITICAL';
    if (queryFilters.severity && n.severity !== queryFilters.severity) return false;
    if (queryFilters.types.length > 0 && !queryFilters.types.includes(n.type)) return false;
    return true;
  });

  // Group by date
  const groupByDate = (notifications: Notification[]) => {
    const today = new Date();
    const todayStr = today.toDateString();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Notification[],
      thisWeek: [] as Notification[],
      older: [] as Notification[],
    };

    notifications.forEach((n) => {
      const createdAt = parseUtc(n.createdAt);
      if (createdAt.toDateString() === todayStr) {
        groups.today.push(n);
      } else if (createdAt >= weekAgo) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupByDate(filteredNotifications);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.readAt) {
      markAsRead({ variables: { id: notification.id } });
    }

    // Deep-link navigation based on entity type
    const { entityType, entityId, metadata } = notification;
    const warehouseSlug = getStringMetadataValue(metadata, 'warehouseSlug');
    const warehouseId = getStringMetadataValue(metadata, 'warehouseId');

    if (!companySlug) return;

    switch (entityType) {
      case 'GRN':
        router.push(`/${companySlug}/purchase/grn/${entityId}`);
        break;
      case 'Issue':
        if (warehouseSlug) {
          router.push(`/${companySlug}/warehouses/${warehouseSlug}/issues`);
        }
        break;
      case 'Transfer':
        router.push(`/${companySlug}/transfers/${entityId}`);
        break;
      case 'Product':
        if (warehouseId) {
          router.push(`/${companySlug}/inventory/products`);
        }
        break;
      case 'StockLot':
        if (warehouseSlug) {
          router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/reports`);
        }
        break;
      case 'Adjustment':
        if (warehouseSlug) {
          router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/reports`);
        } else {
          router.push(`/${companySlug}/inventory/products`);
        }
        break;
      case 'User':
      case 'Role':
        router.push(`/${companySlug}/settings?tab=team`);
        break;
      case 'Warehouse':
        router.push(`/${companySlug}/warehouses`);
        break;
      default:
        // Fallback to notifications page
        break;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'INFO':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'destructive' | 'secondary' | 'default'> = {
      CRITICAL: 'destructive',
      WARNING: 'secondary',
      INFO: 'default',
    };
    return (
      <Badge variant={variants[severity] || 'default'} className="text-xs">
        {severity}
      </Badge>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-l-4 border-l-red-600 hover:bg-red-50 dark:hover:bg-red-950/10';
      case 'WARNING':
        return 'border-l-4 border-l-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/10';
      case 'INFO':
      default:
        return 'border-l-4 border-l-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/10';
    }
  };

  const renderNotificationGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 px-4">
          {title}
        </h3>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 cursor-pointer transition-colors ${getSeverityColor(notification.severity)} ${
                !notification.readAt ? 'bg-slate-50 dark:bg-slate-900' : ''
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 mt-1">{getSeverityIcon(notification.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-sm ${!notification.readAt ? 'font-semibold' : 'font-medium'}`}
                    >
                      {notification.title}
                    </h4>
                    {getSeverityBadge(notification.severity)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {formatDistanceToNow(parseUtc(notification.createdAt), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span className="capitalize">
                      {notification.type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
                {!notification.readAt && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Stay updated on your inventory operations
            </p>
          </div>
          <div className="flex gap-2">
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
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            {unreadCount > 0 && (
              <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {notifications.filter((n) => n.severity === 'CRITICAL').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => {
            const next: TabFilter = v === 'unread' || v === 'critical' || v === 'all' ? v : 'all';
            setFilter(next);
            // Keep tab selection reflected in the URL for shareable deep links.
            router.replace(buildNotificationsUrl({ filter: next === 'all' ? null : next }));
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread{' '}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            <Card>
              <CardContent className="p-0">
                {(queryFilters.severity || queryFilters.types.length > 0) && (
                  <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Filtered by{' '}
                      {queryFilters.severity && (
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          severity: {queryFilters.severity}
                        </span>
                      )}
                      {queryFilters.severity && queryFilters.types.length > 0 && <span> • </span>}
                      {queryFilters.types.length > 0 && (
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          type: {queryFilters.types.join(', ')}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/${companySlug}/notifications`)}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
                {loading ? (
                  <div className="p-12 text-center text-slate-500">Loading...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {filter === 'unread'
                        ? 'No unread notifications'
                        : filter === 'critical'
                          ? 'No critical notifications'
                          : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="py-4">
                    {renderNotificationGroup('Today', groupedNotifications.today)}
                    {renderNotificationGroup('This Week', groupedNotifications.thisWeek)}
                    {renderNotificationGroup('Older', groupedNotifications.older)}
                  </div>
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
