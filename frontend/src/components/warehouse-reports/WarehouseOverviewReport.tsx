'use client';

import React from 'react';
import { Package, AlertTriangle, Activity, TrendingDown } from 'lucide-react';
import { Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useWarehouseDashboard, useLowStockItems, useStockSnapshot } from '@/hooks/apollo';
import { format } from 'date-fns';

const statusChartConfig = {
  ok: { label: 'OK', color: 'var(--chart-2)' },
  warning: { label: 'Warning', color: 'var(--chart-4)' },
  critical: { label: 'Critical', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const lowStockConfig = {
  quantity: { label: 'Quantity', color: 'var(--chart-1)' },
  reorder: { label: 'Reorder Point', color: 'var(--chart-3)' },
} satisfies ChartConfig;

interface Props {
  warehouseId: string;
}

export function WarehouseOverviewReport({ warehouseId }: Props) {
  const { data: dashData, loading: dashLoading } = useWarehouseDashboard(warehouseId);

  const { data: snapData, loading: snapLoading } = useStockSnapshot({
    warehouseId,
    filters: { limit: 200, offset: 0 },
  });

  const { data: lowData, loading: lowLoading } = useLowStockItems(warehouseId);

  const kpis = dashData?.warehouseKPIs;
  const recentMovements = dashData?.recentMovements ?? [];

  // Derive status distribution from snapshot
  const snapshotItems = snapData?.stockSnapshot?.items ?? [];
  const statusCounts = snapshotItems.reduce(
    (acc: Record<string, number>, item: any) => {
      const s = (item.status ?? 'OK').toUpperCase();
      if (s === 'CRITICAL') acc.critical++;
      else if (s === 'WARNING') acc.warning++;
      else acc.ok++;
      return acc;
    },
    { ok: 0, warning: 0, critical: 0 },
  );

  const statusPieData = [
    { name: 'ok', value: statusCounts.ok, fill: 'var(--color-ok)' },
    { name: 'warning', value: statusCounts.warning, fill: 'var(--color-warning)' },
    { name: 'critical', value: statusCounts.critical, fill: 'var(--color-critical)' },
  ];

  // Derive low stock bar chart (top 8)
  const lowStockItems = (lowData?.lowStockItems ?? []).slice(0, 8);
  const lowStockBarData = lowStockItems.map((item: any) => ({
    name:
      item.product?.name?.length > 14
        ? item.product.name.slice(0, 14) + '…'
        : (item.product?.name ?? '?'),
    quantity: item.quantity ?? 0,
    reorder: item.reorderPoint ?? 0,
  }));

  if ((dashLoading && !dashData) || (snapLoading && !snapData)) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-1">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{(kpis?.totalProducts ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Tracked SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Stock Units</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{(kpis?.totalQuantity ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total quantity on hand</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-[var(--chart-4)]" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-4)]">
              {kpis?.lowStockCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Below reorder point</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-destructive">{kpis?.outOfStockCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Zero quantity</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Todays Activity</CardTitle>
          <CardDescription>Operations performed today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Adjustments</p>
              <p className="text-xl font-bold">{kpis?.adjustmentsToday ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Transfers</p>
              <p className="text-xl font-bold">{kpis?.transfersToday ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Stock Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
            <CardDescription>Products by inventory health</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={statusChartConfig}
              className="mx-auto aspect-square max-h-[220px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              {statusPieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  {statusChartConfig[d.name as keyof typeof statusChartConfig]?.label}: {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Current stock vs reorder point</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockBarData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No low stock items</p>
            ) : (
              <ChartContainer config={lowStockConfig} className="h-[220px] w-full">
                <BarChart
                  data={lowStockBarData}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="quantity"
                    fill="var(--color-quantity)"
                    radius={[0, 3, 3, 0]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="reorder"
                    fill="var(--color-reorder)"
                    radius={[0, 3, 3, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      {recentMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest stock movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMovements.slice(0, 8).map((m: any, i: number) => {
                const isInbound = ['GRN', 'ADJUSTMENT_IN', 'TRANSFER_IN', 'IN', 'OPENING'].includes(
                  m.type ?? '',
                );
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isInbound
                            ? 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                            : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {(m.type ?? '').replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-medium">{m.product?.name ?? 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-mono font-semibold ${isInbound ? 'text-[var(--chart-2)]' : 'text-destructive'}`}
                      >
                        {(m.quantity ?? 0) > 0 ? '+' : ''}
                        {m.quantity ?? 0}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {m.createdAt ? format(new Date(m.createdAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
