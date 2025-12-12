'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

// Mock data
const MOCK_INVENTORY_STATS = {
  totalValue: 405000,
  totalItems: 4200,
  lowStockItems: 35,
  expiringItems: 8,
  categories: [
    { name: 'Electronics', value: 185000, percentage: 45.7 },
    { name: 'Furniture', value: 120000, percentage: 29.6 },
    { name: 'Accessories', value: 100000, percentage: 24.7 },
  ],
};

export function InventorySnapshot() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Inventory Snapshot</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Stock Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Stock Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${MOCK_INVENTORY_STATS.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all warehouses
            </p>
          </CardContent>
        </Card>

        {/* Total Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {MOCK_INVENTORY_STATS.totalItems.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique SKUs in stock
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alerts
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {MOCK_INVENTORY_STATS.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items need reordering
            </p>
          </CardContent>
        </Card>

        {/* Expiry Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expiry Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {MOCK_INVENTORY_STATS.expiringItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items expiring soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
          <CardDescription>Distribution of inventory value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_INVENTORY_STATS.categories.map((category) => (
              <div key={category.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-muted-foreground">
                    ${category.value.toLocaleString()} ({category.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
