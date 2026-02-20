import { gql } from '@apollo/client';

export const GET_COMPANY_AUDIT_LOGS = gql`
  query CompanyAuditLogs($filters: AuditLogFilterInput, $pagination: PaginationInput) {
    companyAuditLogs(filters: $filters, pagination: $pagination) {
      items {
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
      pageInfo {
        total
        page
        limit
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_COMPANY_MEMBERS = gql`
  query GetCompanyMembers($companyId: String!) {
    companyMembers(companyId: $companyId) {
      user_id
      role
      user {
        email
        fullName
      }
    }
  }
`;
