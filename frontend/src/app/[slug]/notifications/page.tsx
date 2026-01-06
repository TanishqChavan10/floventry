'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT, MARK_AS_READ, MARK_ALL_AS_READ } from '@/lib/graphql/notifications';

interface Notification {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  metadata: any;
  readAt: string | null;
  createdAt: string;
}

function NotificationsPageContent() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;

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
      const createdAt = new Date(n.createdAt);
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
    
    if (!companySlug) return;
    
    switch (entityType) {
      case 'GRN':
        router.push(`/${companySlug}/purchase/grn/${entityId}`);
        break;
      case 'Issue':
        if (metadata?.warehouseSlug) {
          router.push(`/${companySlug}/warehouses/${metadata.warehouseSlug}/issues`);
        }
        break;
      case 'Transfer':
        router.push(`/${companySlug}/transfers/${entityId}`);
        break;
      case 'Product':
        if (metadata?.warehouseId) {
          router.push(`/${companySlug}/inventory/products`);
        }
        break;
      case 'StockLot':
        if (metadata?.warehouseSlug) {
          router.push(`/${companySlug}/warehouses/${metadata.warehouseSlug}/inventory/reports`);
        }
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
    const variants: Record<string, any> = {
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
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(notification.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={`text-sm ${!notification.readAt ? 'font-semibold' : 'font-medium'}`}>
                      {notification.title}
                    </h4>
                    {getSeverityBadge(notification.severity)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <span className="capitalize">{notification.type.replace(/_/g, ' ').toLowerCase()}</span>
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
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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
                {notifications.filter(n => n.severity === 'CRITICAL').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center text-slate-500">Loading...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {filter === 'unread' ? 'No unread notifications' : filter === 'critical' ? 'No critical notifications' : 'No notifications yet'}
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
