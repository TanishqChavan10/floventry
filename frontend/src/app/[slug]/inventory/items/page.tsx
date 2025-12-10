'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import InventoryTable from '@/components/inventory/InventoryTable';
import InventoryFilters from '@/components/inventory/InventoryFilters';
import { toast } from 'sonner';
import CompanyGuard from '@/components/CompanyGuard';

// Mock Data
const MOCK_ITEMS = [
  {
    id: '1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    category: 'Electronics',
    quantity: 5,
    unit: 'pcs',
    value: '$125.00',
    status: 'Low Stock' as const,
    updatedAt: '2 hours ago',
  },
  {
    id: '2',
    name: 'Office Chair',
    sku: 'OC-202',
    category: 'Furniture',
    quantity: 12,
    unit: 'pcs',
    value: '$2,400.00',
    status: 'In Stock' as const,
    updatedAt: '1 day ago',
  },
  {
    id: '3',
    name: 'USB-C Cable',
    sku: 'CB-303',
    category: 'Electronics',
    quantity: 0,
    unit: 'pcs',
    value: '$0.00',
    status: 'Out of Stock' as const,
    updatedAt: '3 days ago',
  },
  {
    id: '4',
    name: 'Laptop Stand',
    sku: 'LS-404',
    category: 'Accessories',
    quantity: 25,
    unit: 'pcs',
    value: '$750.00',
    status: 'In Stock' as const,
    updatedAt: '5 hours ago',
  },
  {
    id: '5',
    name: 'Mechanical Keyboard',
    sku: 'MK-505',
    category: 'Electronics',
    quantity: 8,
    unit: 'pcs',
    value: '$1,200.00',
    status: 'In Stock' as const,
    updatedAt: 'Yesterday',
  },
];

function InventoryItemsContent() {
  const [role, setRole] = useState('admin'); // Mock role state
  const [items, setItems] = useState(MOCK_ITEMS);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter((item) => item.id !== id));
      toast.success('Item deleted successfully');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Items</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your products, stock levels, and pricing.
          </p>
        </div>

        <InventoryFilters role={role} />

        <InventoryTable items={items} role={role} onDelete={handleDelete} />

        {/* Pagination Mock */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="text-sm text-slate-500">
            Showing 1 to {items.length} of {items.length} entries
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50"
              disabled
            >
              Previous
            </button>
            <button
              className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function InventoryItemsPage() {
  return (
    <CompanyGuard>
      <InventoryItemsContent />
    </CompanyGuard>
  );
}
