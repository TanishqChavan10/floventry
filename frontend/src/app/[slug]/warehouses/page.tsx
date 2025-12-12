'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, Package, Plus, Settings, TrendingUp } from 'lucide-react';

// Mock data for warehouses
const mockWarehouses = [
  {
    id: '1',
    name: 'Main Warehouse',
    slug: 'main-warehouse',
    address: '123 Industrial Ave, Mumbai, Maharashtra 400001',
    manager: 'Rajesh Kumar',
    status: 'active',
    totalProducts: 1250,
    totalValue: '₹45,50,000',
    staffCount: 12,
  },
  {
    id: '2',
    name: 'South Warehouse',
    slug: 'south-warehouse',
    address: '456 Storage Road, Bangalore, Karnataka 560001',
    manager: 'Priya Sharma',
    status: 'active',
    totalProducts: 890,
    totalValue: '₹32,20,000',
    staffCount: 8,
  },
  {
    id: '3',
    name: 'North Warehouse',
    slug: 'north-warehouse',
    address: '789 Logistics Park, Delhi, NCR 110001',
    manager: 'Amit Singh',
    status: 'active',
    totalProducts: 1450,
    totalValue: '₹52,80,000',
    staffCount: 15,
  },
];

function WarehousesContent() {
  const params = useParams();
  const companySlug = params.slug as string;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Warehouse Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage all warehouse locations across your company
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockWarehouses.length}</div>
              <p className="text-xs text-muted-foreground">All locations active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockWarehouses.reduce((sum, w) => sum + w.staffCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,30,50,000</div>
              <p className="text-xs text-muted-foreground">Combined value</p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                      {warehouse.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{warehouse.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>Manager: {warehouse.manager}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Products</p>
                    <p className="text-lg font-semibold">{warehouse.totalProducts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Value</p>
                    <p className="text-lg font-semibold">{warehouse.totalValue}</p>
                  </div>
                </div>

                <Link href={`/${companySlug}/warehouses/${warehouse.slug}`}>
                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function WarehousesPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <WarehousesContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
