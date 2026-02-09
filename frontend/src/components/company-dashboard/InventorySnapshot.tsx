'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';
import { StockHealthWidget } from '@/components/company/stock-health-widget';
import { QuickActions } from '@/components/company-dashboard/QuickActions';

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

function StackedBar({
  segments,
  total,
}: {
  total: number;
  segments: Array<{ label: string; value: number; className: string }>;
}) {
  if (total <= 0) {
    return <div className="h-2 w-full rounded bg-muted" />;
  }

  return (
    <div className="h-2 w-full overflow-hidden rounded bg-muted flex">
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.label}
            className={s.className}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value.toLocaleString()} (${percent(s.value, total)}%)`}
          />
        ))}
    </div>
  );
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

      <div className="grid gap-4 lg:grid-cols-2">
        <StockHealthWidget companySlug={companySlug} />
        <QuickActions companySlug={companySlug} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Health Distributions</CardTitle>
              <CardDescription>Stock levels and expiry risk</CardDescription>
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Stock Status</div>
              <StackedBar
                total={stockTotal}
                segments={[
                  {
                    label: 'Healthy (OK)',
                    value: stockStatus.ok,
                    className: 'bg-[var(--chart-2)]/60',
                  },
                  {
                    label: 'At-risk (Low)',
                    value: stockStatus.low,
                    className: 'bg-[var(--chart-4)]/55',
                  },
                  {
                    label: 'Critical',
                    value: stockStatus.critical,
                    className: 'bg-destructive/55',
                  },
                ]}
              />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Healthy</span>
                  <span className="font-medium">
                    {stockStatus.ok.toLocaleString()} ({percent(stockStatus.ok, stockTotal)}%)
                  </span>
                </div>
                <Link
                  href={buildNotificationsHref(companySlug, { type: 'STOCK_LOW' })}
                  className="flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-muted"
                >
                  <span className="text-muted-foreground">At-risk</span>
                  <span className="font-medium">
                    {stockStatus.low.toLocaleString()} ({percent(stockStatus.low, stockTotal)}%)
                  </span>
                </Link>
                <Link
                  href={buildNotificationsHref(companySlug, {
                    filter: 'critical',
                    type: 'STOCK_CRITICAL',
                  })}
                  className="flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-muted"
                >
                  <span className="text-muted-foreground">Critical</span>
                  <span className="font-medium">
                    {stockStatus.critical.toLocaleString()} (
                    {percent(stockStatus.critical, stockTotal)}%)
                  </span>
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">Expiry Risk</div>
              <StackedBar
                total={expiryTotal}
                segments={[
                  {
                    label: 'Healthy (OK)',
                    value: expiryRisk.ok,
                    className: 'bg-[var(--chart-2)]/60',
                  },
                  {
                    label: 'At-risk (Expiring soon)',
                    value: expiryRisk.expiringSoon,
                    className: 'bg-[var(--chart-4)]/55',
                  },
                  {
                    label: 'Critical (Expired)',
                    value: expiryRisk.expired,
                    className: 'bg-destructive/55',
                  },
                ]}
              />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Healthy</span>
                  <span className="font-medium">
                    {expiryRisk.ok.toLocaleString()} ({percent(expiryRisk.ok, expiryTotal)}%)
                  </span>
                </div>
                <Link
                  href={buildNotificationsHref(companySlug, { type: 'STOCK_EXPIRING_SOON' })}
                  className="flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-muted"
                >
                  <span className="text-muted-foreground">At-risk</span>
                  <span className="font-medium">
                    {expiryRisk.expiringSoon.toLocaleString()} (
                    {percent(expiryRisk.expiringSoon, expiryTotal)}%)
                  </span>
                </Link>
                <Link
                  href={buildNotificationsHref(companySlug, {
                    type: 'STOCK_EXPIRED',
                  })}
                  className="flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-muted"
                >
                  <span className="text-muted-foreground">Critical</span>
                  <span className="font-medium">
                    {expiryRisk.expired.toLocaleString()} (
                    {percent(expiryRisk.expired, expiryTotal)}%)
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="text-sm font-semibold mb-1">Actionable Alerts</div>
            <div className="text-xs text-muted-foreground mb-3">
              Click an item to review and resolve.
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <Link
                href={buildNotificationsHref(companySlug, {
                  filter: 'critical',
                  severity: 'CRITICAL',
                })}
                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground">Critical</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-xl font-semibold text-destructive">
                    {alerts.critical.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Review</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Needs attention today</div>
              </Link>
              <Link
                href={buildNotificationsHref(companySlug, { severity: 'WARNING' })}
                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground">At-risk</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-xl font-semibold text-[var(--chart-4)]">
                    {alerts.warning.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Review</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Keep an eye on these</div>
              </Link>
              <Link
                href={buildNotificationsHref(companySlug, {
                  type: ['STOCK_LOW', 'STOCK_CRITICAL'],
                })}
                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground">Low stock</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-xl font-semibold">{alerts.lowStock.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Review</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Check replenishment options
                </div>
              </Link>
              <Link
                href={buildNotificationsHref(companySlug, {
                  type: ['STOCK_EXPIRED', 'STOCK_EXPIRING_SOON'],
                })}
                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground">Expiry</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-xl font-semibold">{alerts.expiry.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Review</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Reduce risk before it expires
                </div>
              </Link>
              <Link
                href={buildNotificationsHref(companySlug, {
                  type: 'IMPORT_PARTIAL_FAILURE',
                })}
                className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground">Imports</div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <div className="text-xl font-semibold">
                    {alerts.importIssues.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Review</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Fix partial failures</div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
