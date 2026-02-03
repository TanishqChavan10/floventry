'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { WarehouseOverview } from '@/components/company-dashboard/WarehouseOverview';
import { InventorySnapshot } from '@/components/company-dashboard/InventorySnapshot';
import { RecentActivity } from '@/components/company-dashboard/RecentActivity';
import { QuickActions } from '@/components/company-dashboard/QuickActions';
import CompanyGuard from '@/components/CompanyGuard';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_COMPANY_DASHBOARD } from '@/lib/graphql/company-dashboard';
import { StockHealthWidget } from '@/components/company/stock-health-widget';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function CompanyDashboardContent() {
  const params = useParams();
  const companySlug = params.slug as string;
  const permissions = usePermissions();
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<Date | null>(null);

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

  const { data, loading, error, refetch } = useQuery(GET_COMPANY_DASHBOARD, {
    pollInterval: 30000,
  });

  const dashboard = data?.companyDashboard;

  React.useEffect(() => {
    if (dashboard) setLastUpdatedAt(new Date());
  }, [dashboard]);

  if (loading && !dashboard) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">
          Error loading dashboard: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Company Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Overview of all warehouses and company-wide metrics
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-7">
                Live • 30s
              </Badge>
              <Button
                type="button"
                variant="outline"
                className="h-7 px-2.5 text-xs"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {lastUpdatedAt ? `Last updated ${lastUpdatedAt.toLocaleTimeString()}` : '—'}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Link href={`/${companySlug}/catalog/products`} className="shrink-0">
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Products
                </Button>
              </Link>
              <Link href={`/${companySlug}/warehouses`} className="shrink-0">
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Warehouses
                </Button>
              </Link>
              <Link href={`/${companySlug}/inventory/reports/expiry`} className="shrink-0">
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Expiry Report
                </Button>
              </Link>
              <Link href={`/${companySlug}/purchase-orders`} className="shrink-0">
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Purchase Orders
                </Button>
              </Link>
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <RecentActivity data={dashboard} />
            <AnalyticsCharts role="ADMIN" />
          </div>

          <div className="space-y-6">
            <StockHealthWidget companySlug={companySlug} />
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
