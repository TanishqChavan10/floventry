'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesReports } from '@/components/reports/SalesReports';
import { PurchaseReports } from '@/components/reports/PurchaseReports';
import { InventoryReports } from '@/components/reports/InventoryReports';
import { SupplierReports } from '@/components/reports/SupplierReports';

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
      </div>
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="supplier">Supplier Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="space-y-4">
          <SalesReports />
        </TabsContent>
        <TabsContent value="purchase" className="space-y-4">
          <PurchaseReports />
        </TabsContent>
        <TabsContent value="inventory" className="space-y-4">
          <InventoryReports />
        </TabsContent>
        <TabsContent value="supplier" className="space-y-4">
          <SupplierReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
