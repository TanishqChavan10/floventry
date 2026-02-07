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

type RiskLabel = 'Healthy' | 'At-risk' | 'Critical';

export function WarehouseOverview({ companySlug, data }: WarehouseOverviewProps) {
  const warehouses = data?.warehouseHealthSnapshot ?? [];

  const getRisk = (
    riskBadge: string,
  ): { label: RiskLabel; variant: 'destructive' | 'secondary' | 'outline' } => {
    if (riskBadge === 'CRITICAL') {
      return { label: 'Critical', variant: 'destructive' };
    }
    if (riskBadge === 'WARNING') {
      return { label: 'At-risk', variant: 'secondary' };
    }
    return { label: 'Healthy', variant: 'outline' };
  };

  const getHint = (riskLabel: RiskLabel) => {
    if (riskLabel === 'Critical') return 'Needs attention today';
    if (riskLabel === 'At-risk') return 'Review soon to avoid issues';
    return 'No major risk signals';
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
                  {(() => {
                    const risk = getRisk(warehouse.riskBadge);
                    return <Badge variant={risk.variant}>{risk.label}</Badge>;
                  })()}
                </div>
                {(() => {
                  const risk = getRisk(warehouse.riskBadge);
                  return (
                    <p className="text-xs text-muted-foreground">
                      Healthy stock coverage • {getHint(risk.label)}
                    </p>
                  );
                })()}

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, warehouse.okPercent))}%` }}
                  />
                </div>

                {warehouse.warehouseSlug ? (
                  <Link href={`/${companySlug}/warehouses/${warehouse.warehouseSlug}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Open warehouse
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Open warehouse
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
