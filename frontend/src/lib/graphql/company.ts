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
    }
  }
`;
