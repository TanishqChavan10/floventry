'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockMovements = [
  {
    id: '1',
    date: '2024-12-12',
    time: '14:30',
    type: 'IN',
    product: 'Industrial Safety Helmet',
    quantity: 50,
    user: 'Rajesh Kumar',
    reference: 'PO-2024-001',
  },
  {
    id: '2',
    date: '2024-12-12',
    time: '13:15',
    type: 'OUT',
    product: 'Steel Wire Rope 10mm',
    quantity: 30,
    user: 'Amit Singh',
    reference: 'SO-2024-045',
  },
  {
    id: '3',
    date: '2024-12-12',
    time: '11:20',
    type: 'TRANSFER',
    product: 'Industrial Gloves',
    quantity: 150,
    user: 'Priya Sharma',
    reference: 'TRF-089',
  },
  {
    id: '4',
    date: '2024-12-11',
    time: '16:45',
    type: 'IN',
    product: 'LED Floodlight 100W',
    quantity: 80,
    user: 'Rajesh Kumar',
    reference: 'PO-2024-002',
  },
];

function StockMovementsContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Movements</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Track all stock in/out transactions
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMovements.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mockMovements.filter((m) => m.type === 'IN').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {mockMovements.filter((m) => m.type === 'OUT').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Movement Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-mono text-sm">
                      {movement.date} {movement.time}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.type === 'IN'
                            ? 'default'
                            : movement.type === 'OUT'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{movement.product}</TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {movement.user}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{movement.reference}</TableCell>
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

export default function StockMovementsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <StockMovementsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
