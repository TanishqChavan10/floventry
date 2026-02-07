'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { WarehouseOverview } from '@/components/company-dashboard/WarehouseOverview';
import { InventorySnapshot } from '@/components/company-dashboard/InventorySnapshot';
import { RecentActivity } from '@/components/company-dashboard/RecentActivity';
import { QuickActions } from '@/components/company-dashboard/QuickActions';
import CompanyGuard from '@/components/CompanyGuard';
import { AlertCircle } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_COMPANY_DASHBOARD } from '@/lib/graphql/company-dashboard';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';

function CompanyDashboardContent() {
  const params = useParams();
  const companySlug = params.slug as string;
  const permissions = usePermissions();

  // Only OWNER and ADMIN can access company dashboard
  if (!permissions.isOwner && !permissions.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            Only company owners and administrators can access the company dashboard. Please contact
            your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const { data, loading, error } = useQuery(GET_COMPANY_DASHBOARD, {
    pollInterval: 30000,
  });

  const dashboard = data?.companyDashboard;

  if (loading && !dashboard) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          Error loading dashboard: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Company Overview
              </h1>
            </div>
          </div>
        </div>

        {/* Inventory Snapshot */}
        <section>
          <InventorySnapshot companySlug={companySlug} data={dashboard} />
        </section>

        {/* Warehouse Overview */}
        <section>
          <WarehouseOverview companySlug={companySlug} data={dashboard} />
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-1">
            <RecentActivity data={dashboard} />
          </div>
          <div className="space-y-6 lg:col-span-3">
            <AnalyticsCharts role="ADMIN" dashboard={dashboard} />
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
