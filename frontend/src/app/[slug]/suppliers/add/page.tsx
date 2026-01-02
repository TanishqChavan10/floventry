'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CompanyGuard from '@/components/CompanyGuard';
import SupplierForm from '@/components/suppliers/SupplierForm';

function AddSupplierContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add Supplier</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Add a new supplier to your company.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AddSupplierPage() {
  return (
    <CompanyGuard>
      <AddSupplierContent />
    </CompanyGuard>
  );
}
