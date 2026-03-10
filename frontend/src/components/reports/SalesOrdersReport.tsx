'use client';

import React, { useMemo } from 'react';
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
import { useSalesOrders } from '@/hooks/apollo';
import { format } from 'date-fns';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

const statusConfig = {
  draft: { label: 'Draft', color: 'var(--chart-3)' },
  confirmed: { label: 'Confirmed', color: 'var(--chart-1)' },
  closed: { label: 'Closed', color: 'var(--chart-2)' },
  cancelled: { label: 'Cancelled', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const customerConfig = {
  orders: { label: 'Orders', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const demandConfig = {
  ordered: { label: 'Ordered', color: 'var(--chart-3)' },
  issued: { label: 'Issued', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    CONFIRMED: 'bg-[var(--chart-1)]/10 text-[var(--chart-1)]',
    CLOSED: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]',
    CANCELLED: 'bg-destructive/10 text-destructive',
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SalesOrdersReport() {
  const { plan, loading: planLoading } = require('@/hooks/usePlanTier').usePlanTier();
  const allowed = plan === 'Pro';

  const { data, loading } = useSalesOrders();

  if (!allowed || planLoading) {
    const { PlanGateBlock } = require('@/components/upgrade/PlanGateBlock');
    return (
      <PlanGateBlock
        requiredPlan="Pro"
        featureName="Sales Orders Report"
        description="Unlock sales analytics, fulfillment tracking, and order status insights."
      />
    );
  }

  const orders: Array<{
    id: string;
    order_number: string;
    status: string;
    customer_name: string;
    created_at: string;
    items: Array<{
      id: string;
      ordered_quantity: number;
      issued_quantity: number;
      pending_quantity: number;
      product: { name: string; sku: string };
    }>;
  }> = data?.salesOrders ?? [];

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { DRAFT: 0, CONFIRMED: 0, CLOSED: 0, CANCELLED: 0 };
    orders.forEach((o) => {
      c[o.status] = (c[o.status] ?? 0) + 1;
    });
    return c;
  }, [orders]);

  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({
      name: status.toLowerCase(),
      value: count,
      fill: `var(--color-${status.toLowerCase()})`,
    }));

  const customerData = useMemo(() => {
    const m: Record<string, { name: string; orders: number }> = {};
    orders.forEach((o) => {
      if (!m[o.customer_name]) m[o.customer_name] = { name: o.customer_name, orders: 0 };
      m[o.customer_name].orders += 1;
    });
    return Object.values(m)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10)
      .map((c) => ({
        name: c.name.length > 16 ? c.name.slice(0, 16) + '...' : c.name,
        orders: c.orders,
      }));
  }, [orders]);

  const fulfillment = useMemo(() => {
    let ordered = 0,
      issued = 0,
      pending = 0;
    orders.forEach((o) =>
      (o.items ?? []).forEach((item) => {
        ordered += Number(item.ordered_quantity);
        issued += Number(item.issued_quantity);
        pending += Number(item.pending_quantity);
      }),
    );
    return { ordered, issued, pending };
  }, [orders]);

  const rate =
    fulfillment.ordered > 0 ? Math.round((fulfillment.issued / fulfillment.ordered) * 100) : 0;

  const productDemand = useMemo(() => {
    const m: Record<string, { name: string; ordered: number; issued: number }> = {};
    orders.forEach((o) =>
      (o.items ?? []).forEach((item) => {
        const key = item.product?.sku ?? item.id;
        if (!m[key]) m[key] = { name: item.product?.name ?? key, ordered: 0, issued: 0 };
        m[key].ordered += Number(item.ordered_quantity);
        m[key].issued += Number(item.issued_quantity);
      }),
    );
    return Object.values(m)
      .sort((a, b) => b.ordered - a.ordered)
      .slice(0, 10);
  }, [orders]);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Confirmed', value: statusCounts.CONFIRMED, color: 'text-[var(--chart-1)]' },
          { label: 'Closed', value: statusCounts.CLOSED, color: 'text-[var(--chart-2)]' },
          {
            label: 'Fulfillment',
            value: `${rate}%`,
            color:
              rate >= 80
                ? 'text-[var(--chart-2)]'
                : rate >= 50
                  ? 'text-[var(--chart-4)]'
                  : 'text-destructive',
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

      {/* Status + Customer */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No orders found
              </div>
            ) : (
              <>
                <ChartContainer
                  config={statusConfig}
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
                <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                      {statusConfig[d.name as keyof typeof statusConfig]?.label}: {d.value}
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Customer</CardTitle>
            <CardDescription>Top customers by order count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-[200px] w-full" />
            ) : customerData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <ChartContainer config={customerConfig} className="h-[200px] w-full">
                <BarChart data={customerData} layout="vertical">
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
                  <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment */}
      <Card>
        <CardHeader>
          <CardTitle>Fulfillment</CardTitle>
          <CardDescription>Ordered vs issued across all sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ordered</p>
              <p className="text-xl font-bold">{fulfillment.ordered.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="text-xl font-bold text-[var(--chart-2)]">
                {fulfillment.issued.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-[var(--chart-4)]">
                {fulfillment.pending.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Demand */}
      {productDemand.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Demand</CardTitle>
            <CardDescription>Ordered vs issued units</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={demandConfig}
              className="w-full"
              style={{ height: Math.max(180, productDemand.length * 40) }}
            >
              <BarChart
                data={productDemand.map((p) => ({
                  name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
                  ordered: p.ordered,
                  issued: p.issued,
                }))}
                layout="vertical"
              >
                <CartesianGrid horizontal={false} vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="ordered" fill="var(--color-ordered)" name="Ordered" />
                <Bar
                  dataKey="issued"
                  fill="var(--color-issued)"
                  name="Issued"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest sales orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <Skeleton className="h-32 w-full" />
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No orders found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {o.order_number}
                    </TableCell>
                    <TableCell className="font-medium">{o.customer_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">{o.items?.length ?? 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {format(new Date(o.created_at), 'dd MMM yyyy')}
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
