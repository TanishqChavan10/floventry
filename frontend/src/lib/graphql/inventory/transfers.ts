import { gql } from '@apollo/client';
import { TRANSFER_LIST_FRAGMENT } from '../fragments/purchaseOrder.fragment';
import { WAREHOUSE_REF_FRAGMENT } from '../fragments/warehouse.fragment';

export const GET_WAREHOUSE_TRANSFERS = gql`
  query GetWarehouseTransfers($filters: TransferFilterInput!) {
    warehouseTransfers(filters: $filters) {
      ...TransferList
    }
  }
  ${TRANSFER_LIST_FRAGMENT}
`;

export const GET_WAREHOUSE_TRANSFER = gql`
  query GetWarehouseTransfer($id: String!) {
    warehouseTransfer(id: $id) {
      ...TransferList
    }
  }
  ${TRANSFER_LIST_FRAGMENT}
`;

export const CREATE_WAREHOUSE_TRANSFER = gql`
  mutation CreateWarehouseTransfer($input: CreateTransferInput!) {
    createWarehouseTransfer(input: $input) {
      id
      transfer_number
      status
      source_warehouse {
        ...WarehouseRef
      }
      destination_warehouse {
        ...WarehouseRef
      }
      created_at
    }
  }
  ${WAREHOUSE_REF_FRAGMENT}
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
