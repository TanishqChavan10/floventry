'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { CompanyDashboardData } from '@/lib/graphql/company-dashboard';

interface InventorySnapshotProps {
  companySlug: string;
  data?: CompanyDashboardData;
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function InventorySnapshot({ companySlug, data }: InventorySnapshotProps) {
  const kpis = data?.kpis ?? {
    totalSkus: 0,
    warehouses: 0,
    totalStockUnits: 0,
    stockAtRisk: 0,
    expiredStockUnits: 0,
    movements7d: { inUnits: 0, outUnits: 0 },
    movements30d: { inUnits: 0, outUnits: 0 },
  };

  const stockStatus = data?.stockStatusDistribution ?? { ok: 0, low: 0, critical: 0 };
  const expiryRisk = data?.expiryRiskDistribution ?? { ok: 0, expiringSoon: 0, expired: 0 };
  const alerts = data?.activeAlertsSummary ?? {
    critical: 0,
    warning: 0,
    lowStock: 0,
    expiry: 0,
    importIssues: 0,
  };

  const stockTotal = stockStatus.ok + stockStatus.low + stockStatus.critical;
  const expiryTotal = expiryRisk.ok + expiryRisk.expiringSoon + expiryRisk.expired;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Inventory Snapshot</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalSkus.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.warehouses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalStockUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all warehouses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
              {kpis.stockAtRisk.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Includes low/critical + expiring soon
            </p>
            {kpis.expiredStockUnits > 0 && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {kpis.expiredStockUnits.toLocaleString()} expired units
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Health Distributions</CardTitle>
              <CardDescription>Stock levels and expiry risk</CardDescription>
            </div>
            <Link href={`/${companySlug}/notifications`}>
              <Button variant="outline" size="sm">
                View Alerts
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm font-semibold">Stock Status</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">OK</span>
                  <span className="font-medium">
                    {stockStatus.ok.toLocaleString()} ({percent(stockStatus.ok, stockTotal)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Low</span>
                  <span className="font-medium">
                    {stockStatus.low.toLocaleString()} ({percent(stockStatus.low, stockTotal)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Critical</span>
                  <span className="font-medium">
                    {stockStatus.critical.toLocaleString()} (
                    {percent(stockStatus.critical, stockTotal)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">Expiry Risk</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">OK</span>
                  <span className="font-medium">
                    {expiryRisk.ok.toLocaleString()} ({percent(expiryRisk.ok, expiryTotal)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expiring soon</span>
                  <span className="font-medium">
                    {expiryRisk.expiringSoon.toLocaleString()} (
                    {percent(expiryRisk.expiringSoon, expiryTotal)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expired</span>
                  <span className="font-medium">
                    {expiryRisk.expired.toLocaleString()} (
                    {percent(expiryRisk.expired, expiryTotal)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="text-sm font-semibold mb-3">Active Alerts</div>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="text-sm">
                <div className="font-semibold text-red-600">{alerts.critical.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-orange-600">
                  {alerts.warning.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Warning</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{alerts.lowStock.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Low stock</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{alerts.expiry.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Expiry</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{alerts.importIssues.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Imports</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
