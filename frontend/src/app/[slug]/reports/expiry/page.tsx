'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Download, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockExpiryData = [
  {
    id: '1',
    productName: 'Medical Supplies Batch A',
    sku: 'MED-001',
    warehouse: 'Main Warehouse',
    quantity: 450,
    expiryDate: '2024-12-20',
    daysRemaining: 8,
    status: 'critical',
  },
  {
    id: '2',
    productName: 'Chemical Compound X',
    sku: 'CHM-105',
    warehouse: 'South Warehouse',
    quantity: 230,
    expiryDate: '2025-01-15',
    daysRemaining: 34,
    status: 'warning',
  },
  {
    id: '3',
    productName: 'Food Grade Additives',
    sku: 'FGA-220',
    warehouse: 'North Warehouse',
    quantity: 680,
    expiryDate: '2025-02-28',
    daysRemaining: 78,
    status: 'normal',
  },
  {
    id: '4',
    productName: 'Pharmaceutical Batch B',
    sku: 'PHR-088',
    warehouse: 'Main Warehouse',
    quantity: 120,
    expiryDate: '2024-12-18',
    daysRemaining: 6,
    status: 'critical',
  },
  {
    id: '5',
    productName: 'Perishable Goods Set',
    sku: 'PRG-340',
    warehouse: 'South Warehouse',
    quantity: 340,
    expiryDate: '2025-01-05',
    daysRemaining: 24,
    status: 'warning',
  },
];

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; color: string }> = {
    critical: { variant: 'destructive', label: 'Critical', color: 'text-red-600' },
    warning: { variant: 'secondary', label: 'Warning', color: 'text-orange-600' },
    normal: { variant: 'outline', label: 'Normal', color: 'text-green-600' },
  };
  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
};

function ExpiryReportsContent() {
  const criticalCount = mockExpiryData.filter((item) => item.status === 'critical').length;
  const warningCount = mockExpiryData.filter((item) => item.status === 'warning').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Expiry Reports
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track upcoming product expirations across all warehouses
              </p>
            </div>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical (≤10 days)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <p className="text-xs text-red-600 mt-1">Immediate action required</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning (11-30 days)</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{warningCount}</div>
              <p className="text-xs text-orange-600 mt-1">Plan disposal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items Tracked</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockExpiryData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockExpiryData.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Units at risk</p>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Alert */}
        {criticalCount > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Critical Expiry Alert
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                    {criticalCount} product batch{criticalCount > 1 ? 'es' : ''} will expire within 10
                    days. Immediate action is required to prevent inventory loss.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiry Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Expirations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExpiryData
                  .sort((a, b) => a.daysRemaining - b.daysRemaining)
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell>{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.expiryDate}</TableCell>
                      <TableCell
                        className={
                          item.status === 'critical'
                            ? 'text-red-600 font-semibold'
                            : item.status === 'warning'
                            ? 'text-orange-600 font-semibold'
                            : ''
                        }
                      >
                        {item.daysRemaining} days
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ExpiryReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <ExpiryReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
