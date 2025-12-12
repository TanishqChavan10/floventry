'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockDamagedItems = [
  {
    id: '1',
    product: 'Industrial Safety Helmet',
    sku: 'PRD-001',
    quantity: 12,
    reason: 'Manufacturing defect',
    reportedBy: 'Rajesh Kumar',
    date: '2024-12-10',
    status: 'pending',
  },
  {
    id: '2',
    product: 'Steel Wire Rope',
    sku: 'PRD-002',
    quantity: 5,
    reason: 'Damaged during transport',
    reportedBy: 'Amit Singh',
    date: '2024-12-08',
    status: 'resolved',
  },
];

function DamagedContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Damaged Stock
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Report and track damaged inventory
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Report Damage
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Damaged Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {mockDamagedItems.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockDamagedItems.filter((i) => i.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Damaged Stock Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDamagedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell className="text-red-600">{item.quantity}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {item.reason}
                    </TableCell>
                    <TableCell>{item.reportedBy}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'resolved' ? 'default' : 'destructive'}>
                        {item.status === 'resolved' ? 'Resolved' : 'Pending'}
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

export default function DamagedPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['MANAGER', 'STAFF']}>
        <DamagedContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
