'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  LineChart,
  Line,
  Legend,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';
import { useMovementTypeBreakdown, useMovementTrends } from '@/hooks/apollo';

interface AnalyticsChartsProps {
  role: string;
  dashboard?: CompanyDashboardData;
}

export default function AnalyticsCharts({ role, dashboard }: AnalyticsChartsProps) {
  const { data: movementBreakdownData, loading: movementBreakdownLoading } =
    useMovementTypeBreakdown({ days: 30 });

  const movementMixChartConfig = {
    qty: {
      label: 'Quantity',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const formatMovementType = (type: string) => {
    switch (type) {
      case 'IN':
        return 'In';
      case 'OUT':
        return 'Out';
      case 'TRANSFER_IN':
        return 'Transfer In';
      case 'TRANSFER_OUT':
        return 'Transfer Out';
      case 'ADJUSTMENT':
        return 'Adjustment';
      case 'ADJUSTMENT_IN':
        return 'Adj. In';
      case 'ADJUSTMENT_OUT':
        return 'Adj. Out';
      case 'OPENING':
        return 'Opening';
      default:
        return String(type || '')
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (m) => m.toUpperCase());
    }
  };

  const movementMixData = (movementBreakdownData?.movementTypeBreakdown ?? []).map((d: any) => ({
    name: formatMovementType(String(d.type)),
    qty: Number(d.totalQuantity ?? 0),
  }));

  const { data: movementTrendsData, loading: movementTrendsLoading } = useMovementTrends({
    days: 30,
  });

  const flowChartConfig = {
    in: {
      label: 'Stock In',
      color: 'var(--chart-2)',
    },
    out: {
      label: 'Stock Out',
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig;

  const flowData = (movementTrendsData?.movementTrends ?? []).map((d: any) => {
    const label = (() => {
      const date = new Date(d.date);
      if (Number.isNaN(date.getTime())) return String(d.date);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    })();

    return {
      name: label,
      in: Number(d.inQuantity ?? 0),
      out: Number(d.outQuantity ?? 0),
    };
  });

  return (
    <Card className="col-span-1 lg:col-span-2 h-full">
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mix" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="mix">Movement Mix</TabsTrigger>
            <TabsTrigger value="flow">Inflow vs Outflow</TabsTrigger>
          </TabsList>

          <TabsContent value="mix" className="h-[300px]">
            {movementBreakdownLoading ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : movementMixData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No movement data yet.
              </div>
            ) : (
              <ChartContainer config={movementMixChartConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  data={movementMixData}
                  margin={{
                    top: 20,
                    right: 12,
                    left: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="qty" fill="var(--color-qty)" radius={8}>
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </TabsContent>

          <TabsContent value="flow" className="h-[300px]">
            {movementTrendsLoading ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : flowData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No movement data yet.
              </div>
            ) : (
              <ChartContainer config={flowChartConfig} className="h-full w-full">
                <LineChart data={flowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="in"
                    stroke="var(--color-in)"
                    strokeWidth={2}
                    dot={false}
                    name="Stock In"
                  />
                  <Line
                    type="monotone"
                    dataKey="out"
                    stroke="var(--color-out)"
                    strokeWidth={2}
                    dot={false}
                    name="Stock Out"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
