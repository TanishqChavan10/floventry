'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Eye, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';

// Mock data for company-wide purchase orders
const mockPurchaseOrders = [
  {
    id: '1',
    poNumber: 'PO-2024-001',
    warehouse: 'Main Warehouse',
    supplier: 'SafeGuard Industries',
    items: 15,
    totalAmount: '₹1,25,000',
    status: 'pending',
    createdBy: 'Rajesh Kumar',
    createdAt: '2024-12-10',
    expectedDelivery: '2024-12-20',
  },
  {
    id: '2',
    poNumber: 'PO-2024-002',
    warehouse: 'South Warehouse',
    supplier: 'MetalCraft Ltd',
    items: 8,
    totalAmount: '₹85,000',
    status: 'approved',
    createdBy: 'Priya Sharma',
    createdAt: '2024-12-09',
    expectedDelivery: '2024-12-18',
  },
  {
    id: '3',
    poNumber: 'PO-2024-003',
    warehouse: 'North Warehouse',
    supplier: 'TechTools Co',
    items: 22,
    totalAmount: '₹2,45,000',
    status: 'received',
    createdBy: 'Amit Singh',
    createdAt: '2024-12-05',
    expectedDelivery: '2024-12-15',
  },
  {
    id: '4',
    poNumber: 'PO-2024-004',
    warehouse: 'Main Warehouse',
    supplier: 'BrightLight Systems',
    items: 12,
    totalAmount: '₹1,65,000',
    status: 'approved',
    createdBy: 'Rajesh Kumar',
    createdAt: '2024-12-08',
    expectedDelivery: '2024-12-19',
  },
  {
    id: '5',
    poNumber: 'PO-2024-005',
    warehouse: 'South Warehouse',
    supplier: 'SafeGuard Industries',
    items: 18,
    totalAmount: '₹95,000',
    status: 'pending',
    createdBy: 'Priya Sharma',
    createdAt: '2024-12-11',
    expectedDelivery: '2024-12-22',
  },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; label: string }> = {
    pending: { variant: 'secondary', label: 'Pending Approval' },
    approved: { variant: 'default', label: 'Approved' },
    received: { variant: 'outline', label: 'Received' },
  };
  const config = variants[status] || variants.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

function CompanyPurchaseOrdersContent() {
  const pendingCount = mockPurchaseOrders.filter((po) => po.status === 'pending').length;
  const approvedCount = mockPurchaseOrders.filter((po) => po.status === 'approved').length;
  const receivedCount = mockPurchaseOrders.filter((po) => po.status === 'received').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Company Purchase Orders
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                View and approve purchase orders from all warehouses
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockPurchaseOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹7,15,000</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search purchase orders..." className="pl-9" />
                </div>
              </div>
              <Button variant="outline">Filter by Status</Button>
              <Button variant="outline">Filter by Warehouse</Button>
              <Button variant="outline">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.warehouse}</TableCell>
                    <TableCell>{po.supplier}</TableCell>
                    <TableCell>{po.items} items</TableCell>
                    <TableCell className="font-semibold">{po.totalAmount}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {po.createdBy}
                    </TableCell>
                    <TableCell>{po.expectedDelivery}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {po.status === 'pending' && (
                          <Button size="sm" variant="default">
                            Approve
                          </Button>
                        )}
                      </div>
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

export default function CompanyPurchaseOrdersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <CompanyPurchaseOrdersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
