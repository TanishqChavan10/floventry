import { gql } from '@apollo/client';

export const ISSUE_NOTE_FRAGMENT = gql`
  fragment IssueNoteFields on IssueNote {
    id
    issue_number
    status
    issued_at
    created_at
    warehouse {
      id
      name
      slug
    }
    sales_order {
      id
      customer_name
      order_number
    }
    issuer {
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
      stock_lot {
        id
        expiry_date
        received_at
      }
      quantity
    }
  }
`;

export const GET_ISSUE_NOTES_BY_WAREHOUSE = gql`
  ${ISSUE_NOTE_FRAGMENT}
  query GetIssueNotesByWarehouse($warehouseId: ID!) {
    issueNotesByWarehouse(warehouseId: $warehouseId) {
      ...IssueNoteFields
    }
  }
`;

export const GET_ISSUE_NOTE = gql`
  ${ISSUE_NOTE_FRAGMENT}
  query GetIssueNote($id: ID!) {
    issueNote(id: $id) {
      ...IssueNoteFields
    }
  }
`;

export const CREATE_ISSUE_NOTE = gql`
  ${ISSUE_NOTE_FRAGMENT}
  mutation CreateIssueNote($input: CreateIssueNoteInput!) {
    createIssueNote(input: $input) {
      ...IssueNoteFields
    }
  }
`;

export const CREATE_ISSUE_NOTE_WITH_FEFO = gql`
  ${ISSUE_NOTE_FRAGMENT}
  mutation CreateIssueNoteWithFEFO($input: CreateFEFOIssueNoteInput!) {
    createIssueNoteWithFEFO(input: $input) {
      ...IssueNoteFields
    }
  }
`;

export const UPDATE_ISSUE_NOTE = gql`
  ${ISSUE_NOTE_FRAGMENT}
  mutation UpdateIssueNote($id: ID!, $input: UpdateIssueNoteInput!) {
    updateIssueNote(id: $id, input: $input) {
      ...IssueNoteFields
    }
  }
`;

export const POST_ISSUE_NOTE = gql`
  ${ISSUE_NOTE_FRAGMENT}
  mutation PostIssueNote($id: ID!) {
    postIssueNote(id: $id) {
      ...IssueNoteFields
    }
  }
`;

export const CANCEL_ISSUE_NOTE = gql`
  ${ISSUE_NOTE_FRAGMENT}
  mutation CancelIssueNote($id: ID!) {
    cancelIssueNote(id: $id) {
      ...IssueNoteFields
    }
  }
`;
