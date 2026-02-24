'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#fafafa' }}
    >
      <div className="w-full max-w-sm text-center space-y-10">
        {/* Brand */}
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight" style={{ color: '#e05252' }}>
            Floventry
          </div>
          <p className="text-sm text-gray-500">Inventory management, simplified</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border bg-white p-8 text-left space-y-5"
          style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create your workspace</h2>
            <p className="text-sm text-gray-500 mt-1">
              Set up a company to start managing inventory with your team.
            </p>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#e05252' }}
            onClick={() => router.push('/onboarding/create-company')}
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400">
          Need help?{' '}
          <a
            href="mailto:support@floventry.com"
            className="underline underline-offset-2"
            style={{ color: '#e05252' }}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
