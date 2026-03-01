import { gql } from '@apollo/client';

export const GET_GRNS = gql`
  query GetGRNs($filters: GRNFilterInput!) {
    grns(filters: $filters) {
      id
      grn_number
      status
      received_at
      notes
      warehouse {
        id
        name
      }
      purchase_order {
        id
        po_number
        supplier {
          id
          name
        }
      }
      user {
        id
        fullName
      }
      user_role
      posted_by_user {
        id
        fullName
      }
      posted_at
      created_at
      updated_at
    }
  }
`;

export const GET_GRN = gql`
  query GetGRN($id: String!) {
    grn(id: $id) {
      id
      grn_number
      status
      received_at
      notes
      warehouse {
        id
        name
      }
      purchase_order {
        id
        po_number
        supplier {
          id
          name
        }
        items {
          id
          ordered_quantity
          received_quantity
          product {
            id
            name
            sku
            unit
          }
        }
      }
      items {
        id
        received_quantity
        product {
          id
          name
          sku
          unit
        }
        purchase_order_item {
          id
          ordered_quantity
          received_quantity
        }
      }
      user {
        id
        fullName
      }
      user_role
      posted_by_user {
        id
        fullName
      }
      posted_at
      created_at
      updated_at
    }
  }
`;

export const CREATE_GRN = gql`
  mutation CreateGRN($input: CreateGRNInput!) {
    createGRN(input: $input) {
      id
      grn_number
      status
      received_at
    }
  }
`;

export const UPDATE_GRN = gql`
  mutation UpdateGRN($id: String!, $input: UpdateGRNInput!) {
    updateGRN(id: $id, input: $input) {
      id
      grn_number
      status
      received_at
    }
  }
`;

export const POST_GRN = gql`
  mutation PostGRN($id: String!) {
    postGRN(id: $id) {
      id
      grn_number
      status
      posted_at
      posted_by_user {
        id
        fullName
      }
    }
  }
`;

export const CANCEL_GRN = gql`
  mutation CancelGRN($id: String!) {
    cancelGRN(id: $id) {
      id
      grn_number
      status
    }
  }
`;
