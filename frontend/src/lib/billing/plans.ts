export type PlanTier = 'Free' | 'Standard' | 'Pro';

export interface PricingPlan {
  id: 'free' | 'standard' | 'pro';
  name: PlanTier;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  cta: string;
  ctaHref: string;
  ctaStyle: 'outline' | 'filled';
  popular: boolean;
  features: string[];
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Full inventory workflow — no strings attached.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Sign up free',
    ctaHref: '/auth/sign-up',
    ctaStyle: 'outline',
    popular: false,
    features: [
      '100 SKUs',
      '1 warehouse',
      '2 team members',
      '10 suppliers',
      'Full stock workflow',
      'Expiry scanner (30-day window)',
      'In-app notifications',
      'Dashboard & warehouse reports',
      'Barcode lookup',
      'RBAC (all roles)',
      'CSV import (products)',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Automation, exports, and multi-warehouse.',
    monthlyPrice: 1499,
    yearlyPrice: 999,
    cta: 'Start free trial',
    ctaHref: '/auth/sign-up',
    ctaStyle: 'filled',
    popular: true,
    features: [
      '500 SKUs',
      '3 warehouses',
      '5 team members',
      '50 suppliers',
      'Everything in Free, plus:',
      'All CSV imports & exports',
      'PDF barcode labels',
      'Company overview report',
      'Inventory health tab',
      'Manual expiry scan trigger',
      'Notification preferences',
      'Point of sale',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Advanced analytics, automation & control.',
    monthlyPrice: 3499,
    yearlyPrice: 2499,
    cta: 'Start free trial',
    ctaHref: '/auth/sign-up',
    ctaStyle: 'outline',
    popular: false,
    features: [
      'Unlimited SKUs, warehouses, users, suppliers',
      'Everything in Standard, plus:',
      'Custom expiry warning window',
      'Company-level exports & reports',
      'Audit log',
      'Company analytics & trends',
      'ZPL thermal labels',
      'Advanced company settings',
      'Barcode settings (prefix, padding)',
      'Expiry risk report',
    ],
  },
];

export function formatPlanPrice(amount: number | null) {
  if (amount === null) return 'Custom';
  if (amount === 0) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}