'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Warehouse } from 'lucide-react';
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
  const pageSize = 3;
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(warehouses.length / pageSize));
  const startIndex = pageIndex * pageSize;

  useEffect(() => {
    if (warehouses.length === 0) {
      setPageIndex(0);
      return;
    }
    setPageIndex((prev) => Math.min(prev, Math.max(0, pageCount - 1)));
  }, [pageCount, warehouses.length]);

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
        <div className="flex items-center gap-2">
          <Link href={`/${companySlug}/warehouses`}>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </div>

      {warehouses.length > 0 && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            disabled={pageIndex <= 0}
            aria-label="Previous warehouses"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${pageIndex * 100}%)` }}
              >
                {Array.from({ length: pageCount }).map((_, page) => {
                  const pageStart = page * pageSize;
                  const pageItems = warehouses.slice(pageStart, pageStart + pageSize);

                  return (
                    <div key={page} className="w-full shrink-0">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pageItems.map((warehouse) => (
                          <Card
                            key={warehouse.warehouseId}
                            className="hover:shadow-lg transition-shadow"
                          >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">
                                {warehouse.warehouseName}
                              </CardTitle>
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
                                    style={{
                                      width: `${Math.min(100, Math.max(0, warehouse.okPercent))}%`,
                                    }}
                                  />
                                </div>

                                {warehouse.warehouseSlug ? (
                                  <Link
                                    href={`/${companySlug}/warehouses/${warehouse.warehouseSlug}`}
                                  >
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
            disabled={pageIndex >= pageCount - 1}
            aria-label="Next warehouses"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

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
