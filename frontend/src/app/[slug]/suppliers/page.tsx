'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SupplierTable from '@/components/suppliers/SupplierTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import CompanyGuard from '@/components/CompanyGuard';

// Mock Data
const MOCK_SUPPLIERS = [
  {
    id: '1',
    name: 'EcoSupply Pvt Ltd',
    contactPerson: 'Rahul Sharma',
    email: 'contact@ecosupply.com',
    phone: '+91 98765 43210',
    itemsSupplied: 12,
    balance: '$0.00',
    status: 'Active' as const,
  },
  {
    id: '2',
    name: 'TechComponents Inc.',
    contactPerson: 'Sarah Jenkins',
    email: 'sales@techcomp.com',
    phone: '+1 555 0123',
    itemsSupplied: 45,
    balance: '$1,250.00',
    status: 'Active' as const,
  },
  {
    id: '3',
    name: 'Global Logistics',
    contactPerson: 'Mike Ross',
    email: 'mike@globallog.com',
    phone: '+44 20 7123 4567',
    itemsSupplied: 0,
    balance: '$0.00',
    status: 'Inactive' as const,
  },
];

function SuppliersContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [role, setRole] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = MOCK_SUPPLIERS.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suppliers</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your supplier directory and relationships.
            </p>
          </div>
          {(role === 'admin' || role === 'manager') && (
            <Button asChild>
              <Link href={`/${slug}/suppliers/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search suppliers..."
              className="pl-9 bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white dark:bg-slate-900">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="bg-white dark:bg-slate-900">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <SupplierTable suppliers={filteredSuppliers} role={role} />
      </main>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <CompanyGuard>
      <SuppliersContent />
    </CompanyGuard>
  );
}
