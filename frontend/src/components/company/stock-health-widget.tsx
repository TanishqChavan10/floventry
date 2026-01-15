'use client';

import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { GET_COMPANY_STOCK_HEALTH, CompanyStockHealth } from '@/lib/graphql/stock-health';
import Link from 'next/link';

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

  const hasIssues = critical > 0 || atRisk > 0 || blocked > 0 || lowStock > 0;

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
          {critical > 0 && (
            <div className="flex justify-between items-center p-2 rounded-lg bg-destructive/10">
              <span className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium">Critical Products</span>
              </span>
              <Badge variant="destructive">{critical}</Badge>
            </div>
          )}
          {blocked > 0 && (
            <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/50">
              <span className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Blocked (Expired)</span>
              </span>
              <Badge variant="secondary">{blocked}</Badge>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex justify-between items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <span className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Low Stock</span>
              </span>
              <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400">
                {lowStock}
              </Badge>
            </div>
          )}
          {atRisk > 0 && (
            <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <span className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">At Risk (Expiring)</span>
              </span>
              <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                {atRisk}
              </Badge>
            </div>
          )}
          {!hasIssues && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">All stock levels are healthy</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
