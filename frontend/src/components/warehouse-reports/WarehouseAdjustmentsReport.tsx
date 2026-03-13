'use client';

import React, { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
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
import { CopyButton } from '@/components/common/CopyButton';
import { useAdjustmentReport } from '@/hooks/apollo';
import { format, subDays } from 'date-fns';
import { ExportButton } from '@/components/export/ExportButton';

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const trendConfig = {
  adjIn: { label: 'Adj. In', color: 'var(--chart-2)' },
  adjOut: { label: 'Adj. Out', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const reasonConfig = {
  count: { label: 'Count', color: 'var(--chart-4)' },
} satisfies ChartConfig;

interface Props {
  warehouseId: string;
}

export function WarehouseAdjustmentsReport({ warehouseId }: Props) {
  const [days, setDays] = useState(30);

  const fromDate = useMemo(() => subDays(new Date(), days), [days]);
  const toDate = useMemo(() => new Date(), []);

  const { data, loading } = useAdjustmentReport({
    warehouseId,
    filters: { fromDate, toDate, limit: 500, offset: 0 },
  });

  const items: any[] = data?.adjustmentReport?.items ?? [];
  const total = data?.adjustmentReport?.total ?? 0;

  // Summary
  const summary = useMemo(() => {
    let adjIn = 0,
      adjOut = 0;
    items.forEach((item) => {
      const qty = Math.abs(item.quantity ?? 0);
      if (['ADJUSTMENT_IN'].includes(item.adjustmentType ?? '') || (item.quantity ?? 0) > 0) {
        adjIn += qty;
      } else {
        adjOut += qty;
      }
    });
    return { adjIn, adjOut, net: adjIn - adjOut, total: items.length };
  }, [items]);

  // Daily trend (group by date)
  const dailyTrend = useMemo(() => {
    const map = new Map<string, { adjIn: number; adjOut: number }>();
    items.forEach((item) => {
      const d = item.createdAt ? format(new Date(item.createdAt), 'MMM d') : 'Unknown';
      if (!map.has(d)) map.set(d, { adjIn: 0, adjOut: 0 });
      const entry = map.get(d)!;
      const qty = Math.abs(item.quantity ?? 0);
      if (['ADJUSTMENT_IN'].includes(item.adjustmentType ?? '') || (item.quantity ?? 0) > 0) {
        entry.adjIn += qty;
      } else {
        entry.adjOut += qty;
      }
    });
    return Array.from(map.entries()).map(([date, vals]) => ({ date, ...vals }));
  }, [items]);

  // Reason breakdown
  const reasonBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const reason = item.reason?.trim() || 'No reason';
      const short = reason.length > 30 ? reason.slice(0, 30) + '…' : reason;
      map.set(short, (map.get(short) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items]);

  // By user breakdown
  const byUser = useMemo(() => {
    const map = new Map<string, { count: number; netQty: number }>();
    items.forEach((item) => {
      const user = item.performedBy ?? 'System';
      if (!map.has(user)) map.set(user, { count: 0, netQty: 0 });
      const entry = map.get(user)!;
      entry.count++;
      entry.netQty += item.quantity ?? 0;
    });
    return Array.from(map.entries())
      .map(([user, vals]) => ({ user, ...vals }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Top adjusted products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; count: number; netQty: number }>();
    items.forEach((item) => {
      const key = item.sku ?? item.productName ?? '';
      if (!map.has(key))
        map.set(key, { name: item.productName ?? '', sku: item.sku ?? '', count: 0, netQty: 0 });
      const entry = map.get(key)!;
      entry.count++;
      entry.netQty += item.quantity ?? 0;
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [items]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12">
            <Skeleton className="h-6 w-40 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                days === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">{total} adjustments found</span>
        </div>

        <ExportButton
          type="adjustments"
          warehouseId={warehouseId}
          filters={{ dateFrom: fromDate.toISOString(), dateTo: toDate.toISOString() }}
          label="Export CSV"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Adj. In</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-2)]">
              {summary.adjIn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Units added</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Adj. Out</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-1)]">
              {summary.adjOut.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Units removed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`text-xl font-bold ${summary.net >= 0 ? 'text-[var(--chart-2)]' : 'text-destructive'}`}
            >
              {summary.net >= 0 ? '+' : ''}
              {summary.net.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">In - Out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Count</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{summary.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Adjustment records</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Line Chart */}
      {dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Trend</CardTitle>
            <CardDescription>Daily adjustment in vs out</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-[250px] w-full">
              <LineChart data={dailyTrend} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="adjIn"
                  stroke="var(--color-adjIn)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="adjOut"
                  stroke="var(--color-adjOut)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Reason Breakdown + By User */}
      <div className="grid gap-4 lg:grid-cols-2">
        {reasonBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>By Reason</CardTitle>
              <CardDescription>Top adjustment reasons</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={reasonConfig} className="h-[220px] w-full">
                <BarChart
                  data={reasonBreakdown}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis dataKey="reason" type="category" width={120} tick={{ fontSize: 10 }} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 3, 3, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {byUser.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>By Staff</CardTitle>
              <CardDescription>Adjustments performed per user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {byUser.map((u) => (
                  <div
                    key={u.user}
                    className="flex items-center justify-between py-1.5 border-b last:border-0"
                  >
                    <span className="text-sm font-medium">{u.user}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{u.count} adj.</span>
                      <span
                        className={`text-sm font-bold font-mono ${u.netQty >= 0 ? 'text-[var(--chart-2)]' : 'text-destructive'}`}
                      >
                        {u.netQty >= 0 ? '+' : ''}
                        {u.netQty.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Adjusted Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Adjusted Products</CardTitle>
            <CardDescription>Products with highest adjustment frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div
                  key={p.sku || i}
                  className="flex items-center justify-between py-1.5 border-b last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{p.sku}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{p.count}× adj.</span>
                    <span
                      className={`text-sm font-bold font-mono ${p.netQty >= 0 ? 'text-[var(--chart-2)]' : 'text-destructive'}`}
                    >
                      {p.netQty >= 0 ? '+' : ''}
                      {p.netQty.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment Ledger</CardTitle>
          <CardDescription>
            All adjustments in the selected period ({items.length} of {total})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No adjustments in the selected period
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.slice(0, 50).map((item: any) => {
                  const isIn = item.adjustmentType === 'ADJUSTMENT_IN' || (item.quantity ?? 0) > 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.createdAt ? format(new Date(item.createdAt), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <span>{item.sku}</span>
                          {item.sku && (
                            <CopyButton
                              value={item.sku}
                              ariaLabel="Copy SKU"
                              successMessage="Copied"
                              className="h-6 w-6 text-muted-foreground"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isIn
                              ? 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                              : 'bg-destructive/15 text-destructive'
                          }`}
                        >
                          {(item.adjustmentType ?? '').replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-semibold ${isIn ? 'text-[var(--chart-2)]' : 'text-destructive'}`}
                      >
                        {(item.quantity ?? 0) > 0 ? '+' : ''}
                        {item.quantity ?? 0}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {item.reason || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.performedBy}
                        {item.userRole && (
                          <div className="text-xs text-muted-foreground">{item.userRole}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
