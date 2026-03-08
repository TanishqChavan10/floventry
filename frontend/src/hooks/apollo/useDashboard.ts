import { useQuery } from '@apollo/client';
import { GET_COMPANY_DASHBOARD } from '@/lib/graphql/company-dashboard';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/dashboard';
import {
  GET_COMPANY_STATS,
} from '@/lib/graphql/company';

export function useCompanyDashboard() {
  return useQuery(GET_COMPANY_DASHBOARD, {
    fetchPolicy: 'cache-and-network',
  });
}

export function useDashboardStats(variables?: {
  supplierStatus?: string;
  shipmentLimit?: number;
  expiringDays?: number;
}) {
  return useQuery(GET_DASHBOARD_STATS, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
}

export function useCompanyStats(companyId: string) {
  return useQuery(GET_COMPANY_STATS, {
    variables: { companyId },
    skip: !companyId,
    fetchPolicy: 'cache-and-network',
  });
}
