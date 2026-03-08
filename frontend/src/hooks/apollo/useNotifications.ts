import { useQuery, useMutation } from '@apollo/client';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_COUNT,
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  NOTIFICATION_FRAGMENT,
  GET_NOTIFICATIONS_CONNECTION,
} from '@/lib/graphql';
import { useCursorPagination } from './useCursorPagination';
import type { CursorPaginationInput } from '@/types/pagination';

export function useNotifications(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_NOTIFICATIONS, {
    variables,
    fetchPolicy: 'network-only',
  });
}

export function useNotificationsConnection(input?: CursorPaginationInput) {
  return useCursorPagination(
    GET_NOTIFICATIONS_CONNECTION,
    'notificationsConnection',
    { variables: { input: input ?? { first: 20 } }, fetchPolicy: 'cache-and-network' },
  );
}

export function useUnreadNotificationCount() {
  return useQuery(GET_UNREAD_COUNT, {
    fetchPolicy: 'network-only',
    pollInterval: 30_000,
  });
}

export function useMarkNotificationAsRead() {
  return useMutation(MARK_AS_READ, {
    optimisticResponse({ id }) {
      return {
        markNotificationAsRead: {
          __typename: 'Notification',
          id,
          type: '',
          severity: '',
          entityType: null,
          entityId: null,
          title: '',
          message: '',
          metadata: null,
          readAt: new Date().toISOString(),
          createdAt: '',
        },
      };
    },
    update(cache, { data }) {
      if (!data?.markNotificationAsRead) return;
      // Write the readAt into the cached notification
      cache.writeFragment({
        id: cache.identify(data.markNotificationAsRead),
        fragment: NOTIFICATION_FRAGMENT,
        data: data.markNotificationAsRead,
      });
      // Decrement unread count
      cache.modify({
        fields: {
          unreadNotificationCount(existing = 0) {
            return Math.max(0, existing - 1);
          },
        },
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  return useMutation(MARK_ALL_AS_READ, {
    optimisticResponse: { markAllNotificationsAsRead: 0 },
    update(cache) {
      cache.modify({
        fields: {
          unreadNotificationCount() {
            return 0;
          },
          // Mark every cached notification as read
          notifications(existing = [], { readField }) {
            existing.forEach((ref: any) => {
              const notifId = readField('id', ref) as string;
              if (notifId) {
                cache.modify({
                  id: `Notification:${notifId}`,
                  fields: {
                    readAt() {
                      return new Date().toISOString();
                    },
                  },
                });
              }
            });
            return existing;
          },
        },
      });
    },
  });
}
