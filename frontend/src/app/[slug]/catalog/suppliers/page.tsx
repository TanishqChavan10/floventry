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
import { Plus, Search, Edit, Trash2, Building, Phone, Mail } from 'lucide-react';

// Mock data for suppliers
const mockSuppliers = [
  {
    id: '1',
    name: 'SafeGuard Industries',
    contact: 'Ramesh Patel',
    email: 'ramesh@safeguard.com',
    phone: '+91 98765 43210',
    address: 'Plot 45, MIDC Area, Pune',
    productsSupplied: 45,
    totalOrders: 128,
    status: 'active',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'MetalCraft Ltd',
    contact: 'Sunita Rao',
    email: 'sunita@metalcraft.in',
    phone: '+91 98765 43211',
    address: '12 Industrial Estate, Bangalore',
    productsSupplied: 67,
    totalOrders: 89,
    status: 'active',
    rating: 4.5,
  },
  {
    id: '3',
    name: 'TechTools Co',
    contact: 'Vijay Kumar',
    email: 'vijay@techtools.com',
    phone: '+91 98765 43212',
    address: '789 Tool Market, Delhi',
    productsSupplied: 34,
    totalOrders: 156,
    status: 'active',
    rating: 4.9,
  },
  {
    id: '4',
    name: 'BrightLight Systems',
    contact: 'Anjali Desai',
    email: 'anjali@brightlight.in',
    phone: '+91 98765 43213',
    address: 'Sector 18, Gurgaon',
    productsSupplied: 28,
    totalOrders: 72,
    status: 'active',
    rating: 4.6,
  },
  {
    id: '5',
    name: 'PowerElectric Inc',
    contact: 'Karan Mehta',
    email: 'karan@powerelectric.com',
    phone: '+91 98765 43214',
    address: 'Electronics City, Mumbai',
    productsSupplied: 51,
    totalOrders: 103,
    status: 'inactive',
    rating: 4.2,
  },
];

function CatalogSuppliersContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Supplier Directory
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage company-wide supplier relationships and contacts
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
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
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSuppliers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockSuppliers.filter((s) => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockSuppliers.reduce((sum, s) => sum + s.totalOrders, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  mockSuppliers.reduce((sum, s) => sum + s.rating, 0) / mockSuppliers.length
                ).toFixed(1)}
                ⭐
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
                  <Input placeholder="Search suppliers..." className="pl-9" />
                </div>
              </div>
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.productsSupplied}</TableCell>
                    <TableCell>{supplier.totalOrders}</TableCell>
                    <TableCell>{supplier.rating} ⭐</TableCell>
                    <TableCell>
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status}
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

export default function CatalogSuppliersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <CatalogSuppliersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
