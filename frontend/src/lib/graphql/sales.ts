import { gql } from '@apollo/client';

export const SALES_ORDER_FRAGMENT = gql`
  fragment SalesOrderFields on SalesOrder {
    id
    customer_name
    status
    expected_dispatch_date
    created_at
    updated_at
    creator {
      id
      fullName
    }
    items {
      id
      product {
        id
        name
        sku
        unit
      }
      ordered_quantity
      issued_quantity
      pending_quantity
    }
  }
`;

export const GET_SALES_ORDERS = gql`
  ${SALES_ORDER_FRAGMENT}
  query GetSalesOrders {
    salesOrders {
      ...SalesOrderFields
    }
  }
`;

export const GET_SALES_ORDER = gql`
  ${SALES_ORDER_FRAGMENT}
  query GetSalesOrder($id: ID!) {
    salesOrder(id: $id) {
      ...SalesOrderFields
    }
  }
`;

export const CREATE_SALES_ORDER = gql`
  ${SALES_ORDER_FRAGMENT}
  mutation CreateSalesOrder($input: CreateSalesOrderInput!) {
    createSalesOrder(input: $input) {
      ...SalesOrderFields
    }
  }
`;

export const UPDATE_SALES_ORDER = gql`
  ${SALES_ORDER_FRAGMENT}
  mutation UpdateSalesOrder($id: ID!, $input: UpdateSalesOrderInput!) {
    updateSalesOrder(id: $id, input: $input) {
      ...SalesOrderFields
    }
  }
`;

export const CONFIRM_SALES_ORDER = gql`
  ${SALES_ORDER_FRAGMENT}
  mutation ConfirmSalesOrder($id: ID!) {
    confirmSalesOrder(id: $id) {
      ...SalesOrderFields
    }
  }
`;

export const CANCEL_SALES_ORDER = gql`
  ${SALES_ORDER_FRAGMENT}
  mutation CancelSalesOrder($id: ID!) {
    cancelSalesOrder(id: $id) {
      ...SalesOrderFields
    }
  }
`;
