import { gql } from "@apollo/client";

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
      company_id
      name
      logo_url
      created_at
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
      warehouses {
        id
        name
        slug
      }
      settings {
        id
        currency
        timezone
        language
        # Inventory
        low_stock_threshold
        expiry_warning_days
        enable_expiry_tracking
        allow_negative_stock
        stock_valuation_method
        # PO
        po_require_approval
        po_approval_threshold
        po_auto_receive
        po_default_payment_terms
        # Notifications
        notify_low_stock
        notify_expiry
        notify_po_status
        notify_transfers
        # Access
        default_user_role
        restrict_manager_catalog
        restrict_staff_stock
        session_timeout_minutes
        # Audit
        enable_audit_logs
        audit_retention_days
        track_stock_adjustments
      }
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
    }
  }
`;

export const GET_WAREHOUSES_BY_COMPANY = gql`
  query GetWarehousesByCompany($slug: String!) {
    companyBySlug(slug: $slug) {
      id
      warehouses {
        id
        name
        slug
        address
        type
        code
        timezone
        created_at
      }
    }
  }
`;

export const GET_WAREHOUSE_WITH_SETTINGS = gql`
  query GetWarehouse($id: String!) {
    warehouse(id: $id) {
      id
      name
      slug
      description
      type
      code
      timezone
      address
      city
      state
      country
      contact_person
      contact_phone
      status
      is_default
      settings {
        id
        low_stock_threshold
        expiry_warning_days
        allow_negative_stock
        allow_inbound_transfers
        allow_outbound_transfers
        require_transfer_approval
      }
    }
  }
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
      id
      name
      slug
      description
      type
      code
      timezone
      address
      city
      state
      country
      contact_person
      contact_phone
      status
      is_default
    }
  }
`;

export const UPDATE_WAREHOUSE_SETTINGS = gql`
  mutation UpdateWarehouseSettings($warehouseId: String!, $input: UpdateWarehouseSettingsInput!) {
    updateWarehouseSettings(warehouseId: $warehouseId, input: $input) {
      id
      low_stock_threshold
      expiry_warning_days
      allow_negative_stock
      allow_inbound_transfers
      allow_outbound_transfers
      require_transfer_approval
    }
  }
`;

