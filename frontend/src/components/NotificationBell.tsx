'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_URL } from '@/config/env';

export default function NotificationBell() {
  const { getToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        const unread = json.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchUnreadCount();
    // Poll every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [getToken]);

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
