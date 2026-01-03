'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, ArrowUpDown, RefreshCw, AlertCircle, FileText, Activity } from 'lucide-react';
import { useWarehouse } from '@/context/warehouse-context';
import { useQuery } from '@apollo/client';
import { GET_WAREHOUSE_DASHBOARD } from '@/lib/graphql/warehouse-dashboard';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

function WarehouseDashboardContent() {
  const params = useParams();
  const warehouseSlug = params.warehouseSlug as string;
  const companySlug = params.slug as string;
  const { activeWarehouse } = useWarehouse();

  const { data, loading, error } = useQuery(GET_WAREHOUSE_DASHBOARD, {
    variables: { warehouseId: activeWarehouse?.id },
    skip: !activeWarehouse?.id,
    pollInterval: 30000, // Real-time-ish update
  });

  const kpis = data?.warehouseKPIs || {
    totalProducts: 0,
    totalQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    adjustmentsToday: 0,
    transfersToday: 0,
  };

  const lowStock = data?.lowStockPreview || [];
  const recentMovements = data?.recentMovements || [];

  if (loading && !data) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded"></div>)}
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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeWarehouse?.name} Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Real-time snapshot of inventory health and daily operations.
          </p>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.totalQuantity.toLocaleString()} total units
              </p>
            </CardContent>
          </Card>

          <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`}>
            <Card className="hover:border-orange-200 dark:hover:border-orange-900 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attention Needed</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                    {kpis.lowStockCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Low Stock</div>
                </div>
                {kpis.outOfStockCount > 0 && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {kpis.outOfStockCount} Out of Stock
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
             <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/adjustments`}>
              <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Adjustments (Today)</CardTitle>
                  <Activity className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.adjustmentsToday}</div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`}>
              <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transfers (Today)</CardTitle>
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.transfersToday}</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Recent Activity Feed */}
          <Card className="md:col-span-4 lg:col-span-5 h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-4">
                  {recentMovements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                  ) : (
                    recentMovements.map((movement: any, index: number) => (
                      <div key={index} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex gap-4">
                          <div className={`mt-1 p-2 rounded-full hidden sm:block ${
                            ['GRN', 'ADJUSTMENT_IN', 'TRANSFER_IN', 'IN'].includes(movement.type) 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {/* Better formatting for type */}
                              {movement.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {movement.product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>by {movement.performedBy?.name || 'System'}</span>
                              <span>•</span>
                              <span>{format(new Date(movement.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`font-mono font-semibold ${
                           movement.quantity > 0 
                           ? 'text-green-600 dark:text-green-400' 
                           : 'text-red-600 dark:text-red-400'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Low Stock Snapshot */}
          <Card className="md:col-span-3 lg:col-span-2 h-[500px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Low Stock Alert</CardTitle>
              <Link 
                href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`}
                className="text-xs text-blue-600 hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
               <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-4">
                  {lowStock.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Everything looks good!</div>
                  ) : (
                    lowStock.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="min-w-0 flex-1 pr-4">
                           <p className="truncate font-medium text-sm text-slate-900 dark:text-slate-100">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-orange-600">
                            {item.quantity}
                          </p>
                          <Badge variant={item.status === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Navigation / Shortcuts (Replacements for Quick Actions) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory`}>
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-lg border hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
                  <Package className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-sm font-medium">Inventory</span>
              </div>
           </Link>
           <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`}>
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-lg border hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group">
                  <AlertCircle className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-sm font-medium">Low Stock</span>
              </div>
           </Link>
           <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn`}>
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-lg border hover:border-green-500 hover:shadow-md transition-all cursor-pointer group">
                  <FileText className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-sm font-medium">GRN</span>
              </div>
           </Link>
           <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`}>
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-lg border hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                  <RefreshCw className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-sm font-medium">Transfers</span>
              </div>
           </Link>
           <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/adjustments`}>
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-lg border hover:border-slate-500 hover:shadow-md transition-all cursor-pointer group">
                  <Activity className="h-6 w-6 text-slate-500 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-sm font-medium">Adjustments</span>
              </div>
           </Link>
        </div>
      </main>
    </div>
  );
}

export default function WarehouseDashboardPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehouseDashboardContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
