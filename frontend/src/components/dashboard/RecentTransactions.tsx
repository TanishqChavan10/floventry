'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface RecentTransactionsProps {
  role: string;
}

export default function RecentTransactions({ role }: RecentTransactionsProps) {
  const purchases = [
    { id: 'PO-001', supplier: 'TechSupplies Inc.', amount: '$1,200', status: 'Pending', date: 'Oct 24, 2024' },
    { id: 'PO-002', supplier: 'Office Depot', amount: '$450', status: 'Completed', date: 'Oct 22, 2024' },
    { id: 'PO-003', supplier: 'Global Electronics', amount: '$3,400', status: 'Processing', date: 'Oct 20, 2024' },
  ];

  const deliveries = [
    { id: 'DEL-001', source: 'TechSupplies Inc.', items: '24 items', status: 'Received', date: 'Today' },
    { id: 'DEL-002', source: 'Warehouse B', items: '12 items', status: 'In Transit', date: 'Yesterday' },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Transactions & Logistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="purchases">Recent Purchases</TabsTrigger>
            <TabsTrigger value="deliveries">Incoming Deliveries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchases">
            <div className="space-y-4">
              {purchases.map((po) => (
                <div key={po.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-medium text-sm">{po.supplier}</div>
                    <div className="text-xs text-slate-500">{po.id} • {po.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{po.amount}</div>
                    <Badge variant="outline" className="text-[10px] h-5">{po.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="deliveries">
            <div className="space-y-4">
              {deliveries.map((del) => (
                <div key={del.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-medium text-sm">{del.source}</div>
                    <div className="text-xs text-slate-500">{del.id} • {del.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{del.items}</div>
                    <Badge variant="secondary" className="text-[10px] h-5">{del.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
