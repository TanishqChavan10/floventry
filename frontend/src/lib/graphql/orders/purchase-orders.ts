import { gql } from '@apollo/client';
import {
  PURCHASE_ORDER_LIST_FRAGMENT,
  PURCHASE_ORDER_DETAIL_FRAGMENT,
} from '../fragments/purchaseOrder.fragment';
import { WAREHOUSE_REF_FRAGMENT } from '../fragments/warehouse.fragment';

// Query to get all purchase orders with filters
export const GET_PURCHASE_ORDERS = gql`
  query GetPurchaseOrders($filters: PurchaseOrderFilterInput!) {
    purchaseOrders(filters: $filters) {
      ...PurchaseOrderList
    }
  }
  ${PURCHASE_ORDER_LIST_FRAGMENT}
`;

// Query to get single purchase order by ID
export const GET_PURCHASE_ORDER = gql`
  query GetPurchaseOrder($id: String!) {
    purchaseOrder(id: $id) {
      ...PurchaseOrderDetail
    }
  }
  ${PURCHASE_ORDER_DETAIL_FRAGMENT}
`;

// Mutation to create purchase order
export const CREATE_PURCHASE_ORDER = gql`
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(input: $input) {
      id
      po_number
      status
      warehouse {
        ...WarehouseRef
      }
      supplier {
        id
        name
      }
      items {
        id
        product {
          id
          name
        }
        ordered_quantity
      }
      created_at
    }
  }
  ${WAREHOUSE_REF_FRAGMENT}
`;

// Mutation to update purchase order (DRAFT only)
export const UPDATE_PURCHASE_ORDER = gql`
  mutation UpdatePurchaseOrder($id: String!, $input: UpdatePurchaseOrderInput!) {
    updatePurchaseOrder(id: $id, input: $input) {
      id
      po_number
      status
      notes
      supplier {
        id
        name
      }
      items {
        id
        product {
          id
          name
        }
        ordered_quantity
      }
      updated_at
    }
  }
`;

// Mutation to mark purchase order as ORDERED
export const MARK_PURCHASE_ORDER_ORDERED = gql`
  mutation MarkPurchaseOrderOrdered($id: String!) {
    markPurchaseOrderOrdered(id: $id) {
      id
      po_number
      status
      updated_at
    }
  }
`;

// Mutation to cancel purchase order
export const CANCEL_PURCHASE_ORDER = gql`
  mutation CancelPurchaseOrder($id: String!) {
    cancelPurchaseOrder(id: $id) {
      id
      po_number
      status
      updated_at
    }
  }
`;
