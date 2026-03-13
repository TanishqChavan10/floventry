'use client';

import React from 'react';
import { Package, Warehouse, AlertTriangle, Activity, Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyDashboard } from '@/hooks/apollo';
import { Button } from '@/components/ui/button';
import { useExportData } from '@/hooks/useExportData';

const stockChartConfig = {
  healthy: { label: 'Healthy', color: 'var(--chart-2)' },
  low: { label: 'Low Stock', color: 'var(--chart-4)' },
  critical: { label: 'Critical', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const expiryChartConfig = {
  ok: { label: 'OK', color: 'var(--chart-2)' },
  expiringSoon: { label: 'Expiring Soon', color: 'var(--chart-4)' },
  expired: { label: 'Expired', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function OverviewReport() {
  // Plan tier gating
  const { plan, loading: planLoading } = require('@/hooks/usePlanTier').usePlanTier();
  const overviewAllowed = plan === 'Standard' || plan === 'Pro';

  const { exportToCSV, exportProgress } = useExportData();

  const { data, loading } = useCompanyDashboard();

  const dashboard = data?.companyDashboard;
  const kpis = dashboard?.kpis;
  const stockStatus = dashboard?.stockStatusDistribution;
  const expiryRisk = dashboard?.expiryRiskDistribution;
  const alerts = dashboard?.activeAlertsSummary;
  const warehouseHealth = dashboard?.warehouseHealthSnapshot ?? [];

  if (!overviewAllowed || planLoading) {
    const { PlanGateBlock } = require('@/components/upgrade/PlanGateBlock');
    return (
      <PlanGateBlock
        requiredPlan="Standard"
        featureName="Company Overview Report"
        description="Unlock KPI dashboards, stock distribution charts, and warehouse health snapshots."
      />
    );
  }

  if (loading && !dashboard) {
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

  const stockPieData = [
    { name: 'healthy', value: stockStatus?.ok ?? 0, fill: 'var(--color-healthy)' },
    { name: 'low', value: stockStatus?.low ?? 0, fill: 'var(--color-low)' },
    { name: 'critical', value: stockStatus?.critical ?? 0, fill: 'var(--color-critical)' },
  ];

  const expiryPieData = [
    { name: 'ok', value: expiryRisk?.ok ?? 0, fill: 'var(--color-ok)' },
    {
      name: 'expiringSoon',
      value: expiryRisk?.expiringSoon ?? 0,
      fill: 'var(--color-expiringSoon)',
    },
    { name: 'expired', value: expiryRisk?.expired ?? 0, fill: 'var(--color-expired)' },
  ];

  const alertItems = [
    { label: 'Critical', count: alerts?.critical ?? 0 },
    { label: 'Warning', count: alerts?.warning ?? 0 },
    { label: 'Low Stock', count: alerts?.lowStock ?? 0 },
    { label: 'Expiry', count: alerts?.expiry ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={exportProgress.isExporting}
          onClick={() =>
            exportToCSV(
              [
                { type: 'KPI', metric: 'Total SKUs', value: kpis?.totalSkus ?? 0 },
                { type: 'KPI', metric: 'Stock Units', value: kpis?.totalStockUnits ?? 0 },
                { type: 'KPI', metric: 'Warehouses', value: kpis?.warehouses ?? 0 },
                { type: 'KPI', metric: 'At-risk Units', value: kpis?.stockAtRisk ?? 0 },
                { type: 'KPI', metric: 'Expired Units', value: kpis?.expiredStockUnits ?? 0 },
                ...(warehouseHealth ?? []).map((wh: any) => ({
                  type: 'Warehouse Health',
                  warehouseName: wh.warehouseName,
                  okPercent: wh.okPercent,
                  riskBadge: wh.riskBadge,
                })),
              ],
              { filename: 'company_overview' },
            )
          }
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{(kpis?.totalSkus ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Active products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Stock Units</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{(kpis?.totalStockUnits ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total quantity on hand</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{kpis?.warehouses ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Operational locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">At-risk Units</CardTitle>
            <AlertTriangle className="h-4 w-4 text-[var(--chart-4)]" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-4)]">
              {(kpis?.stockAtRisk ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Low/critical + expiring soon</p>
            {(kpis?.expiredStockUnits ?? 0) > 0 && (
              <p className="text-xs text-destructive font-medium mt-0.5">
                {kpis.expiredStockUnits.toLocaleString()} expired
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts row */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {alertItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
            <CardDescription>SKUs by stock health</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={stockChartConfig}
              className="mx-auto aspect-square max-h-[220px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={stockPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              {stockPieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  {stockChartConfig[d.name as keyof typeof stockChartConfig]?.label}: {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiry Risk</CardTitle>
            <CardDescription>Lot-level expiry breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={expiryChartConfig}
              className="mx-auto aspect-square max-h-[220px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={expiryPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              {expiryPieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  {expiryChartConfig[d.name as keyof typeof expiryChartConfig]?.label}: {d.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Summary</CardTitle>
          <CardDescription>Stock flow over recent windows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: '7-day in',
                value: kpis?.movements7d?.inUnits ?? 0,
                color: 'text-[var(--chart-2)]',
              },
              {
                label: '7-day out',
                value: kpis?.movements7d?.outUnits ?? 0,
                color: 'text-[var(--chart-1)]',
              },
              {
                label: '30-day in',
                value: kpis?.movements30d?.inUnits ?? 0,
                color: 'text-[var(--chart-2)]',
              },
              {
                label: '30-day out',
                value: kpis?.movements30d?.outUnits ?? 0,
                color: 'text-[var(--chart-1)]',
              },
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className={`text-xl font-bold ${m.color}`}>{m.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Health */}
      {warehouseHealth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Health</CardTitle>
            <CardDescription>Risk level per warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warehouseHealth.map(
                (wh: {
                  warehouseId: string;
                  warehouseName: string;
                  okPercent: number;
                  riskBadge: string;
                }) => (
                  <div
                    key={wh.warehouseId}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{wh.warehouseName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{wh.okPercent}%</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          wh.riskBadge === 'LOW'
                            ? 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                            : wh.riskBadge === 'MEDIUM'
                              ? 'bg-[var(--chart-4)]/15 text-[var(--chart-4)]'
                              : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {wh.riskBadge}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
