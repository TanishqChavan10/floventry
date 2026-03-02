'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { GET_PURCHASE_ORDERS } from '@/lib/graphql/purchase-orders';
import { subDays, format } from 'date-fns';

const PERIODS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
  { label: 'All', value: 0 },
];

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', ORDERED: 'Ordered', CLOSED: 'Closed', CANCELLED: 'Cancelled' };

const statusConfig = {
  draft: { label: 'Draft', color: 'var(--chart-3)' },
  ordered: { label: 'Ordered', color: 'var(--chart-1)' },
  closed: { label: 'Closed', color: 'var(--chart-2)' },
  cancelled: { label: 'Cancelled', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const supplierConfig = {
  total: { label: 'Total', color: 'var(--chart-3)' },
  closed: { label: 'Closed', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const fulfillmentConfig = {
  ordered: { label: 'Ordered', color: 'var(--chart-3)' },
  received: { label: 'Received', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    ORDERED: 'bg-[var(--chart-1)]/10 text-[var(--chart-1)]',
    CLOSED: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]',
    CANCELLED: 'bg-destructive/10 text-destructive',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PurchaseOrdersReport() {
  const [days, setDays] = useState(90);

  const filters = useMemo(() => {
    if (days === 0) return { limit: 500, offset: 0 };
    return { limit: 500, offset: 0, from_date: subDays(new Date(), days).toISOString() };
  }, [days]);

  const { data, loading } = useQuery(GET_PURCHASE_ORDERS, {
    variables: { filters }, fetchPolicy: 'cache-and-network',
  });

  const orders: Array<{
    id: string; po_number: string; status: string;
    supplier: { id: string; name: string };
    warehouse: { id: string; name: string };
    items: Array<{ ordered_quantity: number; received_quantity: number; product: { name: string } }>;
    created_at: string;
  }> = data?.purchaseOrders ?? [];

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { DRAFT: 0, ORDERED: 0, CLOSED: 0, CANCELLED: 0 };
    orders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [orders]);

  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ name: status.toLowerCase(), value: count, fill: `var(--color-${status.toLowerCase()})` }));

  const supplierData = useMemo(() => {
    const m: Record<string, { name: string; total: number; closed: number }> = {};
    orders.forEach((o) => {
      if (!m[o.supplier.id]) m[o.supplier.id] = { name: o.supplier.name, total: 0, closed: 0 };
      m[o.supplier.id].total += 1;
      if (o.status === 'CLOSED') m[o.supplier.id].closed += 1;
    });
    return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 10)
      .map((s) => ({ name: s.name.length > 16 ? s.name.slice(0, 16) + '...' : s.name, total: s.total, closed: s.closed }));
  }, [orders]);

  const fulfillmentData = useMemo(() => {
    const m: Record<string, { name: string; ordered: number; received: number }> = {};
    orders.forEach((o) => {
      if (!m[o.supplier.id]) m[o.supplier.id] = { name: o.supplier.name, ordered: 0, received: 0 };
      o.items.forEach((item) => {
        m[o.supplier.id].ordered += Number(item.ordered_quantity);
        m[o.supplier.id].received += Number(item.received_quantity);
      });
    });
    return Object.values(m).sort((a, b) => b.ordered - a.ordered).slice(0, 10)
      .map((s) => ({ name: s.name.length > 16 ? s.name.slice(0, 16) + '...' : s.name, ordered: s.ordered, received: s.received }));
  }, [orders]);

  const totalOrdered = fulfillmentData.reduce((s, d) => s + d.ordered, 0);
  const totalReceived = fulfillmentData.reduce((s, d) => s + d.received, 0);
  const rate = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);

  return (
    <div className="space-y-4">
      {/* Period */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Purchase order analytics</p>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setDays(p.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${days === p.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total POs', value: orders.length },
          { label: 'Ordered', value: statusCounts.ORDERED, color: 'text-[var(--chart-1)]' },
          { label: 'Closed', value: statusCounts.CLOSED, color: 'text-[var(--chart-2)]' },
          {
            label: 'Fulfillment',
            value: `${rate}%`,
            color: rate >= 80 ? 'text-[var(--chart-2)]' : rate >= 50 ? 'text-[var(--chart-4)]' : 'text-destructive',
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color ?? ''}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status + Supplier */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>POs by status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data ? <Skeleton className="h-[200px] w-full" /> :
             pieData.length === 0 ? <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No POs found</div> :
            <>
              <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[200px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2} />
                </PieChart>
              </ChartContainer>
              <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
                {pieData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                    {statusConfig[d.name as keyof typeof statusConfig]?.label}: {d.value}
                  </span>
                ))}
              </div>
            </>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Supplier</CardTitle>
            <CardDescription>Top suppliers by PO count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data ? <Skeleton className="h-[200px] w-full" /> :
             supplierData.length === 0 ? <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No data</div> :
            <ChartContainer config={supplierConfig} className="h-[200px] w-full">
              <BarChart data={supplierData} layout="vertical">
                <CartesianGrid horizontal={false} vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="total" fill="var(--color-total)" stackId="a" />
                <Bar dataKey="closed" fill="var(--color-closed)" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>}
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment */}
      <Card>
        <CardHeader>
          <CardTitle>Fulfillment by Supplier</CardTitle>
          <CardDescription>Ordered vs received — {rate}% overall</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? <Skeleton className="h-[240px] w-full" /> :
           fulfillmentData.length === 0 ? <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No data</div> :
          <ChartContainer config={fulfillmentConfig} className="w-full" style={{ height: Math.max(180, fulfillmentData.length * 40) }}>
            <BarChart data={fulfillmentData} layout="vertical">
              <CartesianGrid horizontal={false} vertical={false} />
              <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="ordered" fill="var(--color-ordered)" name="Ordered" />
              <Bar dataKey="received" fill="var(--color-received)" name="Received" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>}
        </CardContent>
      </Card>

      {/* Recent */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? <Skeleton className="h-32 w-full" /> :
           recentOrders.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No orders found</p> :
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-medium">{o.po_number}</TableCell>
                  <TableCell className="font-medium">{o.supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{o.warehouse.name}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-right">{o.items.length}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{format(new Date(o.created_at), 'dd MMM yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>}
        </CardContent>
      </Card>
    </div>
  );
}