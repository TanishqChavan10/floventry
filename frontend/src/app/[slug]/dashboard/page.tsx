'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { WarehouseOverview } from '@/components/company-dashboard/WarehouseOverview';
import { InventorySnapshot } from '@/components/company-dashboard/InventorySnapshot';
import { PurchaseOrdersSummary } from '@/components/company-dashboard/PurchaseOrdersSummary';
import { RecentActivity } from '@/components/company-dashboard/RecentActivity';
import { QuickActions } from '@/components/company-dashboard/QuickActions';
import CompanyGuard from '@/components/CompanyGuard';
import { AlertCircle } from 'lucide-react';

function CompanyDashboardContent() {
  const params = useParams();
  const companySlug = params.slug as string;
  const permissions = usePermissions();

  // Only OWNER and ADMIN can access company dashboard
  if (!permissions.isOwner && !permissions.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Only company owners and administrators can access the company dashboard. Please contact
            your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Company Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Overview of all warehouses and company-wide metrics
          </p>
        </div>

        {/* Inventory Snapshot */}
        <section>
          <InventorySnapshot />
        </section>

        {/* Warehouse Overview */}
        <section>
          <WarehouseOverview companySlug={companySlug} />
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <PurchaseOrdersSummary />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <RecentActivity />
            <QuickActions companySlug={companySlug} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CompanyDashboardPage() {
  return (
    <CompanyGuard>
      <CompanyDashboardContent />
    </CompanyGuard>
  );
}
