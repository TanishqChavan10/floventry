'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockExpiryItems = [
  {
    id: '1',
    product: 'Medical Supplies Batch A',
    sku: 'MED-001',
    quantity: 120,
    expiryDate: '2024-12-20',
    daysRemaining: 8,
    status: 'critical',
  },
  {
    id: '2',
    product: 'Chemical Compound X',
    sku: 'CHM-105',
    quantity: 85,
    expiryDate: '2025-01-15',
    daysRemaining: 34,
    status: 'warning',
  },
];

function ExpiryContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Expiry Tracking</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor product expiration dates
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical (≤10 days)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {mockExpiryItems.filter((i) => i.status === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning (11-30 days)</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockExpiryItems.filter((i) => i.status === 'warning').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Expirations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExpiryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.expiryDate}</TableCell>
                    <TableCell
                      className={item.status === 'critical' ? 'text-red-600 font-semibold' : 'text-orange-600 font-semibold'}
                    >
                      {item.daysRemaining} days
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'critical' ? 'destructive' : 'secondary'}>
                        {item.status === 'critical' ? 'Critical' : 'Warning'}
                      </Badge>
                    </TableCell>
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

export default function ExpiryPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <ExpiryContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
