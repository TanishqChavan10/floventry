'use client';

import React, { useState, useMemo } from 'react';
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
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
import { useStockMovementsByWarehouse } from '@/hooks/apollo';
import { format, subDays } from 'date-fns';
import { ExportButton } from '@/components/export/ExportButton';

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const flowConfig = {
  inbound: { label: 'Inbound', color: 'var(--chart-2)' },
  outbound: { label: 'Outbound', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const INBOUND_TYPES = ['GRN', 'ADJUSTMENT_IN', 'TRANSFER_IN', 'IN', 'OPENING'];

function formatMovementType(type: string): string {
  const map: Record<string, string> = {
    IN: 'In',
    OUT: 'Out',
    GRN: 'GRN',
    TRANSFER_IN: 'Transfer In',
    TRANSFER_OUT: 'Transfer Out',
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
  GRN: 'var(--chart-2)',
  'Transfer In': 'var(--chart-3)',
  'Transfer Out': 'var(--chart-4)',
  'Adj. In': 'var(--chart-5)',
  'Adj. Out': 'var(--chart-1)',
  Opening: 'var(--chart-3)',
};

interface Props {
  warehouseId: string;
}

export function WarehouseMovementsReport({ warehouseId }: Props) {
  const [days, setDays] = useState(30);

  const fromDate = useMemo(() => subDays(new Date(), days), [days]);
  const toDate = useMemo(() => new Date(), []);

  const { data, loading } = useStockMovementsByWarehouse({
    warehouseId,
    filters: { fromDate, toDate, limit: 500, offset: 0 },
  });

  const items = useMemo(() => {
    const raw: any[] = data?.stockMovements?.items ?? [];
    const seen = new Set<string>();
    return raw.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);
  const total = data?.stockMovements?.total ?? 0;

  // Derive daily trend from raw items (group by date)
  const dailyTrend = useMemo(() => {
    const map = new Map<string, { inbound: number; outbound: number }>();
    items.forEach((item) => {
      const d = item.createdAt ? format(new Date(item.createdAt), 'MMM d') : 'Unknown';
      if (!map.has(d)) map.set(d, { inbound: 0, outbound: 0 });
      const entry = map.get(d)!;
      const qty = Math.abs(item.quantity ?? 0);
      if (INBOUND_TYPES.includes(item.type ?? '')) entry.inbound += qty;
      else entry.outbound += qty;
    });
    return Array.from(map.entries()).map(([date, vals]) => ({ date, ...vals }));
  }, [items]);

  // Derive type breakdown from raw items
  const typeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number }>();
    items.forEach((item) => {
      const label = formatMovementType(item.type ?? '');
      if (!map.has(label)) map.set(label, { count: 0, totalQty: 0 });
      const entry = map.get(label)!;
      entry.count++;
      entry.totalQty += Math.abs(item.quantity ?? 0);
    });
    return Array.from(map.entries())
      .map(([type, vals]) => ({ type, ...vals }))
      .sort((a, b) => b.totalQty - a.totalQty);
  }, [items]);

  // Summary
  const summary = useMemo(() => {
    let inbound = 0,
      outbound = 0;
    items.forEach((item) => {
      const qty = Math.abs(item.quantity ?? 0);
      if (INBOUND_TYPES.includes(item.type ?? '')) inbound += qty;
      else outbound += qty;
    });
    return { inbound, outbound, net: inbound - outbound, total: items.length };
  }, [items]);

  // Top products by volume
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; qty: number }>();
    items.forEach((item) => {
      const key = item.sku ?? item.productName ?? '';
      if (!map.has(key))
        map.set(key, { name: item.productName ?? '', sku: item.sku ?? '', qty: 0 });
      map.get(key)!.qty += Math.abs(item.quantity ?? 0);
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [items]);

  const typeBreakdownConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    typeBreakdown.forEach((t) => {
      config[t.type] = { label: t.type, color: TYPE_COLORS[t.type] ?? 'var(--chart-3)' };
    });
    return config satisfies ChartConfig;
  }, [typeBreakdown]);

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
      {/* Period Selector + Summary */}
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
          <span className="text-xs text-muted-foreground ml-2">{total} movements found</span>
        </div>

        <ExportButton
          type="stock_movements"
          warehouseId={warehouseId}
          filters={{ dateFrom: fromDate.toISOString(), dateTo: toDate.toISOString() }}
          label="Export CSV"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Inbound</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-2)]">
              {summary.inbound.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Units received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Outbound</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-[var(--chart-1)]">
              {summary.outbound.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Units dispatched</p>
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
            <p className="text-xs text-muted-foreground mt-0.5">Inbound - Outbound</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{summary.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Transactions in period</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Line Chart */}
      {dailyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movement Trend</CardTitle>
            <CardDescription>Daily inbound vs outbound flow</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={flowConfig} className="h-[250px] w-full">
              <LineChart data={dailyTrend} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="inbound"
                  stroke="var(--color-inbound)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="outbound"
                  stroke="var(--color-outbound)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Type Breakdown + Top Products */}
      <div className="grid gap-4 lg:grid-cols-2">
        {typeBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Movement Types</CardTitle>
              <CardDescription>Breakdown by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={typeBreakdownConfig} className="h-[220px] w-full">
                <BarChart
                  data={typeBreakdown}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis dataKey="type" type="category" width={90} tick={{ fontSize: 11 }} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalQty" radius={[0, 3, 3, 0]} barSize={16}>
                    {typeBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={TYPE_COLORS[entry.type] ?? 'var(--chart-3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Volume</CardTitle>
              <CardDescription>Highest movement volume in period</CardDescription>
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
                    <span className="text-sm font-bold font-mono">{p.qty.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement Ledger</CardTitle>
          <CardDescription>
            All movements in the selected period ({items.length} of {total})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No movements in the selected period
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.slice(0, 50).map((item: any) => {
                  const isInbound = INBOUND_TYPES.includes(item.type ?? '');
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
                            isInbound
                              ? 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]'
                              : 'bg-destructive/15 text-destructive'
                          }`}
                        >
                          {formatMovementType(item.type ?? '')}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-semibold ${isInbound ? 'text-[var(--chart-2)]' : 'text-destructive'}`}
                      >
                        {(item.quantity ?? 0) > 0 ? '+' : ''}
                        {item.quantity ?? 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.referenceId
                          ? `${item.referenceType ?? ''} #${item.referenceId.slice(0, 8)}`
                          : '-'}
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
