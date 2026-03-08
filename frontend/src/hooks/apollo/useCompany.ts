import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_COMPANY,
  SWITCH_COMPANY,
  GET_USER_COMPANIES,
  GET_MY_COMPANIES,
  GET_COMPANY_BY_SLUG,
  UPDATE_COMPANY,
  UPDATE_COMPANY_SETTINGS,
  UPDATE_COMPANY_BARCODE_SETTINGS,
} from '@/lib/graphql/company';
import { GET_COMPANY_SETTINGS } from '@/lib/graphql/settings';

// ── Company Queries ──

export function useUserCompanies() {
  return useQuery(GET_USER_COMPANIES, { fetchPolicy: 'cache-and-network' });
}

export function useMyCompanies() {
  return useQuery(GET_MY_COMPANIES, { fetchPolicy: 'cache-and-network' });
}

export function useCompanyBySlug(slug: string) {
  return useQuery(GET_COMPANY_BY_SLUG, {
    variables: { slug },
    skip: !slug,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCompanySettings(id: string) {
  return useQuery(GET_COMPANY_SETTINGS, {
    variables: { id },
    skip: !id,
  });
}

// ── Company Mutations ──

export function useCreateCompany() {
  return useMutation(CREATE_COMPANY);
}

export function useSwitchCompany() {
  return useMutation(SWITCH_COMPANY);
}

export function useUpdateCompany() {
  return useMutation(UPDATE_COMPANY);
}

export function useUpdateCompanySettings() {
  return useMutation(UPDATE_COMPANY_SETTINGS);
}

export function useUpdateCompanyBarcodeSettings() {
  return useMutation(UPDATE_COMPANY_BARCODE_SETTINGS);
}
