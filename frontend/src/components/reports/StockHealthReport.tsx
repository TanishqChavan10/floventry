'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useInventoryHealthStats,
  useWarehouseHealthScorecard,
  useCompanyStockHealthOverview,
} from '@/hooks/apollo';
import { useExportData } from '@/hooks/useExportData';

const healthPieConfig = {
  healthy: { label: 'Healthy', color: 'var(--chart-2)' },
  warning: { label: 'Warning', color: 'var(--chart-4)' },
  critical: { label: 'Critical', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const scorecardConfig = {
  OK: { label: 'Healthy', color: 'var(--chart-2)' },
  Warning: { label: 'Warning', color: 'var(--chart-4)' },
  Critical: { label: 'Critical', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function HealthBar({ ok, warning, critical }: { ok: number; warning: number; critical: number }) {
  const total = ok + warning + critical;
  if (total === 0) return <div className="h-1.5 rounded bg-muted w-full" />;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded">
      <div className="bg-[var(--chart-2)]" style={{ width: `${(ok / total) * 100}%` }} />
      <div className="bg-[var(--chart-4)]" style={{ width: `${(warning / total) * 100}%` }} />
      <div className="bg-destructive" style={{ width: `${(critical / total) * 100}%` }} />
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-[var(--chart-2)]';
  if (score >= 50) return 'text-[var(--chart-4)]';
  return 'text-destructive';
}

export function StockHealthReport() {
  const { plan, loading: planLoading } = require('@/hooks/usePlanTier').usePlanTier();
  const allowed = plan === 'Pro';

  const { data: healthData, loading: healthLoading } = useInventoryHealthStats();
  const { data: scorecardData, loading: scorecardLoading } = useWarehouseHealthScorecard();
  const { data: overviewData, loading: overviewLoading } = useCompanyStockHealthOverview();

  const { exportToCSV, exportProgress } = useExportData();

  if (!allowed || planLoading) {
    const { PlanGateBlock } = require('@/components/upgrade/PlanGateBlock');
    return (
      <PlanGateBlock
        requiredPlan="Pro"
        featureName="Stock Health Report"
        description="Unlock warehouse health scorecards, risk metrics, and inventory health distribution."
      />
    );
  }

  const stats = healthData?.inventoryHealthStats;
  const scorecards: Array<{
    warehouseId: string;
    warehouseName: string;
    okCount: number;
    warningCount: number;
    criticalCount: number;
  }> = scorecardData?.warehouseHealthScorecard ?? [];
  const overview = overviewData?.companyStockHealthOverview;
  const riskMetrics: Array<{
    warehouseId: string;
    warehouseName: string;
    healthScore: number;
    expiredPercentage: number;
    expiringSoonPercentage: number;
    blockedProductCount: number;
  }> = overview?.warehouseRiskMetrics ?? [];

  const totalSkus =
    (stats?.okCount ?? 0) + (stats?.warningCount ?? 0) + (stats?.criticalCount ?? 0);

  const pieData = [
    { name: 'healthy', value: stats?.okCount ?? 0, fill: 'var(--color-healthy)' },
    { name: 'warning', value: stats?.warningCount ?? 0, fill: 'var(--color-warning)' },
    { name: 'critical', value: stats?.criticalCount ?? 0, fill: 'var(--color-critical)' },
  ];

  const barData = scorecards.map((sc) => ({
    name: sc.warehouseName.length > 16 ? sc.warehouseName.slice(0, 16) + '...' : sc.warehouseName,
    OK: sc.okCount,
    Warning: sc.warningCount,
    Critical: sc.criticalCount,
  }));

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
              (riskMetrics ?? []).map((m) => ({
                warehouseName: m.warehouseName,
                healthScore: m.healthScore,
                expiredPercentage: m.expiredPercentage,
                expiringSoonPercentage: m.expiringSoonPercentage,
                blockedProductCount: m.blockedProductCount,
              })),
              { filename: 'stock_health_risk_metrics' },
            )
          }
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Health overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Health</CardTitle>
            <CardDescription>SKU-level distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading && !healthData ? (
              <Skeleton className="h-[200px] w-full" />
            ) : totalSkus === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No SKUs found
              </div>
            ) : (
              <ChartContainer
                config={healthPieConfig}
                className="mx-auto aspect-square max-h-[200px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-3 content-start">
          {[
            { label: 'Healthy', value: stats?.okCount ?? 0, color: 'text-[var(--chart-2)]' },
            { label: 'Warning', value: stats?.warningCount ?? 0, color: 'text-[var(--chart-4)]' },
            { label: 'Critical', value: stats?.criticalCount ?? 0, color: 'text-destructive' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{item.label} SKUs</p>
                <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalSkus > 0 ? Math.round((item.value / totalSkus) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
          ))}

          {overview && (
            <Card className="sm:col-span-3">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blocked Products</p>
                    <p className="text-xl font-bold text-destructive mt-0.5">
                      {overview.totalBlockedProducts}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{overview.lastUpdated}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Warehouse Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Scorecard</CardTitle>
          <CardDescription>SKUs per health state per warehouse</CardDescription>
        </CardHeader>
        <CardContent>
          {scorecardLoading && !scorecardData ? (
            <Skeleton className="h-[240px] w-full" />
          ) : barData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              No warehouses
            </div>
          ) : (
            <ChartContainer
              config={scorecardConfig}
              className="w-full"
              style={{ height: Math.max(200, barData.length * 48) }}
            >
              <BarChart data={barData} layout="vertical">
                <CartesianGrid horizontal={false} vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="OK" fill="var(--color-OK)" stackId="a" />
                <Bar dataKey="Warning" fill="var(--color-Warning)" stackId="a" />
                <Bar
                  dataKey="Critical"
                  fill="var(--color-Critical)"
                  stackId="a"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Risk Metrics Table */}
      {riskMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
            <CardDescription>Expiry and health breakdown per warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading && !overviewData ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Health</TableHead>
                    <TableHead className="text-right">Expired</TableHead>
                    <TableHead className="text-right">Expiring</TableHead>
                    <TableHead className="text-right">Blocked</TableHead>
                    <TableHead className="w-[100px]">Bar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskMetrics.map((m) => (
                    <TableRow key={m.warehouseId}>
                      <TableCell className="font-medium">{m.warehouseName}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${scoreColor(m.healthScore)}`}>
                          {m.healthScore.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {m.expiredPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-[var(--chart-4)]">
                        {m.expiringSoonPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {m.blockedProductCount > 0 ? (
                          <span className="text-destructive font-medium">
                            {m.blockedProductCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <HealthBar
                          ok={m.healthScore}
                          warning={m.expiringSoonPercentage}
                          critical={m.expiredPercentage}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
