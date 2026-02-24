import { gql } from '@apollo/client';

//------------------------------------------------------------
// MUTATIONS
//------------------------------------------------------------

export const SEND_INVITE = gql`
  mutation SendInvite($input: SendInviteInput!) {
    sendInvite(input: $input) {
      invite_id
      email
      role
      status
      created_at
      expires_at
    }
  }
`;

export const ACCEPT_INVITE = gql`
  mutation AcceptInvite($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      membership_id
      user_id
      company_id
      role
      status
      joined_at
    }
  }
`;

export const CANCEL_INVITE = gql`
  mutation CancelInvite($inviteId: String!) {
    cancelInvite(inviteId: $inviteId)
  }
`;

//------------------------------------------------------------
// QUERIES
//------------------------------------------------------------

export const VALIDATE_INVITE = gql`
  query ValidateInvite($token: String!) {
    validateInvite(token: $token) {
      email
      companyName
      companySlug
      role
      companyId
      status
    }
  }
`;

export const COMPANY_INVITES = gql`
  query CompanyInvites($companyId: String!) {
    companyInvites(companyId: $companyId) {
      invite_id
      email
      role
      status
      warehouse_ids
      manages_warehouse_ids
      invited_by
      created_at
      expires_at
    }
  }
`;

export const MY_PENDING_INVITES = gql`
  query MyPendingInvites {
    myPendingInvites {
      invite_id
      email
      role
      status
      company_id
      created_at
      expires_at
    }
  }
`;
