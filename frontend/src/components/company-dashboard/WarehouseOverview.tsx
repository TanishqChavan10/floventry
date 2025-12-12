'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, Package, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface WarehouseCardData {
  id: string;
  name: string;
  slug: string;
  stockValue: number;
  itemCount: number;
  lowStockCount: number;
  activeOrders: number;
}

// Mock data
const MOCK_WAREHOUSES: WarehouseCardData[] = [
  {
    id: '1',
    name: 'Main Warehouse',
    slug: 'main-warehouse',
    stockValue: 125000,
    itemCount: 1250,
    lowStockCount: 12,
    activeOrders: 8,
  },
  {
    id: '2',
    name: 'Downtown Store',
    slug: 'downtown',
    stockValue: 85000,
    itemCount: 850,
    lowStockCount: 5,
    activeOrders: 3,
  },
  {
    id: '3',
    name: 'East Warehouse',
    slug: 'east-warehouse',
    stockValue: 195000,
    itemCount: 2100,
    lowStockCount: 18,
    activeOrders: 12,
  },
];

interface WarehouseOverviewProps {
  companySlug: string;
}

export function WarehouseOverview({ companySlug }: WarehouseOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Warehouses</h2>
        <Link href={`/${companySlug}/warehouses`}>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_WAREHOUSES.map((warehouse) => (
          <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {warehouse.name}
              </CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">
                    ${warehouse.stockValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stock Value
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="font-semibold flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {warehouse.itemCount}
                    </div>
                    <div className="text-muted-foreground">Items</div>
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-1 text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      {warehouse.lowStockCount}
                    </div>
                    <div className="text-muted-foreground">Low Stock</div>
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-1 text-blue-600">
                      <TrendingUp className="h-3 w-3" />
                      {warehouse.activeOrders}
                    </div>
                    <div className="text-muted-foreground">Orders</div>
                  </div>
                </div>

                <Link href={`/${companySlug}/${warehouse.slug}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Open Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
