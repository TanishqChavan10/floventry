'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewSupplierPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [role, setRole] = React.useState('admin');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/${slug}/suppliers`}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Supplier</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Add a new supplier to your directory.
            </p>
          </div>
        </div>

        <SupplierForm />
      </main>
    </div>
  );
}
