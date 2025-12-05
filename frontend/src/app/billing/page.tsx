'use client';

import { PlanOverview } from '@/components/billing/PlanOverview';
import { UsageSummary } from '@/components/billing/UsageSummary';
import { PaymentMethods } from '@/components/billing/PaymentMethods';
import { InvoiceHistory } from '@/components/billing/InvoiceHistory';

export default function BillingPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
          <PlanOverview />
          <PaymentMethods />
          <InvoiceHistory />
        </div>
        <div className="col-span-3 space-y-4">
          <UsageSummary />
        </div>
      </div>
    </div>
  );
}
