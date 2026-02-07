'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, AlertCircle, Activity } from 'lucide-react';
import { useWarehouse, type Warehouse } from '@/context/warehouse-context';
import { useQuery } from '@apollo/client';
import { GET_WAREHOUSE_DASHBOARD } from '@/lib/graphql/warehouse-dashboard';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

type RecentMovement = {
  type?: string | null;
  product?: { name?: string | null } | null;
  performedBy?: { name?: string | null } | null;
  createdAt?: string | null;
  quantity?: number | null;
};

type LowStockItem = {
  quantity?: number | null;
  status?: string | null;
  product?: { name?: string | null; sku?: string | null } | null;
};

function WarehouseDashboardData({
  companySlug,
  warehouseSlug,
  activeWarehouse,
}: {
  companySlug: string;
  warehouseSlug: string;
  activeWarehouse: Warehouse;
}) {
  const { data, loading, error } = useQuery(GET_WAREHOUSE_DASHBOARD, {
    variables: { warehouseId: activeWarehouse.id },
    pollInterval: 30000, // Real-time-ish update
    errorPolicy: 'all', // Continue even if there are errors
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
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          Error loading dashboard: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {activeWarehouse.name} Overview
            </h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Recent Activity Feed */}
          <Card className="md:col-span-7 h-[420px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-5 pb-5">
                <div className="space-y-3">
                  {recentMovements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                  ) : (
                    recentMovements.map((movement: RecentMovement, index: number) =>
                      (() => {
                        const movementType = movement.type ?? '';
                        const isInbound = [
                          'GRN',
                          'ADJUSTMENT_IN',
                          'TRANSFER_IN',
                          'IN',
                          'OPENING',
                        ].includes(movementType);

                        const badgeClass = isInbound
                          ? 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                          : 'bg-destructive/10 text-destructive';

                        const BadgeIcon = isInbound ? ArrowDown : ArrowUp;

                        return (
                          <div
                            key={index}
                            className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                          >
                            <div className="flex gap-4">
                              <div
                                className={`mt-0.5 h-9 w-9 rounded-full hidden sm:flex items-center justify-center ${badgeClass}`}
                              >
                                <BadgeIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {/* Better formatting for type */}
                                  {movement.type?.replace(/_/g, ' ') || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {movement.product?.name || 'Unknown Product'}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span>by {movement.performedBy?.name || 'System'}</span>
                                  <span>•</span>
                                  <span>
                                    {movement.createdAt
                                      ? format(new Date(movement.createdAt), 'MMM d, h:mm a')
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`font-mono font-semibold ${
                                (movement.quantity ?? 0) > 0
                                  ? 'text-[var(--chart-2)]'
                                  : 'text-destructive'
                              }`}
                            >
                              {(movement.quantity ?? 0) > 0 ? '+' : ''}
                              {movement.quantity ?? 0}
                            </div>
                          </div>
                        );
                      })(),
                    )
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="md:col-span-2 h-[420px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">At a glance</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Total products</div>
                  <div className="text-lg font-semibold text-foreground">{kpis.totalProducts}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Out of stock</div>
                  <div className="text-lg font-semibold text-destructive">
                    {kpis.outOfStockCount}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Low stock</div>
                  <div className="text-lg font-semibold text-[var(--chart-4)]">
                    {kpis.lowStockCount}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Adjustments today</div>
                  <div className="text-lg font-semibold text-foreground">
                    {kpis.adjustmentsToday}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Transfers today</div>
                  <div className="text-lg font-semibold text-foreground">{kpis.transfersToday}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Snapshot */}
          <Card className="md:col-span-3 h-[420px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Low Stock Alert</CardTitle>
              <Link
                href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`}
                className="text-xs text-primary hover:underline"
              >
                View All
              </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-5 pb-5">
                <div className="space-y-4">
                  {lowStock.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Everything looks good!
                    </div>
                  ) : (
                    lowStock.map((item: LowStockItem, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="truncate font-medium text-sm text-foreground">
                            {item?.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item?.product?.sku || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-[var(--chart-4)]">
                            {item?.quantity ?? 0}
                          </p>
                          <Badge
                            variant={item?.status === 'CRITICAL' ? 'destructive' : 'secondary'}
                            className="text-[10px] h-5 px-1.5"
                          >
                            {item?.status || 'UNKNOWN'}
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

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Quick actions</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/reports`}
              className="shrink-0"
            >
              <Button variant="outline" className="w-full justify-start">
                Reports
              </Button>
            </Link>
            <Link href={`/${companySlug}/warehouses/${warehouseSlug}/expiry`} className="shrink-0">
              <Button variant="outline" className="w-full justify-start">
                Expiry
              </Button>
            </Link>
            <Link
              href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`}
              className="shrink-0"
            >
              <Button variant="outline" className="w-full justify-start">
                Low Stock
              </Button>
            </Link>
            <Link
              href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn`}
              className="shrink-0"
            >
              <Button variant="outline" className="w-full justify-start">
                Receiving
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function WarehouseDashboardContent() {
  const params = useParams();
  const warehouseSlug = params.warehouseSlug as string;
  const companySlug = params.slug as string;
  const { activeWarehouse } = useWarehouse();

  if (!activeWarehouse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">No warehouse selected</h1>
          <p className="text-muted-foreground">
            Select a warehouse from the switcher to view warehouse-specific pages.
          </p>
          <div className="flex justify-center">
            <Link href={`/${companySlug}/warehouses`} className="text-primary hover:underline">
              Go to warehouses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WarehouseDashboardData
      companySlug={companySlug}
      warehouseSlug={warehouseSlug}
      activeWarehouse={activeWarehouse}
    />
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
