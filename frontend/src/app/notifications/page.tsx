'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { API_URL } from '@/config/env';

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      setNotifications(json);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <Button onClick={markAllAsRead} variant="outline">
          <Check className="mr-2 h-4 w-4" /> Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div>Loading...</div>
        ) : notifications.length === 0 ? (
          <div>No notifications</div>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">{notification.title}</CardTitle>
                  {!notification.isRead && <Badge variant="secondary">New</Badge>}
                </div>
                {!notification.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                    Mark as read
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
