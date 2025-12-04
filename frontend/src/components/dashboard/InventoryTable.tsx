'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface InventoryTableProps {
  role: string;
}

export default function InventoryTable({ role }: InventoryTableProps) {
  const items = [
    { id: 1, name: 'Wireless Mouse', sku: 'WM-001', qty: 5, status: 'Low Stock', category: 'Electronics' },
    { id: 2, name: 'Mechanical Keyboard', sku: 'MK-002', qty: 45, status: 'In Stock', category: 'Electronics' },
    { id: 3, name: 'USB-C Cable', sku: 'CB-003', qty: 0, status: 'Out of Stock', category: 'Accessories' },
    { id: 4, name: 'Monitor Stand', sku: 'MS-004', qty: 12, status: 'In Stock', category: 'Furniture' },
    { id: 5, name: 'Laptop Sleeve', sku: 'LS-005', qty: 8, status: 'Low Stock', category: 'Accessories' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Low Stock': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Out of Stock': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Overview</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <a href="/inventory">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div>{item.name}</div>
                    <div className="text-xs text-slate-500">{item.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 font-semibold">{item.qty}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
