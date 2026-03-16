'use client';

import { useParams } from 'next/navigation';
import { useCompanyBySlug } from '@/hooks/apollo';

export type PlanTier = 'Free' | 'Standard' | 'Pro';

export interface UsePlanTierReturn {
  /** Current plan tier for the active company. */
  plan: PlanTier;
  /** Whether the company is on the Pro plan. */
  isPro: boolean;
  /** Whether the company is on the Free plan. */
  isFree: boolean;
  /** Date when the subscription will cancel, if applicable. */
  cancelAt: Date | null;
  /** Loading state while fetching company data. */
  loading: boolean;
}

/**
 * Returns the current company's plan tier.
 */
export function usePlanTier(): UsePlanTierReturn {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const { data, loading } = useCompanyBySlug(slug ?? '');
  const planRaw = data?.companyBySlug?.settings?.plan ?? 'FREE';
  // Map backend plan to frontend PlanTier
  let plan: PlanTier = 'Free';
  if (planRaw === 'PRO') plan = 'Pro';
  else if (planRaw === 'STANDARD') plan = 'Standard';
  else plan = 'Free';

  const cancelAtRaw = data?.companyBySlug?.settings?.cancel_at;
  const cancelAt = cancelAtRaw ? new Date(cancelAtRaw) : null;

  return {
    plan,
    isPro: plan === 'Pro',
    isFree: plan === 'Free',
    cancelAt,
    loading,
  };
}
