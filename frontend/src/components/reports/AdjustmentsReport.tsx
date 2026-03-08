'use client';

import React, { useState } from 'react';
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
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
import {
  useAdjustmentTrends,
  useAdjustmentsByWarehouse,
  useAdjustmentsByUser,
} from '@/hooks/apollo';

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const trendConfig = {
  adjIn: { label: 'Adj. In', color: 'var(--chart-2)' },
  adjOut: { label: 'Adj. Out', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const warehouseConfig = {
  adjustments: { label: 'Adjustments', color: 'var(--chart-4)' },
} satisfies ChartConfig;

export function AdjustmentsReport() {
  const [days, setDays] = useState(30);

  const { data: trendsData, loading: trendsLoading } = useAdjustmentTrends({ days });
  const { data: byWarehouseData, loading: byWarehouseLoading } = useAdjustmentsByWarehouse({
    days,
  });
  const { data: byUserData, loading: byUserLoading } = useAdjustmentsByUser({ days, limit: 10 });

  const trendData = (trendsData?.adjustmentTrends ?? []).map((d: any) => ({
    date: (() => {
      const dt = new Date(d.date);
      return Number.isNaN(dt.getTime())
        ? String(d.date)
        : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    })(),
    adjIn: Number(d.adjustmentInQuantity ?? 0),
    adjOut: Number(d.adjustmentOutQuantity ?? 0),
  }));

  const warehouseData = (byWarehouseData?.adjustmentsByWarehouse ?? []).map((d: any) => ({
    name:
      String(d.warehouseName).length > 16
        ? String(d.warehouseName).slice(0, 16) + '...'
        : d.warehouseName,
    adjustments: Number(d.totalAdjustments ?? 0),
  }));

  const userRows: Array<{
    userId: string;
    userName: string;
    adjustmentCount: number;
    totalQuantity: number;
  }> = byUserData?.adjustmentsByUser ?? [];

  const totalIn = trendData.reduce((s: number, d: { adjIn: number }) => s + d.adjIn, 0);
  const totalOut = trendData.reduce((s: number, d: { adjOut: number }) => s + d.adjOut, 0);
  const totalCount = userRows.reduce((s, u) => s + u.adjustmentCount, 0);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Adjustment activity for selected period</p>
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
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Adjustments</p>
            <p className="text-xl font-bold mt-1">{totalCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Units Added</p>
            <p className="text-xl font-bold mt-1 text-[var(--chart-2)]">
              +{totalIn.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Units Removed</p>
            <p className="text-xl font-bold mt-1 text-[var(--chart-1)]">
              -{totalOut.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment Trends</CardTitle>
          <CardDescription>Daily units added vs removed</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading && !trendsData ? (
            <Skeleton className="h-[260px] w-full" />
          ) : trendData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              No data for this period
            </div>
          ) : (
            <ChartContainer config={trendConfig} className="h-[260px] w-full">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="adjIn"
                  stroke="var(--color-adjIn)"
                  strokeWidth={2}
                  dot={false}
                  name="Adj. In"
                />
                <Line
                  type="monotone"
                  dataKey="adjOut"
                  stroke="var(--color-adjOut)"
                  strokeWidth={2}
                  dot={false}
                  name="Adj. Out"
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* By Warehouse + By User */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Warehouse</CardTitle>
            <CardDescription>Adjustment count per warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            {byWarehouseLoading && !byWarehouseData ? (
              <Skeleton className="h-[220px] w-full" />
            ) : warehouseData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <ChartContainer config={warehouseConfig} className="h-[220px] w-full">
                <BarChart data={warehouseData} layout="vertical">
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
                  <Bar dataKey="adjustments" fill="var(--color-adjustments)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Staff</CardTitle>
            <CardDescription>Most adjustments by team member</CardDescription>
          </CardHeader>
          <CardContent>
            {byUserLoading && !byUserData ? (
              <Skeleton className="h-[220px] w-full" />
            ) : userRows.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRows.map((row, i) => (
                    <TableRow key={row.userId}>
                      <TableCell>
                        <span className="text-muted-foreground text-xs mr-2">{i + 1}.</span>
                        <span className="font-medium">{row.userName}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.adjustmentCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.totalQuantity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
