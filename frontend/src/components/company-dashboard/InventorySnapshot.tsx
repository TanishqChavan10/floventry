'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';
import { StockHealthWidget } from '@/components/company/stock-health-widget';
import { QuickActions } from '@/components/company-dashboard/QuickActions';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface InventorySnapshotProps {
  companySlug: string;
  data?: CompanyDashboardData;
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function buildNotificationsHref(
  companySlug: string,
  params: {
    filter?: 'all' | 'unread' | 'critical';
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    type?: string | string[];
  },
): string {
  const sp = new URLSearchParams();
  if (params.filter && params.filter !== 'all') sp.set('filter', params.filter);
  if (params.severity) sp.set('severity', params.severity);
  if (params.type) {
    const types = Array.isArray(params.type) ? params.type : [params.type];
    if (types.length > 0) sp.set('type', types.join(','));
  }
  const qs = sp.toString();
  return qs ? `/${companySlug}/notifications?${qs}` : `/${companySlug}/notifications`;
}

export function InventorySnapshot({ companySlug, data }: InventorySnapshotProps) {
  const kpis = data?.kpis ?? {
    totalSkus: 0,
    warehouses: 0,
    totalStockUnits: 0,
    stockAtRisk: 0,
    expiredStockUnits: 0,
    movements7d: { inUnits: 0, outUnits: 0 },
    movements30d: { inUnits: 0, outUnits: 0 },
  };

  const stockStatus = data?.stockStatusDistribution ?? { ok: 0, low: 0, critical: 0 };
  const expiryRisk = data?.expiryRiskDistribution ?? { ok: 0, expiringSoon: 0, expired: 0 };
  const alerts = data?.activeAlertsSummary ?? {
    critical: 0,
    warning: 0,
    lowStock: 0,
    expiry: 0,
    importIssues: 0,
  };

  const stockTotal = stockStatus.ok + stockStatus.low + stockStatus.critical;
  const expiryTotal = expiryRisk.ok + expiryRisk.expiringSoon + expiryRisk.expired;

  // --- Chart configs ---
  const stockStatusChartConfig = {
    healthy: { label: 'Healthy', color: 'var(--chart-2)' },
    low: { label: 'Low Stock', color: 'var(--chart-4)' },
    critical: { label: 'Critical', color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const stockStatusPieData = [
    { name: 'healthy', value: stockStatus.ok, fill: 'var(--color-healthy)' },
    { name: 'low', value: stockStatus.low, fill: 'var(--color-low)' },
    { name: 'critical', value: stockStatus.critical, fill: 'var(--color-critical)' },
  ];

  const expiryRiskChartConfig = {
    healthy: { label: 'Healthy', color: 'var(--chart-2)' },
    expiring: { label: 'Expiring Soon', color: 'var(--chart-4)' },
    expired: { label: 'Expired', color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const expiryRiskPieData = [
    { name: 'healthy', value: expiryRisk.ok, fill: 'var(--color-healthy)' },
    { name: 'expiring', value: expiryRisk.expiringSoon, fill: 'var(--color-expiring)' },
    { name: 'expired', value: expiryRisk.expired, fill: 'var(--color-expired)' },
  ];

  const movementChartConfig = {
    in: { label: 'Stock In', color: 'var(--chart-2)' },
    out: { label: 'Stock Out', color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  const movementBarData = [
    { period: '7 days', in: kpis.movements7d.inUnits, out: kpis.movements7d.outUnits },
    { period: '30 days', in: kpis.movements30d.inUnits, out: kpis.movements30d.outUnits },
  ];

  const alertsChartConfig = {
    count: { label: 'Count' },
    critical: { label: 'Critical', color: 'var(--chart-1)' },
    warning: { label: 'At-risk', color: 'var(--chart-4)' },
    lowStock: { label: 'Low Stock', color: 'var(--chart-3)' },
    expiry: { label: 'Expiry', color: 'var(--chart-4)' },
    imports: { label: 'Imports', color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const alertsBarData = [
    { name: 'Critical', count: alerts.critical, fill: 'var(--chart-1)' },
    { name: 'At-risk', count: alerts.warning, fill: 'var(--chart-4)' },
    { name: 'Low Stock', count: alerts.lowStock, fill: 'var(--chart-3)' },
    { name: 'Expiry', count: alerts.expiry, fill: 'var(--chart-4)' },
    { name: 'Imports', count: alerts.importIssues, fill: 'var(--chart-2)' },
  ];

  const hasAnyData = Boolean(
    data &&
    (kpis.totalSkus > 0 ||
      kpis.warehouses > 0 ||
      kpis.totalStockUnits > 0 ||
      stockTotal > 0 ||
      expiryTotal > 0 ||
      (data.recentActivity?.length ?? 0) > 0),
  );

  const todayFocusItems: Array<{
    key: string;
    title: string;
    subtitle: string;
    count: number;
    href: string;
  }> = [
    {
      key: 'expired-stock',
      title: 'Expired stock',
      subtitle: 'Remove/resolve expired lots',
      count: expiryRisk.expired,
      href: buildNotificationsHref(companySlug, { type: 'STOCK_EXPIRED' }),
    },
    {
      key: 'import-issues',
      title: 'Import issues',
      subtitle: 'Fix partial failures',
      count: alerts.importIssues,
      href: buildNotificationsHref(companySlug, { type: 'IMPORT_PARTIAL_FAILURE' }),
    },
    {
      key: 'critical-stock',
      title: 'Critical stock',
      subtitle: 'Risk of stockouts',
      count: stockStatus.critical,
      href: buildNotificationsHref(companySlug, { filter: 'critical', type: 'STOCK_CRITICAL' }),
    },
    {
      key: 'expiring-soon',
      title: 'Expiring soon',
      subtitle: 'Plan before expiry',
      count: expiryRisk.expiringSoon,
      href: buildNotificationsHref(companySlug, { type: 'STOCK_EXPIRING_SOON' }),
    },
    {
      key: 'low-stock',
      title: 'Low stock',
      subtitle: 'Review replenishment needs',
      count: stockStatus.low,
      href: buildNotificationsHref(companySlug, { type: 'STOCK_LOW' }),
    },
  ];

  const todayFocus = todayFocusItems.filter((i) => i.count > 0).slice(0, 3);

  const focus = (() => {
    if (alerts.critical > 0) {
      return {
        title: `${alerts.critical.toLocaleString()} critical alert${alerts.critical === 1 ? '' : 's'} need attention`,
        hint: 'Prioritize these first',
        tone: 'critical' as const,
      };
    }
    if (expiryRisk.expired > 0) {
      return {
        title: `${expiryRisk.expired.toLocaleString()} expired item${expiryRisk.expired === 1 ? '' : 's'} in stock`,
        hint: 'Review expiry alerts and take action',
        tone: 'warning' as const,
      };
    }
    if (expiryRisk.expiringSoon > 0) {
      return {
        title: `${expiryRisk.expiringSoon.toLocaleString()} item${expiryRisk.expiringSoon === 1 ? '' : 's'} expiring soon`,
        hint: 'Plan reductions/transfers before expiry',
        tone: 'neutral' as const,
      };
    }
    if (stockStatus.critical > 0) {
      return {
        title: `${stockStatus.critical.toLocaleString()} critical-stock SKU${stockStatus.critical === 1 ? '' : 's'}`,
        hint: 'Check replenishment and reorder points',
        tone: 'neutral' as const,
      };
    }
    return {
      title: 'Inventory health looks good',
      hint: 'No major risk signals right now',
      tone: 'good' as const,
    };
  })();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-4 h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Today’s Focus</CardTitle>
                <CardDescription>What should I worry about today?</CardDescription>
              </div>
              <Link href={buildNotificationsHref(companySlug, { filter: 'unread' })}>
                <Button size="sm" variant="outline">
                  View unread
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!hasAnyData ? (
              <div className="text-sm">
                <div className="font-medium">No data yet</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Add warehouses/products or import stock to see health signals.
                </div>
              </div>
            ) : todayFocus.length === 0 ? (
              <div className="text-sm">
                <div className="font-medium">All clear</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  No critical or at-risk signals right now.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                {todayFocus.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 -mx-2 hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.title} ({item.count.toLocaleString()})
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">Open</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 lg:col-span-8 lg:grid-cols-2 lg:grid-rows-2 h-full">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{kpis.totalSkus.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Active products</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{kpis.warehouses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Locations</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">Stock Units</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold">{kpis.totalStockUnits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Total quantity on hand</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium">At-risk Units</CardTitle>
              <AlertTriangle className="h-4 w-4 text-[var(--chart-4)]" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold text-[var(--chart-4)]">
                {kpis.stockAtRisk.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Low/critical stock + expiring soon
              </p>
              {kpis.expiredStockUnits > 0 && (
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {kpis.expiredStockUnits.toLocaleString()} expired units
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row: Stock Status + Expiry Risk + Movements */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Stock Status Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Status</CardTitle>
            <CardDescription>SKU distribution by stock level</CardDescription>
          </CardHeader>
          <CardContent>
            {stockTotal === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <>
                <ChartContainer
                  config={stockStatusChartConfig}
                  className="mx-auto aspect-square max-h-[180px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={stockStatusPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 space-y-1.5 text-sm">
                  {stockStatusPieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: item.fill }}
                        />
                        <span className="text-muted-foreground capitalize">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {item.value.toLocaleString()} ({percent(item.value, stockTotal)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expiry Risk Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiry Risk</CardTitle>
            <CardDescription>SKU distribution by expiry state</CardDescription>
          </CardHeader>
          <CardContent>
            {expiryTotal === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <>
                <ChartContainer
                  config={expiryRiskChartConfig}
                  className="mx-auto aspect-square max-h-[180px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={expiryRiskPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 space-y-1.5 text-sm">
                  {expiryRiskPieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: item.fill }}
                        />
                        <span className="text-muted-foreground capitalize">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {item.value.toLocaleString()} ({percent(item.value, expiryTotal)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Movement Comparison Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Movements</CardTitle>
            <CardDescription>Inflow vs outflow (7d &amp; 30d)</CardDescription>
          </CardHeader>
          <CardContent>
            {movementBarData.every((d) => d.in === 0 && d.out === 0) ? (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No movement data yet
              </div>
            ) : (
              <ChartContainer config={movementChartConfig} className="h-[220px] w-full">
                <BarChart data={movementBarData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="in" fill="var(--color-in)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="out" fill="var(--color-out)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Health + Quick Actions Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StockHealthWidget companySlug={companySlug} />
        <QuickActions companySlug={companySlug} />
      </div>

      {/* Alerts Overview Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Alerts Overview</CardTitle>
              <CardDescription>Active alerts by category</CardDescription>
            </div>
            <Link
              href={
                alerts.expiry > 0
                  ? buildNotificationsHref(companySlug, {
                      type: ['STOCK_EXPIRED', 'STOCK_EXPIRING_SOON'],
                    })
                  : `/${companySlug}/inventory/reports/expiry`
              }
            >
              <Button
                variant={alerts.expiry > 0 ? 'destructive' : 'outline'}
                size="sm"
                className={alerts.expiry > 0 ? 'text-white' : undefined}
              >
                Review expiry{alerts.expiry > 0 ? ` (${alerts.expiry.toLocaleString()})` : ''}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <div
                className={
                  focus.tone === 'critical'
                    ? 'text-sm font-semibold text-destructive'
                    : focus.tone === 'warning'
                      ? 'text-sm font-semibold text-[var(--chart-4)]'
                      : focus.tone === 'good'
                        ? 'text-sm font-semibold text-[var(--chart-2)]'
                        : 'text-sm font-semibold'
                }
              >
                {focus.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{focus.hint}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {alerts.critical > 0 && (
                <Link
                  href={buildNotificationsHref(companySlug, {
                    filter: 'critical',
                    severity: 'CRITICAL',
                  })}
                >
                  <Button size="sm" variant="destructive">
                    Review critical ({alerts.critical.toLocaleString()})
                  </Button>
                </Link>
              )}
              {alerts.lowStock > 0 && (
                <Link
                  href={buildNotificationsHref(companySlug, {
                    type: ['STOCK_LOW', 'STOCK_CRITICAL'],
                  })}
                >
                  <Button size="sm" variant="outline">
                    Review low stock ({alerts.lowStock.toLocaleString()})
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {alertsBarData.every((d) => d.count === 0) ? (
            <div className="flex items-center justify-center h-[160px] text-sm text-muted-foreground">
              No active alerts
            </div>
          ) : (
            <ChartContainer config={alertsChartConfig} className="h-[200px] w-full">
              <BarChart
                data={alertsBarData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {alertsBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
