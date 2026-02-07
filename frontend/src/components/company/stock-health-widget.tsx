'use client';

import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle } from 'lucide-react';
import { GET_COMPANY_STOCK_HEALTH, CompanyStockHealth } from '@/lib/graphql/stock-health';

interface StockHealthWidgetProps {
  companySlug: string;
}

export function StockHealthWidget({ companySlug }: StockHealthWidgetProps) {
  const { data, loading } = useQuery(GET_COMPANY_STOCK_HEALTH);

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

  const flagged = critical + atRisk + blocked + lowStock;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Stock Health Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div
            className={
              critical > 0
                ? 'flex justify-between items-center p-2 rounded-lg bg-destructive/10'
                : 'flex justify-between items-center p-2 rounded-lg border bg-muted/40'
            }
          >
            <span className="text-sm flex items-center gap-2">
              <XCircle
                className={
                  critical > 0 ? 'h-4 w-4 text-destructive' : 'h-4 w-4 text-muted-foreground'
                }
              />
              <span className="font-medium">Critical Products</span>
            </span>
            <Badge variant={critical > 0 ? 'destructive' : 'secondary'}>{critical}</Badge>
          </div>

          <div
            className={
              blocked > 0
                ? 'flex justify-between items-center p-2 rounded-lg bg-secondary/50'
                : 'flex justify-between items-center p-2 rounded-lg border bg-muted/40'
            }
          >
            <span className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Blocked (Expired)</span>
            </span>
            <Badge
              variant={blocked > 0 ? 'secondary' : 'outline'}
              className={blocked > 0 ? undefined : 'border-border text-foreground'}
            >
              {blocked}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg border bg-muted/40">
            <span className="text-sm flex items-center gap-2">
              <AlertTriangle
                className={
                  lowStock > 0 ? 'h-4 w-4 text-[var(--chart-4)]' : 'h-4 w-4 text-muted-foreground'
                }
              />
              <span className="font-medium">Low Stock</span>
            </span>
            <Badge variant="outline" className="border-border text-foreground">
              {lowStock}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-2 rounded-lg border bg-muted/40">
            <span className="text-sm flex items-center gap-2">
              <AlertTriangle
                className={
                  atRisk > 0 ? 'h-4 w-4 text-[var(--chart-4)]' : 'h-4 w-4 text-muted-foreground'
                }
              />
              <span className="font-medium">At Risk (Expiring)</span>
            </span>
            <Badge variant="outline" className="border-border text-foreground">
              {atRisk}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {flagged === 0
            ? `All clear — no flagged products right now. Healthy products: ${healthy}.`
            : `Flagged products: ${flagged} · Healthy products: ${healthy}`}
        </div>
      </CardContent>
    </Card>
  );
}
