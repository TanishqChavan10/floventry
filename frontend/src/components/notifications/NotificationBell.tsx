'use client';

import React, { useState } from 'react';
import { Bell, Check, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/apollo';
import { formatDistanceToNow } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';

/** Ensure a timestamp string is parsed as UTC (appends 'Z' if missing). */
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
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;
  const [isOpen, setIsOpen] = useState(false);

  // Poll unread count every 30 seconds (PRECISE - count only)
  const { data: countData } = useUnreadNotificationCount();

  // Load recent notifications ONLY when dropdown opens (NO polling)
  const { data: notificationsData, refetch: refetchNotifications } = useNotifications({
    limit: 5,
    offset: 0,
  });

  const [markAsRead] = useMarkNotificationAsRead();
  const [markAllAsRead] = useMarkAllNotificationsAsRead();

  const unreadCount = countData?.unreadNotificationCount || 0;
  const notifications: Notification[] = notificationsData?.notifications || [];

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.readAt) {
      await markAsRead({ variables: { id: notification.id } });
    }

    // Navigate to notifications page
    if (companySlug) {
      router.push(`/${companySlug}/notifications`);
    }
    setIsOpen(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'INFO':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-l-4 border-l-red-600 bg-red-50 dark:bg-red-950/10';
      case 'WARNING':
        return 'border-l-4 border-l-yellow-600 bg-yellow-50 dark:bg-yellow-950/10';
      case 'INFO':
      default:
        return 'border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-950/10';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No notifications yet
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 cursor-pointer ${getSeverityColor(notification.severity)} ${
                  !notification.readAt ? 'font-semibold' : ''
                }`}
              >
                <div className="flex gap-3 items-start w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(notification.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(parseUtc(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <button
                      type="button"
                      className="shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-muted transition-colors"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead({ variables: { id: notification.id } });
                      }}
                    >
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <Button
          variant="ghost"
          className="w-full justify-center text-sm"
          onClick={() => {
            if (companySlug) {
              router.push(`/${companySlug}/notifications`);
            }
            setIsOpen(false);
          }}
        >
          View all notifications
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
