import { gql } from '@apollo/client';

export const GLOBAL_SEARCH = gql`
  query GlobalSearch($query: String!) {
    globalSearch(query: $query) {
      products {
        id
        name
        sku
        barcode
      }
      warehouses {
        id
        name
        status
        slug
        code
      }
      documents {
        id
        type
        number
      }
    }
  }
`;

export const GET_GRN_FOR_REDIRECT = gql`
  query GetGrnForRedirect($id: String!) {
    grn(id: $id) {
      id
      grn_number
      warehouse {
        id
        slug
        status
      }
    }
  }
`;

export const GET_ISSUE_FOR_REDIRECT = gql`
  query GetIssueForRedirect($id: ID!) {
    issueNote(id: $id) {
      id
      issue_number
      warehouse {
        id
        slug
        status
      }
    }
  }
`;

export const GET_TRANSFER_FOR_REDIRECT = gql`
  query GetTransferForRedirect($id: String!) {
    warehouseTransfer(id: $id) {
      id
      transfer_number
      source_warehouse {
        id
        slug
        status
      }
      destination_warehouse {
        id
        slug
        status
      }
    }
  }
`;
