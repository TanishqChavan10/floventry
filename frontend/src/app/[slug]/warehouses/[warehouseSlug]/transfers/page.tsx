'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRightLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockTransfers = [
  {
    id: '1',
    transferNo: 'TRF-089',
    product: 'Industrial Gloves',
    quantity: 150,
    from: 'Main Warehouse',
    to: 'South Warehouse',
    status: 'completed',
    date: '2024-12-12',
  },
  {
    id: '2',
    transferNo: 'TRF-088',
    product: 'Safety Helmets',
    quantity: 50,
    from: 'Main Warehouse',
    to: 'North Warehouse',
    status: 'in_transit',
    date: '2024-12-11',
  },
];

function TransfersContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Stock Transfers
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Inter-warehouse transfers
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTransfers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono text-sm">{transfer.transferNo}</TableCell>
                    <TableCell className="font-medium">{transfer.product}</TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>{transfer.from}</TableCell>
                    <TableCell>{transfer.to}</TableCell>
                    <TableCell>{transfer.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={transfer.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {transfer.status === 'completed' ? 'Completed' : 'In Transit'}
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

export default function TransfersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['MANAGER', 'STAFF']}>
        <TransfersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
