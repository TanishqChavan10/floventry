import { gql } from "@apollo/client";

export const GET_CURRENT_USER = gql`
  query Me {
    me {
      id
      clerk_id
      email
      full_name
      avatar_url
      activeCompanyId
      companies {
        id
        name
        slug
        role
        isActive
      }
      warehouses {
        warehouseId
        warehouseName
        warehouseSlug
        isManager
      }
      defaultWarehouseId
      preferences
      created_at
      updated_at
    }
  }
`;

export const UPDATE_PREFERENCES = gql`
  mutation UpdatePreferences($preferences: String!) {
    updatePreferences(preferences: $preferences) {
      id
      preferences
    }
  }
`;

// Company mutations
export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      company_id
      name
      description
      logo_url
      created_at
    }
  }
`;

export const SWITCH_COMPANY = gql`
  mutation SwitchCompany($companyId: String!) {
    switchCompany(companyId: $companyId) {
      success
      activeCompanyId
    }
  }
`;

export const ACCEPT_INVITE = gql`
  mutation AcceptInvite($token: String!) {
    acceptInvite(token: $token) {
      success
      company {
        id
        name
      }
      role
    }
  }
`;

export const JOIN_COMPANY_WITH_CODE = gql`
  mutation JoinCompanyWithCode($code: String!) {
    joinCompanyWithCode(code: $code) {
      success
      company {
        id
        name
      }
      role
    }
  }
`;

export const SWITCH_WAREHOUSE = gql`
  mutation SwitchWarehouse($warehouseId: String!) {
    switchWarehouse(warehouseId: $warehouseId)
  }
`;