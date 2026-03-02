'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

/* ─── Plan data ─────────────────────────────────────────────────────────── */
const plans = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Best for getting started.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Sign up free',
    ctaHref: '/auth/sign-up',
    ctaStyle: 'outline',
    popular: false,
    features: ['100 SKUs', '1 User license', 'Basic stock tracking', 'CSV import'],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Best for small teams getting organised.',
    monthlyPrice: 1499,
    yearlyPrice: 999,
    cta: 'Start free trial',
    ctaHref: '/auth/sign-up',
    ctaStyle: 'outline',
    popular: false,
    badge: null,
    features: [
      '500 SKUs',
      '2 User licenses',
      'Barcode & QR scanning',
      'Low-stock alerts',
      '1 warehouse',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Best for growing inventory operations.',
    monthlyPrice: 3499,
    yearlyPrice: 2499,
    cta: 'Start free trial',
    ctaHref: '/auth/sign-up',
    ctaStyle: 'filled',
    popular: true,
    features: [
      '5,000 SKUs',
      '5 User licenses',
      'Multi-warehouse support',
      'Purchase orders & GRNs',
      'Audit logs',
      'CSV / PDF export',
      'Role-based permissions',
      'Email alerts',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Best for high-volume distributors.',
    monthlyPrice: null,
    yearlyPrice: null,
    cta: 'Talk to sales',
    ctaHref: 'mailto:hello@floventry.online',
    ctaStyle: 'outline',
    popular: false,
    features: [
      'Unlimited SKUs',
      '12+ User licenses',
      'API & webhooks',
      'Dedicated account manager',
      'Custom integrations',
      'SSO / SAML',
    ],
  },
];

/* ─── Compare table data ─────────────────────────────────────────────────── */
type CellValue = string | boolean;

const compareRows: {
  category?: string;
  label: string;
  free: CellValue;
  starter: CellValue;
  growth: CellValue;
  enterprise: CellValue;
}[] = [
  {
    category: 'ORGANIZE',
    label: 'Unique SKUs',
    free: '100',
    starter: '500',
    growth: '5,000',
    enterprise: 'Unlimited',
  },
  { label: 'User licenses', free: '1', starter: '2', growth: '5', enterprise: '12+' },
  { label: 'CSV import', free: true, starter: true, growth: true, enterprise: true },
  { label: 'Item photos', free: true, starter: true, growth: true, enterprise: true },
  { label: 'Custom fields', free: '1', starter: '5', growth: '20', enterprise: 'Unlimited' },
  { label: 'Custom tags', free: false, starter: true, growth: true, enterprise: true },
  { label: 'Multiple warehouses', free: false, starter: false, growth: true, enterprise: true },

  {
    category: 'MANAGE',
    label: 'Barcode & QR scanning',
    free: false,
    starter: true,
    growth: true,
    enterprise: true,
  },
  { label: 'Barcode label creation', free: false, starter: true, growth: true, enterprise: true },
  { label: 'Purchase orders & GRNs', free: false, starter: false, growth: true, enterprise: true },
  { label: 'Stock transfers', free: false, starter: true, growth: true, enterprise: true },
  { label: 'Item check-in / check-out', free: true, starter: true, growth: true, enterprise: true },

  {
    category: 'TRACK & ALERT',
    label: 'Low-stock alerts',
    free: false,
    starter: true,
    growth: true,
    enterprise: true,
  },
  { label: 'Expiry date alerts', free: false, starter: true, growth: true, enterprise: true },
  { label: 'Email notifications', free: false, starter: false, growth: true, enterprise: true },
  { label: 'Real-time sync', free: true, starter: true, growth: true, enterprise: true },

  {
    category: 'REPORT',
    label: 'Activity history',
    free: '1 month',
    starter: '1 year',
    growth: '3 years',
    enterprise: 'Unlimited',
  },
  { label: 'CSV / PDF export', free: false, starter: true, growth: true, enterprise: true },
  { label: 'Audit logs', free: false, starter: false, growth: true, enterprise: true },
  { label: 'Stock health dashboard', free: false, starter: false, growth: true, enterprise: true },

  {
    category: 'ACCESS & INTEGRATIONS',
    label: 'Role-based permissions',
    free: false,
    starter: false,
    growth: true,
    enterprise: true,
  },
  { label: 'API access', free: false, starter: false, growth: false, enterprise: true },
  { label: 'Webhooks', free: false, starter: false, growth: false, enterprise: true },
  { label: 'SSO / SAML', free: false, starter: false, growth: false, enterprise: true },
  {
    label: 'Dedicated account manager',
    free: false,
    starter: false,
    growth: false,
    enterprise: true,
  },
];

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-neutral-900" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-neutral-300" />;
  return <span className="text-sm text-neutral-700">{value}</span>;
}

function fmt(n: number | null) {
  if (n === null) return 'Custom';
  if (n === 0) return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function PricingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* ── Hero heading ── */}
      <section className="pt-20 pb-10 text-center px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
          Start Your 14-Day Free Trial Today.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600 leading-relaxed">
          Transform how your business does inventory. Find the right Floventry plan for you.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 p-1">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              !yearly
                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                : 'text-neutral-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              yearly
                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                : 'text-neutral-500'
            }`}
          >
            Yearly
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              Save 33%
            </span>
          </button>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border p-7 ${
                  isPopular
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xl'
                    : 'border-neutral-200 bg-white text-neutral-900'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E53935] px-4 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}

                <div>
                  <h2
                    className={`text-xl font-bold ${isPopular ? 'text-white' : 'text-neutral-900'}`}
                  >
                    {plan.name}
                  </h2>
                  <p
                    className={`mt-1 text-sm ${isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}
                  >
                    {plan.tagline}
                  </p>
                </div>

                <div className="mt-6">
                  {price === null ? (
                    <span className="text-3xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{fmt(price)}</span>
                      <span
                        className={`ml-1 text-sm ${isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}
                      >
                        /mo
                      </span>
                    </>
                  )}
                  {price !== null && price > 0 && yearly && (
                    <p
                      className={`mt-1 text-xs ${isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}
                    >
                      Billed yearly
                    </p>
                  )}
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`mt-6 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    plan.ctaStyle === 'filled'
                      ? 'bg-[#E53935] text-white hover:bg-[#D32F2F]'
                      : isPopular
                        ? 'border border-neutral-600 bg-transparent text-white hover:bg-neutral-800'
                        : 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          isPopular
                            ? 'border-neutral-600 bg-neutral-800'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${isPopular ? 'text-white' : 'text-neutral-900'}`}
                        />
                      </span>
                      <span className={isPopular ? 'text-neutral-300' : 'text-neutral-700'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-neutral-400">
          All prices shown in INR. No credit card required for free trial.
        </p>
      </section>

      {/* ── Compare plans table ── */}
      <section className="border-t border-neutral-200 py-24 px-6">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-12 text-center">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="pb-6 text-left font-semibold text-neutral-900 w-[40%]" />
                  {plans.map((plan) => (
                    <th key={plan.id} className="pb-6 text-center font-bold text-neutral-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <React.Fragment key={idx}>
                    {row.category && (
                      <tr>
                        <td
                          colSpan={5}
                          className="pt-8 pb-3 text-xs font-bold uppercase tracking-widest text-neutral-500"
                        >
                          {row.category}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 pr-6 text-neutral-700">{row.label}</td>
                      <td className="py-3.5 text-center">
                        <Cell value={row.free} />
                      </td>
                      <td className="py-3.5 text-center">
                        <Cell value={row.starter} />
                      </td>
                      <td className="py-3.5 text-center bg-neutral-50 font-medium">
                        <Cell value={row.growth} />
                      </td>
                      <td className="py-3.5 text-center">
                        <Cell value={row.enterprise} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-neutral-200 py-24 px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
          Try Floventry free for 14 days.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600 leading-relaxed">
          Track your inventory, supplies, and tools — no credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#E53935] px-8 text-base font-semibold text-white hover:bg-[#D32F2F]"
          >
            Start free trial
          </Link>
          <Link
            href="mailto:hello@floventry.online"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-8 text-base font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Talk to sales
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
