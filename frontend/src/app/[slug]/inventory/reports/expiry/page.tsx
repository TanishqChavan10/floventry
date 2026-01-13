'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Building2, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GET_COMPANY_DASHBOARD } from '@/lib/graphql/company-dashboard';
import Link from 'next/link';

function CompanyExpiryReportsContent() {
  const params = useParams();
  const companySlug = params.slug as string;

  const { data: dashboardData, loading } = useQuery(GET_COMPANY_DASHBOARD);

  const expiryRisk = dashboardData?.companyDashboard?.expiry_risk_distribution || {
    ok: 0,
    expiring_soon: 0,
    expired: 0,
  };

  const warehouseHealth = dashboardData?.companyDashboard?.warehouse_health_snapshot || [];

  // Calculate totals
  const totalLots = expiryRisk.ok + expiryRisk.expiring_soon + expiryRisk.expired;
  const riskPercentage = totalLots > 0
    ? Math.round(((expiryRisk.expired + expiryRisk.expiring_soon) / totalLots) * 100)
    : 0;

  // Sort warehouses by risk (CRITICAL first)
  const sortedWarehouses = useMemo(() => {
    return [...warehouseHealth].sort((a, b) => {
      const riskOrder = { CRITICAL: 0, WARNING: 1, OK: 2 };
      return riskOrder[a.risk_badge as keyof typeof riskOrder] - riskOrder[b.risk_badge as keyof typeof riskOrder];
    });
  }, [warehouseHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading company expiry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Company Expiry Risk Report
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Cross-warehouse expiry visibility and risk assessment
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Overall Statistics */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLots}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all warehouses
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Lots</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiryRisk.expired}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require immediate action
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiryRisk.expiring_soon}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Within 30 days
              </p>
            </CardContent>
          </Card>

          <Card className={
            riskPercentage > 30
              ? 'border-red-200 dark:border-red-900'
              : riskPercentage > 15
              ? 'border-orange-200 dark:border-orange-900'
              : 'border-green-200 dark:border-green-900'
          }>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${
                riskPercentage > 30
                  ? 'text-red-500'
                  : riskPercentage > 15
                  ? 'text-orange-500'
                  : 'text-green-500'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                riskPercentage > 30
                  ? 'text-red-600'
                  : riskPercentage > 15
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}>
                {riskPercentage}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Of total lots at risk
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expiry Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Expired</span>
                  <span className="text-red-600 font-semibold">
                    {expiryRisk.expired} ({totalLots > 0 ? Math.round((expiryRisk.expired / totalLots) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${totalLots > 0 ? (expiryRisk.expired / totalLots) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Expiring Soon (≤30 days)</span>
                  <span className="text-orange-600 font-semibold">
                    {expiryRisk.expiring_soon} ({totalLots > 0 ? Math.round((expiryRisk.expiring_soon / totalLots) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${totalLots > 0 ? (expiryRisk.expiring_soon / totalLots) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Healthy (﹥30 days)</span>
                  <span className="text-green-600 font-semibold">
                    {expiryRisk.ok} ({totalLots > 0 ? Math.round((expiryRisk.ok / totalLots) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${totalLots > 0 ? (expiryRisk.ok / totalLots) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Risk Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Warehouse Risk Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouseHealth.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No warehouse data available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWarehouses.map((warehouse: any) => (
                    <TableRow key={warehouse.warehouse_id}>
                      <TableCell className="font-medium">{warehouse.warehouse_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">{warehouse.ok_percent}%</div>
                          <div className="text-xs text-muted-foreground">healthy</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            warehouse.risk_badge === 'CRITICAL'
                              ? 'destructive'
                              : warehouse.risk_badge === 'WARNING'
                              ? 'secondary'
                              : 'default'
                          }
                          className={
                            warehouse.risk_badge === 'CRITICAL'
                              ? 'bg-red-600 hover:bg-red-700'
                              : warehouse.risk_badge === 'WARNING'
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'bg-green-600 hover:bg-green-700'
                          }
                        >
                          {warehouse.risk_badge}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${companySlug}/warehouses/${warehouse.warehouse_slug}/expiry`}
                          className="text-sm text-primary hover:underline"
                        >
                          View Details →
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CompanyExpiryReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <CompanyExpiryReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
