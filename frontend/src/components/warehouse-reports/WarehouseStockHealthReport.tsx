'use client';

import React from 'react';
import { Shield, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useWarehouseStockHealth } from '@/hooks/apollo';
import { format } from 'date-fns';

const healthChartConfig = {
  healthy: { label: 'Healthy', color: 'var(--chart-2)' },
  atRisk: { label: 'At Risk', color: 'var(--chart-4)' },
  lowStock: { label: 'Low Stock', color: 'var(--chart-5)' },
  critical: { label: 'Critical', color: 'var(--chart-1)' },
  blocked: { label: 'Blocked', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const STATE_COLORS: Record<string, string> = {
  HEALTHY: 'var(--chart-2)',
  AT_RISK: 'var(--chart-4)',
  LOW_STOCK: 'var(--chart-5)',
  CRITICAL: 'var(--chart-1)',
  BLOCKED: 'var(--chart-3)',
};

const STATE_MAP: Record<string, string> = {
  HEALTHY: 'healthy',
  AT_RISK: 'atRisk',
  LOW_STOCK: 'lowStock',
  CRITICAL: 'critical',
  BLOCKED: 'blocked',
};

function StateBadge({ state }: { state: string }) {
  const bg: Record<string, string> = {
    HEALTHY: 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]',
    AT_RISK: 'bg-[var(--chart-4)]/15 text-[var(--chart-4)]',
    LOW_STOCK: 'bg-[var(--chart-5)]/15 text-[var(--chart-5)]',
    CRITICAL: 'bg-destructive/15 text-destructive',
    BLOCKED: 'bg-[var(--chart-3)]/15 text-[var(--chart-3)]',
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${bg[state] ?? 'bg-muted text-muted-foreground'}`}
    >
      {state?.replace(/_/g, ' ') ?? 'UNKNOWN'}
    </span>
  );
}

function HealthBar({ usable, total }: { usable: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (usable / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              pct > 70 ? 'var(--chart-2)' : pct > 40 ? 'var(--chart-4)' : 'var(--chart-1)',
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
    </div>
  );
}

interface Props {
  warehouseId: string;
}

export function WarehouseStockHealthReport({ warehouseId }: Props) {
  const { data, loading } = useWarehouseStockHealth(warehouseId);

  const items: any[] = data?.warehouseStockHealth ?? [];

  // Aggregate metrics
  const agg = items.reduce(
    (acc, item) => {
      acc.totalStock += item.totalStock ?? 0;
      acc.usableStock += item.usableStock ?? 0;
      acc.expiredQty += item.expiredQty ?? 0;
      acc.expiringSoonQty += item.expiringSoonQty ?? 0;
      const s = item.state ?? 'HEALTHY';
      acc.stateCounts[s] = (acc.stateCounts[s] ?? 0) + 1;
      return acc;
    },
    {
      totalStock: 0,
      usableStock: 0,
      expiredQty: 0,
      expiringSoonQty: 0,
      stateCounts: {} as Record<string, number>,
    },
  );

  const healthPieData = Object.entries(agg.stateCounts).map(([state, count]) => ({
    name: STATE_MAP[state] ?? state,
    value: count as number,
    fill: `var(--color-${STATE_MAP[state] ?? state})`,
  }));

  // Top products by risk (non-HEALTHY, sorted by expiry)
  const riskProducts = items
    .filter((item: any) => item.state !== 'HEALTHY')
    .sort((a: any, b: any) => {
      const order = { BLOCKED: 0, CRITICAL: 1, LOW_STOCK: 2, AT_RISK: 3 };
      return (
        (order[a.state as keyof typeof order] ?? 4) - (order[b.state as keyof typeof order] ?? 4)
      );
    })
    .slice(0, 15);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              {agg.totalStock.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">All tracked inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Usable Stock</CardTitle>
            <Shield className="h-4 w-4 text-[var(--chart-2)]" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-2)]">
              {agg.usableStock.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {agg.totalStock > 0
                ? `${((agg.usableStock / agg.totalStock) * 100).toFixed(1)}% of total`
                : 'No stock'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-destructive">
              {agg.expiredQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Requires action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-[var(--chart-4)]" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-4)]">
              {agg.expiringSoonQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Distribution Pie */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health Distribution</CardTitle>
            <CardDescription>Products by health state</CardDescription>
          </CardHeader>
          <CardContent>
            {healthPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No health data</p>
            ) : (
              <>
                <ChartContainer
                  config={healthChartConfig}
                  className="mx-auto aspect-square max-h-[220px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie
                      data={healthPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-muted-foreground">
                  {healthPieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            STATE_COLORS[
                              Object.entries(STATE_MAP).find(([, v]) => v === d.name)?.[0] ?? ''
                            ] ?? 'var(--chart-3)',
                        }}
                      />
                      {healthChartConfig[d.name as keyof typeof healthChartConfig]?.label ?? d.name}
                      : {d.value}
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Health Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Health Breakdown</CardTitle>
            <CardDescription>Products across {items.length} tracked items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(agg.stateCounts)
                .sort(([a], [b]) => {
                  const ord = ['BLOCKED', 'CRITICAL', 'LOW_STOCK', 'AT_RISK', 'HEALTHY'];
                  return ord.indexOf(a) - ord.indexOf(b);
                })
                .map(([state, count]) => (
                  <div
                    key={state}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: STATE_COLORS[state] ?? 'var(--chart-3)' }}
                      />
                      <span className="text-sm font-medium">{state.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{count as number}</span>
                      <span className="text-xs text-muted-foreground">
                        {items.length > 0
                          ? `${(((count as number) / items.length) * 100).toFixed(0)}%`
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Products Table */}
      {riskProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Products Requiring Attention</CardTitle>
            <CardDescription>Non-healthy products sorted by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Usable</TableHead>
                  <TableHead>Usability</TableHead>
                  <TableHead className="text-right">Expired</TableHead>
                  <TableHead className="text-right">Expiring Soon</TableHead>
                  <TableHead>Nearest Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskProducts.map((item: any) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>
                      <StateBadge state={item.state} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.totalStock?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.usableStock?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <HealthBar usable={item.usableStock ?? 0} total={item.totalStock ?? 0} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {item.expiredQty > 0 ? item.expiredQty?.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[var(--chart-4)]">
                      {item.expiringSoonQty > 0 ? item.expiringSoonQty?.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.nearestExpiryDate
                        ? format(new Date(item.nearestExpiryDate), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
