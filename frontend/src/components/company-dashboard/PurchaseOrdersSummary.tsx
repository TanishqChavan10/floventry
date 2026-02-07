'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: 'pending' | 'received' | 'partial';
  items: number;
  totalValue: number;
  date: string;
}

// Mock data
const MOCK_POS: PurchaseOrder[] = [
  {
    id: '1',
    poNumber: 'PO-1234',
    supplier: 'TechSupply Co.',
    status: 'pending',
    items: 25,
    totalValue: 15000,
    date: '2025-12-10',
  },
  {
    id: '2',
    poNumber: 'PO-1235',
    supplier: 'Furniture Plus',
    status: 'partial',
    items: 15,
    totalValue: 8500,
    date: '2025-12-11',
  },
  {
    id: '3',
    poNumber: 'PO-1236',
    supplier: 'Office Depot',
    status: 'received',
    items: 50,
    totalValue: 12000,
    date: '2025-12-12',
  },
];

const SUMMARY_STATS = {
  pending: 12,
  received: 28,
  totalValue: 125000,
};

export function PurchaseOrdersSummary() {
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-muted/40 border-border text-foreground">
            <Clock className="h-3 w-3 mr-1 text-[var(--chart-4)]" />
            Pending
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="bg-muted/40 border-border text-foreground">
            <AlertCircle className="h-3 w-3 mr-1 text-[var(--chart-3)]" />
            Partial
          </Badge>
        );
      case 'received':
        return (
          <Badge variant="outline" className="bg-muted/40 border-border text-foreground">
            <CheckCircle className="h-3 w-3 mr-1 text-[var(--chart-2)]" />
            Received
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-[var(--chart-4)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SUMMARY_STATS.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-[var(--chart-2)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SUMMARY_STATS.received}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[var(--chart-3)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${SUMMARY_STATS.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active POs</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent POs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
          <CardDescription>Latest orders across all warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_POS.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{po.poNumber}</span>
                    {getStatusBadge(po.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {po.supplier} • {po.items} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${po.totalValue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(po.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
