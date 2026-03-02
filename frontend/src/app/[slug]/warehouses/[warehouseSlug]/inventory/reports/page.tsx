'use client';

import React from 'react';
import { useWarehouse } from '@/context/warehouse-context';
import { BarChart3, ShieldCheck, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import {
  WarehouseOverviewReport,
  WarehouseStockHealthReport,
  WarehouseMovementsReport,
  WarehouseAdjustmentsReport,
} from '@/components/warehouse-reports';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'health', label: 'Stock Health', icon: ShieldCheck },
  { id: 'movements', label: 'Movements', icon: TrendingUp },
  { id: 'adjustments', label: 'Adjustments', icon: SlidersHorizontal },
] as const;

function WarehouseReportsContent() {
  const { activeWarehouse } = useWarehouse();

  if (!activeWarehouse?.id) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-sm text-muted-foreground">Select a warehouse to view reports.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {activeWarehouse.name} Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Inventory insights, stock health, and activity analysis
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
            <WarehouseOverviewReport warehouseId={activeWarehouse.id} />
          </TabsContent>
          <TabsContent value="health">
            <WarehouseStockHealthReport warehouseId={activeWarehouse.id} />
          </TabsContent>
          <TabsContent value="movements">
            <WarehouseMovementsReport warehouseId={activeWarehouse.id} />
          </TabsContent>
          <TabsContent value="adjustments">
            <WarehouseAdjustmentsReport warehouseId={activeWarehouse.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function WarehouseReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehouseReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
