'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useCompanyStockHealth } from '@/hooks/apollo';
import type { CompanyStockHealth } from '@/lib/graphql/stock-health';
import { Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface StockHealthWidgetProps {
  companySlug: string;
}

const healthChartConfig = {
  healthy: { label: 'Healthy', color: 'var(--chart-2)' },
  lowStock: { label: 'Low Stock', color: 'var(--chart-4)' },
  atRisk: { label: 'At Risk', color: 'var(--chart-3)' },
  blocked: { label: 'Blocked', color: 'var(--chart-1)' },
  critical: { label: 'Critical', color: '#B71C1C' },
} satisfies ChartConfig;

export function StockHealthWidget({ companySlug }: StockHealthWidgetProps) {
  const { data, loading } = useCompanyStockHealth();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Stock Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const healthData: CompanyStockHealth[] = data?.companyStockHealth || [];
  const critical = healthData.filter((p) => p.state === 'CRITICAL').length;
  const atRisk = healthData.filter((p) => p.state === 'AT_RISK').length;
  const blocked = healthData.filter((p) => p.state === 'BLOCKED').length;
  const lowStock = healthData.filter((p) => p.state === 'LOW_STOCK').length;
  const healthy = healthData.filter((p) => p.state === 'HEALTHY').length;

  const total = critical + atRisk + blocked + lowStock + healthy;
  const flagged = critical + atRisk + blocked + lowStock;

  const pieData = [
    { name: 'healthy', value: healthy, fill: 'var(--color-healthy)' },
    { name: 'lowStock', value: lowStock, fill: 'var(--color-lowStock)' },
    { name: 'atRisk', value: atRisk, fill: 'var(--color-atRisk)' },
    { name: 'blocked', value: blocked, fill: 'var(--color-blocked)' },
    { name: 'critical', value: critical, fill: 'var(--color-critical)' },
  ].filter((d) => d.value > 0);

  const legendItems = [
    { key: 'healthy', label: 'Healthy', value: healthy, color: 'var(--chart-2)' },
    { key: 'lowStock', label: 'Low Stock', value: lowStock, color: 'var(--chart-4)' },
    { key: 'atRisk', label: 'At Risk', value: atRisk, color: 'var(--chart-3)' },
    { key: 'blocked', label: 'Blocked', value: blocked, color: 'var(--chart-1)' },
    { key: 'critical', label: 'Critical', value: critical, color: '#B71C1C' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Stock Health Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No products found
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ChartContainer
              config={healthChartConfig}
              className="mx-auto aspect-square max-h-[180px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                />
              </PieChart>
            </ChartContainer>

            <div className="w-full space-y-1.5">
              {legendItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-medium">
                    {item.value}
                    {total > 0 && (
                      <span className="text-muted-foreground text-xs ml-1">
                        ({Math.round((item.value / total) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full text-xs text-muted-foreground text-center pt-1 border-t">
              {flagged === 0
                ? `All clear — ${healthy} healthy product${healthy === 1 ? '' : 's'}`
                : `${flagged} flagged · ${healthy} healthy`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
