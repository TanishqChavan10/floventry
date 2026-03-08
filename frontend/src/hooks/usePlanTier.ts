'use client';

import { useParams } from 'next/navigation';
import { useCompanyBySlug } from '@/hooks/apollo';

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
 * Returns the current company's plan tier.
 *
 * Monetization is not enabled yet, so all companies behave as Pro.
 */
export function usePlanTier(): UsePlanTierReturn {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const { data, loading } = useCompanyBySlug(slug ?? '');

  // Keep the query for cache warming / other consumers, but do not gate features.
  void data;

  return {
    plan: 'Pro',
    isPro: true,
    loading,
  };
}
