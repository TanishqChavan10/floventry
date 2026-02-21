'use client';

import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { GET_COMPANY_BY_SLUG } from '@/lib/graphql/company';

export type PlanTier = 'Standard' | 'Pro';

export interface UsePlanTierReturn {
  /** Current plan tier for the active company. */
  plan: PlanTier;
  /** Whether the company is on the Pro plan. */
  isPro: boolean;
  /** Loading state while fetching company data. */
  loading: boolean;
}

/**
 * Returns the current company's plan tier derived from `is_premium`.
 *  - `is_premium = true`  → Pro
 *  - `is_premium = false`  → Standard
 */
export function usePlanTier(): UsePlanTierReturn {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const { data, loading } = useQuery(GET_COMPANY_BY_SLUG, {
    variables: { slug: slug as string },
    skip: !slug,
    fetchPolicy: 'cache-first',
  });

  const isPremium = Boolean(data?.companyBySlug?.settings?.is_premium);

  return {
    plan: isPremium ? 'Pro' : 'Standard',
    isPro: isPremium,
    loading,
  };
}
