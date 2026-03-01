import { gql } from '@apollo/client';

export const GET_WAREHOUSE_TRANSFERS = gql`
  query GetWarehouseTransfers($filters: TransferFilterInput!) {
    warehouseTransfers(filters: $filters) {
      id
      transfer_number
      status
      source_warehouse {
        id
        name
        slug
      }
      destination_warehouse {
        id
        name
        slug
      }
      items {
        id
        product {
          id
          name
          sku
        }
        quantity
      }
      notes
      user {
        id
        fullName
      }
      user_role
      created_at
      updated_at
    }
  }
`;

export const GET_WAREHOUSE_TRANSFER = gql`
  query GetWarehouseTransfer($id: String!) {
    warehouseTransfer(id: $id) {
      id
      transfer_number
      status
      source_warehouse {
        id
        name
        slug
      }
      destination_warehouse {
        id
        name
        slug
      }
      items {
        id
        product {
          id
          name
          sku
          unit
        }
        quantity
      }
      notes
      user {
        id
        fullName
      }
      user_role
      created_at
      updated_at
    }
  }
`;

export const CREATE_WAREHOUSE_TRANSFER = gql`
  mutation CreateWarehouseTransfer($input: CreateTransferInput!) {
    createWarehouseTransfer(input: $input) {
      id
      transfer_number
      status
      source_warehouse {
        id
        name
      }
      destination_warehouse {
        id
        name
      }
      created_at
    }
  }
`;

export const UPDATE_WAREHOUSE_TRANSFER = gql`
  mutation UpdateWarehouseTransfer($id: String!, $input: UpdateTransferInput!) {
    updateWarehouseTransfer(id: $id, input: $input) {
      id
      transfer_number
      status
    }
  }
`;

export const POST_WAREHOUSE_TRANSFER = gql`
  mutation PostWarehouseTransfer($id: String!) {
    postWarehouseTransfer(id: $id) {
      id
      transfer_number
      status
    }
  }
`;

export const CANCEL_WAREHOUSE_TRANSFER = gql`
  mutation CancelWarehouseTransfer($id: String!) {
    cancelWarehouseTransfer(id: $id) {
      id
      transfer_number
      status
    }
  }
`;
