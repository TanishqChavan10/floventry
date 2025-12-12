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

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: String!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      phone
      email
      website
    }
  }
`;

export const GET_UNITS = gql`
  query GetUnits {
    units {
      id
      name
      shortCode
      isDefault
    }
  }
`;

export const CREATE_UNIT = gql`
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      id
      name
      shortCode
      isDefault
    }
  }
`;

export const DELETE_UNIT = gql`
  mutation RemoveUnit($id: String!) {
    removeUnit(id: $id)
  }
`;

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
