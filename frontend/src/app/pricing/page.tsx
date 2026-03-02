import type { Metadata } from 'next';
import PricingPage from '@/components/landing/PricingPage';

export const metadata: Metadata = {
  title: 'Pricing — Floventry',
  description:
    'Simple, transparent pricing for Floventry. Start free, upgrade as you grow. Plans for solo founders to enterprise distributors.',
  alternates: {
    canonical: 'https://floventry.online/pricing',
  },
};

export default function Pricing() {
  return <PricingPage />;
}
