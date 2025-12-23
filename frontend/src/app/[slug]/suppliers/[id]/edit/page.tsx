'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CompanyGuard from '@/components/CompanyGuard';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useParams } from 'next/navigation';

// Mock data - replace with actual data fetching
const mockSupplierData = {
  id: '1',
  name: 'EcoSupply Pvt Ltd',
  contactPerson: 'John Doe',
  email: 'john@ecosupply.com',
  phone: '+1 234 567 890',
  address: '123 Main St, City, State 12345',
  gst: '27ABCDE1234F1Z5',
  paymentTerms: 'net30',
  type: 'distributor',
  creditLimit: '5000',
  notes: 'Reliable supplier for eco-friendly products',
  status: 'Active',
};

function EditSupplierContent() {
  const params = useParams();
  const supplierId = params?.id as string;

  // In a real app, fetch supplier data based on supplierId
  const supplierData = mockSupplierData; // Replace with actual fetch

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Supplier</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Update supplier information.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierForm initialData={supplierData} isEditing={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditSupplierPage() {
  return (
    <CompanyGuard>
      <EditSupplierContent />
    </CompanyGuard>
  );
}
