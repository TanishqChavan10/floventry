'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DeliveryForm from '@/components/purchase-orders/DeliveryForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock PO data
const MOCK_PO = {
  id: '1',
  poNumber: 'PO-4502',
  supplier: 'PrimeChem Industries',
  date: 'Dec 12, 2024',
  expectedItems: [
    {
      id: '1',
      itemName: 'Disinfectant Liquid 500ml',
      sku: 'DL-500',
      poQty: 100,
      deliveredQty: 60,
      unitPrice: 85,
      batch: '',
      expiry: '',
      status: 'pending' as const,
    },
  ],
};

export default function DeliveryPage() {
  const params = useParams();
  const poId = params?.poId as string;
  const slug = params?.slug as string;
  const [role, setRole] = React.useState('admin');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/${slug}/purchase-orders`}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Receive Delivery</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Record delivery for {MOCK_PO.poNumber}
            </p>
          </div>
        </div>

        <DeliveryForm
          poId={poId}
          poNumber={MOCK_PO.poNumber}
          supplier={MOCK_PO.supplier}
          expectedItems={MOCK_PO.expectedItems}
        />
      </main>
    </div>
  );
}
