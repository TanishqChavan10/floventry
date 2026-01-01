'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import CompanyGuard from '@/components/CompanyGuard';
import { useQuery } from '@apollo/client';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { useAuth } from '@/context/auth-context';

function InventoryOverviewContent() {
  const params = useParams();
  const { user } = useAuth();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  // Get warehouse ID
  const activeWarehouse = user?.warehouses?.find(
    (w: any) => w.warehouseSlug === warehouseSlug
  );
  const warehouseId = activeWarehouse?.warehouseId;

  // Fetch stock data
  const { data: stockData, loading } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId: warehouseId || '' },
    skip: !warehouseId,
  });

  const stock = stockData?.stockByWarehouse || [];

  // Calculate statistics
  const totalProducts = stock.length;
  const totalStockValue = stock.reduce((sum: number, item: any) => {
    return sum + (item.quantity * (item.product?.cost_price || 0));
  }, 0);
  const lowStockItems = stock.filter((item: any) => {
    return item.reorder_point && item.quantity <= item.reorder_point;
  }).length;

  const navItems = [
    {
      title: 'Stock Management',
      description: 'View and manage product stock levels',
      icon: Package,
      href: `/${companySlug}/warehouses/${warehouseSlug}/inventory/stock`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Stock Movements',
      description: 'View stock movement history and audit trail',
      icon: TrendingUp,
      href: `/${companySlug}/warehouses/${warehouseSlug}/inventory/movements`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Low Stock Alerts',
      description: 'Products below reorder point',
      icon: AlertTriangle,
      href: `/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Reports',
      description: 'Stock reports and analytics',
      icon: FileText,
      href: `/${companySlug}/warehouses/${warehouseSlug}/inventory/reports`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Inventory Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage stock levels, track movements, and monitor inventory health
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <div className={`rounded-lg p-3 ${item.bgColor}`}>
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : totalProducts.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In this warehouse
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `₹${totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on cost price
              </p>
            </CardContent>
          </Card>
          <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/low-stock`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-orange-600' : ''}`}>
                  {loading ? '...' : lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Below reorder point
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function InventoryOverviewPage() {
  return (
    <CompanyGuard>
      <InventoryOverviewContent />
    </CompanyGuard>
  );
}
