import { gql } from '@apollo/client';

export const GET_COMPANY_SETTINGS = gql`
  query GetCompany($id: String!) {
    company(id: $id) {
      id
      name
      logo_url
      industry
      description
      phone
      email
      website
      address_line1
      address_line2
      city
      state
      country
      gst_number
    }
  }
`;

// UPDATE_COMPANY → canonical in company/company.ts
// GET_UNITS      → canonical in catalog/catalog.ts
// CREATE_UNIT    → canonical in catalog/catalog.ts
// DELETE_UNIT    → canonical in catalog/catalog.ts

export const TOGGLE_CATEGORY_ACTIVE = gql`
  mutation ToggleCategoryActive($input: UpdateCategoryInput!) {
    updateCategory(input: $input) {
      id
      isActive
    }
  }
`;

export const TOGGLE_SUPPLIER_ACTIVE = gql`
  mutation ToggleSupplierActive($input: UpdateSupplierInput!) {
    updateSupplier(input: $input) {
      id
      isActive
    }
  }
`;
