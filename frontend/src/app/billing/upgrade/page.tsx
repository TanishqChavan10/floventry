'use client';

import { PricingTable } from '@/components/billing/PricingTable';

export default function UpgradePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h2>
        <p className="text-muted-foreground max-w-[600px]">
          Choose the perfect plan for your business needs. Upgrade now to unlock more features and limits.
        </p>
      </div>
      
      <PricingTable />
    </div>
  );
}
