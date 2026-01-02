'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockStockData = [
  { sku: 'PRD-001', product: 'Industrial Safety Helmet', currentStock: 450, value: '₹3,82,500' },
  { sku: 'PRD-002', product: 'Steel Wire Rope 10mm', currentStock: 280, value: '₹3,36,000' },
  { sku: 'PRD-003', product: 'Industrial Gloves', currentStock: 85, value: '₹10,200' },
  { sku: 'PRD-004', product: 'Hydraulic Jack 5 Ton', currentStock: 45, value: '₹2,02,500' },
];

function WarehouseStockContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Levels</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Current inventory status</p>
            </div>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStockData.reduce((sum, item) => sum + item.currentStock, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹9,31,200</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStockData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell className="font-semibold">{item.value}</TableCell>
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

export default function WarehouseStockPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehouseStockContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
