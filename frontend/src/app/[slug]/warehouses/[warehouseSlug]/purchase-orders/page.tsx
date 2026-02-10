'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockPOs = [
  {
    id: '1',
    poNumber: 'PO-2024-001',
    supplier: 'SafeGuard Industries',
    items: 5,
    amount: '₹45,000',
    status: 'pending',
    date: '2024-12-10',
  },
  {
    id: '2',
    poNumber: 'PO-2024-002',
    supplier: 'MetalCraft Ltd',
    items: 3,
    amount: '₹32,000',
    status: 'approved',
    date: '2024-12-08',
  },
];

function WarehousePurchaseOrdersContent() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
              <p className="text-muted-foreground mt-2">Orders for this warehouse</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockPOs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹77,000</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm">{po.poNumber}</TableCell>
                      <TableCell className="font-medium">{po.supplier}</TableCell>
                      <TableCell>{po.items} items</TableCell>
                      <TableCell className="font-semibold">{po.amount}</TableCell>
                      <TableCell>{po.date}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === 'approved' ? 'default' : 'secondary'}>
                          {po.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function WarehousePurchaseOrdersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehousePurchaseOrdersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
