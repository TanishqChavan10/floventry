'use client';

import React, { useState, useMemo } from 'react';
import { Bell, Check, CircleAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/apollo';
import { formatDistanceToNow } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';

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

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  WARNING: 'bg-amber-500',
  INFO: 'bg-blue-500',
};

export default function NotificationBell() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;
  const [isOpen, setIsOpen] = useState(false);

  const { data: countData } = useUnreadNotificationCount();
  const { data: notificationsData } = useNotifications({ limit: 5, offset: 0 });
  const [markAsRead] = useMarkNotificationAsRead();
  const [markAllAsRead] = useMarkAllNotificationsAsRead();

  const unreadCount = countData?.unreadNotificationCount || 0;
  const notifications: Notification[] = useMemo(() => {
    const raw: Notification[] = notificationsData?.notifications || [];
    const seen = new Set<string>();
    return raw.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [notificationsData]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markAsRead({ variables: { id: notification.id } });
    }
    if (companySlug) {
      router.push(`/${companySlug}/notifications`);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-90 p-0 rounded-xl shadow-lg border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-85 overflow-y-auto divide-y">
            {notifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    isUnread ? 'bg-muted/30' : ''
                  }`}
                >
                  {/* Severity dot */}
                  <span className="relative mt-1.5 shrink-0">
                    <span
                      className={`block h-2 w-2 rounded-full ${SEVERITY_DOT[notification.severity] || SEVERITY_DOT.INFO}`}
                    />
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug truncate ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(parseUtc(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Mark as read */}
                  {isUnread && (
                    <button
                      type="button"
                      className="self-center shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead({ variables: { id: notification.id } });
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="border-t px-4 py-2.5">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              if (companySlug) router.push(`/${companySlug}/notifications`);
              setIsOpen(false);
            }}
          >
            View all notifications
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
