'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingDown, TrendingUp, DollarSign, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockInventoryData = [
  {
    warehouse: 'Main Warehouse',
    totalProducts: 1250,
    totalValue: '₹45,50,000',
    lowStockItems: 23,
    outOfStock: 5,
  },
  {
    warehouse: 'South Warehouse',
    totalProducts: 890,
    totalValue: '₹32,20,000',
    lowStockItems: 15,
    outOfStock: 2,
  },
  {
    warehouse: 'North Warehouse',
    totalProducts: 1450,
    totalValue: '₹52,80,000',
    lowStockItems: 28,
    outOfStock: 7,
  },
];

const topProducts = [
  { name: 'Industrial Safety Helmet', value: '₹8,50,000', percentage: 6.5 },
  { name: 'Steel Wire Rope 10mm', value: '₹6,20,000', percentage: 4.7 },
  { name: 'Hydraulic Jack 5 Ton', value: '₹5,80,000', percentage: 4.4 },
  { name: 'LED Floodlight 100W', value: '₹4,90,000', percentage: 3.7 },
  { name: 'Industrial Gloves', value: '₹4,20,000', percentage: 3.2 },
];

function InventoryReportsContent() {
  const totalValue = mockInventoryData.reduce((sum, item) => {
    const value = parseInt(item.totalValue.replace(/[₹,]/g, ''));
    return sum + value;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Inventory Reports
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Stock valuation and inventory analytics across all warehouses
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalValue / 100).toFixed(2)}L</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockInventoryData.reduce((sum, w) => sum + w.totalProducts, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockInventoryData.reduce((sum, w) => sum + w.lowStockItems, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {mockInventoryData.reduce((sum, w) => sum + w.outOfStock, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Inventory Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Total Products</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Low Stock Items</TableHead>
                  <TableHead>Out of Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInventoryData.map((warehouse, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{warehouse.warehouse}</TableCell>
                    <TableCell>{warehouse.totalProducts}</TableCell>
                    <TableCell className="font-semibold">{warehouse.totalValue}</TableCell>
                    <TableCell className="text-orange-600">{warehouse.lowStockItems}</TableCell>
                    <TableCell className="text-red-600">{warehouse.outOfStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                      <div className="mt-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${product.percentage * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{product.value}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {product.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function InventoryReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <InventoryReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
