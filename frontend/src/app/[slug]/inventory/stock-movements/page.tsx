'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MovementSummaryCards from '@/components/inventory/MovementSummaryCards';
import MovementsTable from '@/components/inventory/MovementsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Calendar } from 'lucide-react';

// Mock Data
const MOCK_MOVEMENTS = {
  in: [
    {
      id: '1',
      date: 'Dec 11, 2025 10:23 AM',
      item: 'Premium LED Bulb',
      quantity: 100,
      type: 'in' as const,
      source: 'Supplier Delivery',
      reference: 'DEL-5521',
      performedBy: 'Sarah Staff',
    },
    {
      id: '2',
      date: 'Dec 10, 2025 09:00 AM',
      item: 'Wireless Mouse',
      quantity: 50,
      type: 'in' as const,
      source: 'Purchase Order',
      reference: 'PO-1119',
      performedBy: 'John Manager',
    },
  ],
  out: [
    {
      id: '3',
      date: 'Dec 11, 2025 10:45 AM',
      item: 'Premium LED Bulb',
      quantity: -5,
      type: 'out' as const,
      reason: 'Damaged on arrival',
      reference: 'DEL-5521',
      performedBy: 'Mike Warehouse',
    },
    {
      id: '4',
      date: 'Dec 11, 2025 01:05 PM',
      item: 'Premium LED Bulb',
      quantity: -60,
      type: 'out' as const,
      reason: 'Sales',
      reference: 'INV-9980',
      performedBy: 'Sales Team',
    },
  ],
  adjustment: [
    {
      id: '5',
      date: 'Dec 11, 2025 06:20 PM',
      item: 'Premium LED Bulb',
      quantity: -2,
      type: 'adjustment' as const,
      reason: 'Office usage / missing',
      reference: 'ADJ-122',
      performedBy: 'John Manager',
      previousQty: 35,
      newQty: 33,
    },
  ],
};

export default function StockMovementsPage() {
  const [role, setRole] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    in: 150,
    out: 65,
    adjustments: 1,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />
      
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Stock Movements
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track historical record of all inventory movements.
          </p>
        </div>

        <MovementSummaryCards stats={stats} />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search by item, SKU, or reference..."
              className="pl-9 bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white dark:bg-slate-900">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" className="bg-white dark:bg-slate-900">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="in" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="in">Stock In</TabsTrigger>
            <TabsTrigger value="out">Stock Out</TabsTrigger>
            <TabsTrigger value="adjustment">Adjustments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="in" className="mt-4">
            <MovementsTable movements={MOCK_MOVEMENTS.in} type="in" />
          </TabsContent>
          
          <TabsContent value="out" className="mt-4">
            <MovementsTable movements={MOCK_MOVEMENTS.out} type="out" />
          </TabsContent>
          
          <TabsContent value="adjustment" className="mt-4">
            <MovementsTable movements={MOCK_MOVEMENTS.adjustment} type="adjustment" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
