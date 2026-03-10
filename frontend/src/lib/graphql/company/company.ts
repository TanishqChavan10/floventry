import { gql } from "@apollo/client";
import { WAREHOUSE_LIST_FRAGMENT, WAREHOUSE_SLUG_FRAGMENT, WAREHOUSE_DETAIL_FRAGMENT, WAREHOUSE_REF_FRAGMENT } from '../fragments/warehouse.fragment';

export const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      id
      name
      description
      logo_url
      created_at
      slug
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

export const GET_USER_COMPANIES = gql`
  query GetUserCompanies {
    companies {
      id
      name
      logo_url
      created_at
    }
  }
`;

export const GET_MY_COMPANIES = gql`
  query GetMyCompanies {
    myCompanies {
      membership_id
      role
      status
      joined_at
      warehouseCount
      company {
        id
        name
        company_type
        logo_url
      }
    }
  }
`;

export const GET_COMPANY_BY_SLUG = gql`
  query GetCompanyBySlug($slug: String!) {
    companyBySlug(slug: $slug) {
      id
      name
      slug
      created_at
      logo_url
      description
      website
      company_type
      legal_name
      address_line1
      address_line2
      city
      state
      country
      gst_number
      phone
      email
      industry
      barcodePrefix
      barcodePadding
      barcodeNextNumber
      barcodeSuffix
      warehouses {
        ...WarehouseSlug
      }
      settings {
        id
          plan
        currency
        timezone
        # Inventory
        low_stock_threshold
        expiry_warning_days
        enable_expiry_tracking
        allow_negative_stock
        stock_valuation_method
        # Access
        restrict_manager_catalog
      }
    }
  }
  ${WAREHOUSE_SLUG_FRAGMENT}
`;

export const UPDATE_COMPANY_BARCODE_SETTINGS = gql`
  mutation UpdateCompanyBarcodeSettings(
    $companyId: String!
    $input: UpdateCompanyBarcodeSettingsInput!
  ) {
    updateCompanyBarcodeSettings(companyId: $companyId, input: $input) {
      id
      barcodePrefix
      barcodePadding
      barcodeNextNumber
      barcodeSuffix
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: String!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      legal_name
      company_type
      address_line1
      gst_number
    }
  }
`;

export const UPDATE_COMPANY_SETTINGS = gql`
  mutation UpdateCompanySettings($companyId: String!, $input: UpdateCompanySettingsInput!) {
    updateCompanySettings(companyId: $companyId, input: $input) {
      id
      currency
      timezone
      low_stock_threshold
      enable_expiry_tracking
      expiry_warning_days
      restrict_manager_catalog
    }
  }
`;

export const GET_WAREHOUSES_BY_COMPANY = gql`
  query GetWarehousesByCompany($slug: String!) {
    companyBySlug(slug: $slug) {
      id
      warehouses {
        ...WarehouseList
      }
    }
  }
  ${WAREHOUSE_LIST_FRAGMENT}
`;

export const GET_WAREHOUSE_WITH_SETTINGS = gql`
  query GetWarehouse($id: String!) {
    warehouse(id: $id) {
      ...WarehouseDetail
    }
  }
  ${WAREHOUSE_DETAIL_FRAGMENT}
`;

export const CREATE_WAREHOUSE = gql`
  mutation CreateWarehouse($input: CreateWarehouseInput!) {
    createWarehouse(input: $input) {
      id
      name
      slug
      type
      address
      code
      timezone
      created_at
    }
  }
`;

export const UPDATE_WAREHOUSE = gql`
  mutation UpdateWarehouse($id: String!, $input: UpdateWarehouseInput!) {
    updateWarehouse(id: $id, input: $input) {
      ...WarehouseDetail
    }
  }
  ${WAREHOUSE_DETAIL_FRAGMENT}
`;

export const UPDATE_WAREHOUSE_SETTINGS = gql`
  mutation UpdateWarehouseSettings($warehouseId: String!, $input: UpdateWarehouseSettingsInput!) {
    updateWarehouseSettings(warehouseId: $warehouseId, input: $input) {
      id
    }
  }
`;

export const GET_COMPANY_STATS = gql`
  query GetCompanyStats($companyId: String!) {
    companyStats(companyId: $companyId) {
      totalStaff
      totalInventoryValue
    }
  }
`;

export const DELETE_WAREHOUSE = gql`
  mutation DeleteWarehouse($id: ID!) {
    deleteWarehouse(id: $id)
  }
`;

export const ASSIGN_USER_TO_WAREHOUSE = gql`
  mutation AssignUserToWarehouse($warehouseId: ID!, $input: AssignUserToWarehouseInput!) {
    assignUserToWarehouse(warehouseId: $warehouseId, input: $input) {
      id
      userId
      warehouseId
      role
      isManagerOfWarehouse
      createdAt
    }
  }
`;

export const REMOVE_USER_FROM_WAREHOUSE = gql`
  mutation RemoveUserFromWarehouse($warehouseId: ID!, $userId: ID!) {
    removeUserFromWarehouse(warehouseId: $warehouseId, userId: $userId)
  }
`;

export const GET_WAREHOUSE_MEMBERS = gql`
  query GetWarehouseMembers($warehouseId: String!) {
    warehouseMembers(warehouseId: $warehouseId) {
      userId
      email
      fullName
      role
      isManager
    }
  }
`;

export const REACTIVATE_WAREHOUSE = gql`
  mutation ReactivateWarehouse($id: ID!) {
    reactivateWarehouse(id: $id) {
      id
      name
      status
    }
  }
`;
