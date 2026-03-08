import { gql } from '@apollo/client';
import { PRODUCT_LIST_FRAGMENT } from './fragments/product.fragment';
import {
  PURCHASE_ORDER_LIST_FRAGMENT,
} from './fragments/purchaseOrder.fragment';
import { NOTIFICATION_FRAGMENT } from './notifications';

/** Shared PageInfo fields for all connection queries */
const PAGE_INFO_FRAGMENT = gql`
  fragment CursorPageInfoFields on CursorPageInfo {
    hasNextPage
    endCursor
    totalCount
  }
`;

// ── Products Connection ──

export const GET_PRODUCTS_CONNECTION = gql`
  query GetProductsConnection($input: CursorPaginationInput) {
    productsConnection(input: $input) {
      edges {
        cursor
        node {
          ...ProductList
        }
      }
      pageInfo {
        ...CursorPageInfoFields
      }
    }
  }
  ${PRODUCT_LIST_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

// ── Notifications Connection ──

export const GET_NOTIFICATIONS_CONNECTION = gql`
  query GetNotificationsConnection($input: CursorPaginationInput) {
    notificationsConnection(input: $input) {
      edges {
        cursor
        node {
          ...NotificationFields
        }
      }
      pageInfo {
        ...CursorPageInfoFields
      }
    }
  }
  ${NOTIFICATION_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

// ── Purchase Orders Connection ──

export const GET_PURCHASE_ORDERS_CONNECTION = gql`
  query GetPurchaseOrdersConnection($input: CursorPaginationInput) {
    purchaseOrdersConnection(input: $input) {
      edges {
        cursor
        node {
          ...PurchaseOrderList
        }
      }
      pageInfo {
        ...CursorPageInfoFields
      }
    }
  }
  ${PURCHASE_ORDER_LIST_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

// ── Stock Movements Connection ──

export const GET_STOCK_MOVEMENTS_CONNECTION = gql`
  query GetStockMovementsConnection($input: CursorPaginationInput) {
    stockMovementsConnection(input: $input) {
      edges {
        cursor
        node {
          id
          type
          quantity
          previous_quantity
          new_quantity
          reason
          reference_id
          reference_type
          user_role
          created_at
          product {
            id
            name
            sku
          }
          warehouse {
            id
            name
          }
          user {
            id
            fullName
          }
        }
      }
      pageInfo {
        ...CursorPageInfoFields
      }
    }
  }
  ${PAGE_INFO_FRAGMENT}
`;

// ── Audit Logs Connection ──

export const GET_AUDIT_LOGS_CONNECTION = gql`
  query GetAuditLogsConnection(
    $filters: AuditLogFilterInput
    $input: CursorPaginationInput
  ) {
    auditLogsConnection(filters: $filters, input: $input) {
      edges {
        cursor
        node {
          id
          created_at
          actor_user_id
          actor_email
          actor_role
          action
          entity_type
          entity_id
          metadata
          ip_address
          user_agent
        }
      }
      pageInfo {
        ...CursorPageInfoFields
      }
    }
  }
  ${PAGE_INFO_FRAGMENT}
`;
