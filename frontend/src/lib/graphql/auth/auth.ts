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

// CREATE_COMPANY → canonical in company/company.ts
// SWITCH_COMPANY → canonical in company/company.ts
// ACCEPT_INVITE  → canonical in invite.ts

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