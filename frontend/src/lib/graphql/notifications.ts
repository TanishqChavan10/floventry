import { gql } from '@apollo/client';

export const NOTIFICATION_FRAGMENT = gql`
  fragment NotificationFields on Notification {
    id
    type
    severity
    entityType: entity_type
    entityId: entity_id
    title
    message
    metadata
    readAt: read_at
    createdAt: created_at
  }
`;

export const GET_NOTIFICATIONS = gql`
  ${NOTIFICATION_FRAGMENT}
  query GetNotifications($limit: Int, $offset: Int) {
    notifications(limit: $limit, offset: $offset) {
      ...NotificationFields
    }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query GetUnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_AS_READ = gql`
  ${NOTIFICATION_FRAGMENT}
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      ...NotificationFields
    }
  }
`;

export const MARK_ALL_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;
