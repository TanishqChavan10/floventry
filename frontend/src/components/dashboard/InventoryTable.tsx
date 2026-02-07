'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/common/CopyButton';
import { ArrowRight, MapPin } from 'lucide-react';
import { useWarehouse } from '@/context/warehouse-context';

interface InventoryTableProps {
  role: string;
}

export default function InventoryTable({ role }: InventoryTableProps) {
  const params = useParams();
  const companySlug = params?.slug as string;
  const { activeWarehouse, activeWarehouseId } = useWarehouse();

  // Simulate different stock levels for different warehouses
  const getStockForWarehouse = (baseQty: number, id: number) => {
    if (activeWarehouseId === 'ALL') return baseQty;
    // content-based randomization to make it deterministic per warehouse
    const seed = activeWarehouseId.charCodeAt(activeWarehouseId.length - 1) + id;
    return Math.floor((baseQty * (seed % 10)) / 10);
  };

  const rawItems = [
    { id: 1, name: 'Wireless Mouse', sku: 'WM-001', qty: 50, category: 'Electronics' },
    { id: 2, name: 'Mechanical Keyboard', sku: 'MK-002', qty: 45, category: 'Electronics' },
    { id: 3, name: 'USB-C Cable', sku: 'CB-003', qty: 100, category: 'Accessories' },
    { id: 4, name: 'Monitor Stand', sku: 'MS-004', qty: 12, category: 'Furniture' },
    { id: 5, name: 'Laptop Sleeve', sku: 'LS-005', qty: 30, category: 'Accessories' },
  ];

  const items = useMemo(() => {
    return rawItems.map((item) => {
      const qty = getStockForWarehouse(item.qty, item.id);
      let status = 'In Stock';
      if (qty === 0) status = 'Out of Stock';
      else if (qty < 10) status = 'Low Stock';

      return { ...item, qty, status };
    });
  }, [activeWarehouseId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Low Stock':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Out of Stock':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Product Overview</CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {activeWarehouseId === 'ALL'
              ? 'Global Stock (All Locations)'
              : `Viewing: ${activeWarehouse?.name}`}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <a href={`/${companySlug}/inventory`}>
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg w-[40%]">Item Name</th>
                <th className="px-4 py-3 w-[25%]">Category</th>
                <th className="px-4 py-3 w-[15%]">Qty</th>
                <th className="px-4 py-3 rounded-r-lg w-[20%]">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    <div>{item.name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="font-mono">{item.sku}</span>
                      <CopyButton
                        value={item.sku}
                        ariaLabel="Copy SKU"
                        successMessage="Copied SKU to clipboard"
                        className="h-6 w-6 text-muted-foreground"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 font-semibold">{item.qty}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
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
