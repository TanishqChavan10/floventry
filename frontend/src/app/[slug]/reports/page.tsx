'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanyGuard from '@/components/CompanyGuard';
import { OverviewReport } from '@/components/reports/OverviewReport';
import { InventoryMovementsReport } from '@/components/reports/InventoryMovementsReport';
import { StockHealthReport } from '@/components/reports/StockHealthReport';
import { AdjustmentsReport } from '@/components/reports/AdjustmentsReport';
import { PurchaseOrdersReport } from '@/components/reports/PurchaseOrdersReport';
import { SalesOrdersReport } from '@/components/reports/SalesOrdersReport';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'inventory', label: 'Movements', icon: TrendingUp },
  { id: 'health', label: 'Stock Health', icon: ShieldCheck },
  { id: 'adjustments', label: 'Adjustments', icon: SlidersHorizontal },
  { id: 'purchase', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'sales', label: 'Sales Orders', icon: Package },
] as const;

function ReportsHub() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Insights across inventory, orders, and operations
          </p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewReport />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryMovementsReport />
          </TabsContent>
          <TabsContent value="health">
            <StockHealthReport />
          </TabsContent>
          <TabsContent value="adjustments">
            <AdjustmentsReport />
          </TabsContent>
          <TabsContent value="purchase">
            <PurchaseOrdersReport />
          </TabsContent>
          <TabsContent value="sales">
            <SalesOrdersReport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <CompanyGuard>
      <ReportsHub />
    </CompanyGuard>
  );
}