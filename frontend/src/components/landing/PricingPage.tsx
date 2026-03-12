'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import { formatPlanPrice, pricingPlans } from '@/lib/billing/plans';

/* ─── Compare table data ─────────────────────────────────────────────────── */
type CellValue = string | boolean;

const compareRows: {
  category?: string;
  label: string;
  free: CellValue;
  standard: CellValue;
  pro: CellValue;
}[] = [
  {
    category: 'LIMITS',
    label: 'Unique SKUs',
    free: '100',
    standard: '500',
    pro: 'Unlimited',
  },
  { label: 'Warehouses', free: '1', standard: '3', pro: 'Unlimited' },
  { label: 'Team members', free: '2', standard: '5', pro: 'Unlimited' },
  { label: 'Suppliers', free: '10', standard: '50', pro: 'Unlimited' },

  {
    category: 'INVENTORY WORKFLOW',
    label: 'Product / Category / Unit management',
    free: true,
    standard: true,
    pro: true,
  },
  { label: 'Stock operations (create, adjust, opening)', free: true, standard: true, pro: true },
  { label: 'Stock lot tracking (FIFO / FEFO)', free: true, standard: true, pro: true },
  { label: 'GRN lifecycle', free: true, standard: true, pro: true },
  { label: 'Issue notes with FEFO auto-selection', free: true, standard: true, pro: true },
  { label: 'Warehouse transfers', free: true, standard: true, pro: true },
  { label: 'Purchase order lifecycle', free: true, standard: true, pro: true },
  { label: 'Sales order lifecycle', free: true, standard: true, pro: true },
  { label: 'Point of sale', free: false, standard: true, pro: true },

  {
    category: 'TRACKING & ALERTS',
    label: 'Low stock monitoring',
    free: true,
    standard: true,
    pro: true,
  },
  { label: 'Expiry scanner (daily, 30-day window)', free: true, standard: true, pro: true },
  { label: 'Custom expiry warning window', free: false, standard: false, pro: true },
  { label: 'Manual expiry scan trigger', free: false, standard: true, pro: true },
  { label: 'In-app notifications', free: true, standard: true, pro: true },
  { label: 'Notification preferences', free: false, standard: true, pro: true },
  { label: 'Global search', free: true, standard: true, pro: true },

  {
    category: 'BARCODE',
    label: 'Barcode lookup (manual entry)',
    free: true,
    standard: true,
    pro: true,
  },
  { label: 'PDF barcode labels', free: false, standard: true, pro: true },
  { label: 'Sequential barcode generation', free: false, standard: true, pro: true },
  { label: 'Alternate barcodes (barcode units)', free: false, standard: true, pro: true },
  { label: 'Barcode history', free: false, standard: true, pro: true },
  { label: 'ZPL thermal labels (Zebra / TSC)', free: false, standard: false, pro: true },
  { label: 'Company barcode settings', free: false, standard: false, pro: true },

  {
    category: 'IMPORT & EXPORT',
    label: 'CSV import (products)',
    free: true,
    standard: true,
    pro: true,
  },
  {
    label: 'All CSV imports (categories, suppliers, stock)',
    free: false,
    standard: true,
    pro: true,
  },
  { label: 'Warehouse-level CSV exports', free: false, standard: true, pro: true },
  { label: 'Company-level CSV exports', free: false, standard: false, pro: true },

  {
    category: 'DASHBOARD & REPORTS',
    label: 'Dashboard (KPIs, alerts, health, movements)',
    free: true,
    standard: true,
    pro: true,
  },
  { label: 'Warehouse reports', free: true, standard: true, pro: true },
  { label: 'Company overview report', free: false, standard: true, pro: true },
  { label: 'Inventory health tab', free: false, standard: true, pro: true },
  {
    label: 'Advanced company reports (PO, SO, adjustments)',
    free: false,
    standard: false,
    pro: true,
  },
  { label: 'Advanced analytics (trends, health, stats)', free: false, standard: false, pro: true },
  { label: 'Expiry risk report', free: false, standard: false, pro: true },

  {
    category: 'ACCESS & AUDIT',
    label: 'RBAC (all 4 roles)',
    free: true,
    standard: true,
    pro: true,
  },
  { label: 'Audit log', free: false, standard: false, pro: true },
  { label: 'Advanced company settings', free: false, standard: false, pro: true },
];

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-neutral-900" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-neutral-300" />;
  return <span className="text-sm text-neutral-700">{value}</span>;
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
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => {
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
                      <span className="text-4xl font-bold">{formatPlanPrice(price)}</span>
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
                  {plan.features.map((f) => {
                    const isSeparator = f.startsWith('Everything in');
                    if (isSeparator) {
                      return (
                        <li
                          key={f}
                          className={`pt-2 pb-1 text-xs font-semibold uppercase tracking-wide ${
                            isPopular ? 'text-neutral-500' : 'text-neutral-400'
                          }`}
                        >
                          {f}
                        </li>
                      );
                    }
                    return (
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
                    );
                  })}
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
                  <th className="pb-6 text-left font-semibold text-neutral-900 w-[46%]" />
                  {pricingPlans.map((plan) => (
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
                          colSpan={4}
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
                      <td className="py-3.5 text-center bg-neutral-50 font-medium">
                        <Cell value={row.standard} />
                      </td>
                      <td className="py-3.5 text-center">
                        <Cell value={row.pro} />
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
