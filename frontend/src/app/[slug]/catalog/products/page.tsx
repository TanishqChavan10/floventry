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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';

// Mock data for global products
const mockProducts = [
  {
    id: '1',
    sku: 'PRD-001',
    name: 'Industrial Safety Helmet',
    category: 'Safety Equipment',
    supplier: 'SafeGuard Industries',
    basePrice: '₹850',
    stock: 2450,
    status: 'active',
  },
  {
    id: '2',
    sku: 'PRD-002',
    name: 'Steel Wire Rope 10mm',
    category: 'Hardware',
    supplier: 'MetalCraft Ltd',
    basePrice: '₹1,200',
    stock: 1890,
    status: 'active',
  },
  {
    id: '3',
    sku: 'PRD-003',
    name: 'Industrial Gloves (Pair)',
    category: 'Safety Equipment',
    supplier: 'SafeGuard Industries',
    basePrice: '₹120',
    stock: 5600,
    status: 'active',
  },
  {
    id: '4',
    sku: 'PRD-004',
    name: 'Hydraulic Jack 5 Ton',
    category: 'Tools',
    supplier: 'TechTools Co',
    basePrice: '₹4,500',
    stock: 340,
    status: 'active',
  },
  {
    id: '5',
    sku: 'PRD-005',
    name: 'LED Floodlight 100W',
    category: 'Lighting',
    supplier: 'BrightLight Systems',
    basePrice: '₹2,800',
    stock: 780,
    status: 'low_stock',
  },
];

function CatalogProductsContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Global Product Catalog
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage company-wide product definitions and pricing
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
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
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockProducts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockProducts.filter((p) => p.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockProducts.filter((p) => p.status === 'low_stock').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockProducts.reduce((sum, p) => sum + p.stock, 0).toLocaleString()}
              </div>
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
                  <Input placeholder="Search products..." className="pl-9" />
                </div>
              </div>
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell>{product.basePrice}</TableCell>
                    <TableCell>{product.stock.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'default' : 'destructive'}>
                        {product.status === 'active' ? 'Active' : 'Low Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export default function CatalogProductsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <CatalogProductsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
