'use client';

import React, { useState } from 'react';
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useMovementTrends,
  useMovementTypeBreakdown,
  useTopStockProducts,
  useCriticalStockProducts,
} from '@/hooks/apollo';
import { ExportButton } from '@/components/export/ExportButton';
import { subDays } from 'date-fns';

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const flowConfig = {
  in: { label: 'Stock In', color: 'var(--chart-2)' },
  out: { label: 'Stock Out', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const topProductsConfig = {
  qty: { label: 'Stock Qty', color: 'var(--chart-3)' },
} satisfies ChartConfig;

function formatMovementType(type: string): string {
  const map: Record<string, string> = {
    IN: 'In',
    OUT: 'Out',
    TRANSFER_IN: 'Transfer In',
    TRANSFER_OUT: 'Transfer Out',
    ADJUSTMENT: 'Adjustment',
    ADJUSTMENT_IN: 'Adj. In',
    ADJUSTMENT_OUT: 'Adj. Out',
    OPENING: 'Opening',
  };
  return (
    map[type] ??
    String(type)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

const TYPE_COLORS: Record<string, string> = {
  In: 'var(--chart-2)',
  Out: 'var(--chart-1)',
  'Transfer In': 'var(--chart-3)',
  'Transfer Out': 'var(--chart-4)',
  'Adj. In': 'var(--chart-5)',
  'Adj. Out': 'var(--chart-1)',
  Opening: 'var(--chart-3)',
  Adjustment: 'var(--chart-4)',
};

export function InventoryMovementsReport() {
  const [days, setDays] = useState(30);

  const { data: trendsData, loading: trendsLoading } = useMovementTrends({ days });
  const { data: breakdownData, loading: breakdownLoading } = useMovementTypeBreakdown({ days });
  const { data: topData, loading: topLoading } = useTopStockProducts({ limit: 10 });
  const { data: criticalData, loading: criticalLoading } = useCriticalStockProducts({ limit: 15 });

  // Plan tier gating
  const { plan, loading: planLoading } = require('@/hooks/usePlanTier').usePlanTier();
  const movementsAllowed = plan === 'Standard' || plan === 'Pro';

  if (!movementsAllowed || planLoading) {
    const { PlanGateBlock } = require('@/components/upgrade/PlanGateBlock');
    return (
      <PlanGateBlock
        requiredPlan="Standard"
        featureName="Inventory Movements Report"
        description="Unlock stock flow trends, movement breakdowns, and top product analytics."
      />
    );
  }
  const flowData = (trendsData?.movementTrends ?? []).map((d: any) => ({
    date: (() => {
      const dt = new Date(d.date);
      return Number.isNaN(dt.getTime())
        ? String(d.date)
        : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    })(),
    in: Number(d.inQuantity ?? 0),
    out: Number(d.outQuantity ?? 0),
  }));

  const breakdownChartData = (breakdownData?.movementTypeBreakdown ?? [])
    .map((d: any) => ({
      name: formatMovementType(String(d.type)),
      quantity: Number(d.totalQuantity ?? 0),
    }))
    .sort((a: { quantity: number }, b: { quantity: number }) => b.quantity - a.quantity);

  const breakdownConfig = Object.fromEntries(
    breakdownChartData.map((d: { name: string }) => [
      d.name,
      { label: d.name, color: TYPE_COLORS[d.name] ?? 'var(--chart-3)' },
    ]),
  ) as ChartConfig;

  const topProducts = (topData?.topStockProducts ?? []).map((d: any) => ({
    name:
      String(d.productName).length > 20
        ? String(d.productName).slice(0, 20) + '...'
        : d.productName,
    sku: d.sku,
    qty: Number(d.totalQuantity ?? 0),
  }));

  const criticalItems: Array<{
    productId: string;
    productName: string;
    sku: string;
    lowestWarehouseStock: number;
    warehouseName: string;
  }> = criticalData?.criticalStockProducts ?? [];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Inventory movements for selected period</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${days === p.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <ExportButton
            type="company_movements"
            filters={{
              dateFrom: subDays(new Date(), days).toISOString(),
              dateTo: new Date().toISOString(),
            }}
            label="Export CSV"
          />
        </div>
      </div>

      {/* Stock Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Flow</CardTitle>
          <CardDescription>Daily stock in vs out (units)</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading && !trendsData ? (
            <Skeleton className="h-[260px] w-full" />
          ) : flowData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              No data for this period
            </div>
          ) : (
            <ChartContainer config={flowConfig} className="h-[260px] w-full">
              <LineChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="in"
                  stroke="var(--color-in)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="out"
                  stroke="var(--color-out)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Breakdown + Top Products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Movement Breakdown</CardTitle>
            <CardDescription>Quantity by movement type</CardDescription>
          </CardHeader>
          <CardContent>
            {breakdownLoading && !breakdownData ? (
              <Skeleton className="h-[220px] w-full" />
            ) : breakdownChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <ChartContainer config={breakdownConfig} className="h-[220px] w-full">
                <BarChart data={breakdownChartData} layout="vertical">
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
                  <Bar dataKey="quantity" radius={4}>
                    {breakdownChartData.map((entry: { name: string }, i: number) => (
                      <Cell key={i} fill={TYPE_COLORS[entry.name] ?? 'var(--chart-3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Stock</CardTitle>
            <CardDescription>Highest current stock quantity</CardDescription>
          </CardHeader>
          <CardContent>
            {topLoading && !topData ? (
              <Skeleton className="h-[220px] w-full" />
            ) : topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <ChartContainer config={topProductsConfig} className="h-[220px] w-full">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid horizontal={false} vertical={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="qty" fill="var(--color-qty)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Critical Stock
            {criticalItems.length > 0 && (
              <Badge variant="destructive">{criticalItems.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Products at critically low levels</CardDescription>
        </CardHeader>
        <CardContent>
          {criticalLoading && !criticalData ? (
            <Skeleton className="h-24 w-full" />
          ) : criticalItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No critical stock items
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.warehouseName}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {item.lowestWarehouseStock}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
