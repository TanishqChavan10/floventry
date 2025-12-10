'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ItemForm from '@/components/inventory/ItemForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditItemPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [role, setRole] = React.useState('admin');

  // Mock Data for Edit
  const mockData = {
    name: 'Wireless Mouse',
    sku: 'WM-001',
    barcode: '123456789',
    description: 'Ergonomic wireless mouse with 2.4GHz connection.',
    category: 'electronics',
    unit: 'pcs',
    quantity: 5,
    minStock: 10,
    maxStock: 100,
    buyingPrice: 15.0,
    sellingPrice: 25.0,
    tax: 10,
    images: ['https://via.placeholder.com/150'],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/${slug}/inventory/items`}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Item</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Update product details for {mockData.name}.
            </p>
          </div>
        </div>

        <ItemForm initialData={mockData} isEditing />
      </main>
    </div>
  );
}
