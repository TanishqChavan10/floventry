'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';

interface WarehouseOverviewProps {
  companySlug: string;
  data?: CompanyDashboardData;
}

export function WarehouseOverview({ companySlug, data }: WarehouseOverviewProps) {
  const warehouses = data?.warehouseHealthSnapshot ?? [];

  const getBadgeVariant = (riskBadge: string) => {
    if (riskBadge === 'CRITICAL') return 'destructive' as const;
    if (riskBadge === 'WARNING') return 'secondary' as const;
    return 'outline' as const;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Warehouses</h2>
        <Link href={`/${companySlug}/warehouses`}>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.warehouseId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{warehouse.warehouseName}</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{warehouse.okPercent}%</div>
                  <Badge variant={getBadgeVariant(warehouse.riskBadge)}>
                    {warehouse.riskBadge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">OK stock coverage</p>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, warehouse.okPercent))}%` }}
                  />
                </div>

                {warehouse.warehouseSlug ? (
                  <Link href={`/${companySlug}/warehouses/${warehouse.warehouseSlug}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Open Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Open Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No warehouses found for this company.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
