'use client';

import { useParams } from 'next/navigation';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertTriangle, ArrowUpDown } from 'lucide-react';

const mockWarehouseData = {
  name: 'Main Warehouse',
  totalProducts: 1250,
  totalValue: '₹45,50,000',
  lowStockItems: 23,
  recentMovements: 156,
};

const mockRecentActivities = [
  { action: 'Stock In', product: 'Industrial Safety Helmet', quantity: 50, time: '2 hours ago' },
  { action: 'Stock Out', product: 'Steel Wire Rope 10mm', quantity: 30, time: '3 hours ago' },
  { action: 'Transfer Out', product: 'Industrial Gloves', quantity: 150, time: '5 hours ago' },
  { action: 'Stock In', product: 'LED Floodlight 100W', quantity: 80, time: '1 day ago' },
];

function WarehouseDashboardContent() {
  const params = useParams();
  const warehouseSlug = params.warehouseSlug as string;

  return (
    <div>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mockWarehouseData.name} Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Warehouse operational metrics and recent activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockWarehouseData.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Active SKUs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockWarehouseData.totalValue}</div>
              <p className="text-xs text-green-600 mt-1">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockWarehouseData.lowStockItems}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Movements</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockWarehouseData.recentMovements}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.action.includes('In')
                          ? 'bg-green-500'
                          : activity.action.includes('Out')
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {activity.product}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {activity.quantity} units
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <button className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors">
                <div className="font-semibold text-slate-900 dark:text-white">Update Stock</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Record stock changes
                </p>
              </button>
              <button className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Create Purchase Order
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Order new inventory
                </p>
              </button>
              <button className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors">
                <div className="font-semibold text-slate-900 dark:text-white">Stock Transfer</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Transfer to another warehouse
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function WarehouseDashboardPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['MANAGER', 'STAFF']}>
        <WarehouseDashboardContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
