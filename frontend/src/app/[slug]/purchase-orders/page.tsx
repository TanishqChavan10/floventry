'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import POTable from '@/components/purchase-orders/POTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CompanyGuard from '@/components/CompanyGuard';

// Mock Data
const MOCK_POS = [
  {
    id: '1',
    poNumber: 'PO-4502',
    supplier: 'PrimeChem Industries',
    date: 'Dec 12, 2024',
    itemCount: 1,
    total: '₹8,500',
    status: 'Partially Delivered' as const,
  },
  {
    id: '2',
    poNumber: 'PO-4501',
    supplier: 'EcoSupply Pvt Ltd',
    date: 'Dec 10, 2024',
    itemCount: 3,
    total: '₹12,400',
    status: 'Delivered' as const,
  },
  {
    id: '3',
    poNumber: 'PO-4500',
    supplier: 'TechComponents Inc.',
    date: 'Dec 8, 2024',
    itemCount: 5,
    total: '₹45,000',
    status: 'Sent' as const,
  },
];

function PurchaseOrdersContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [role, setRole] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = MOCK_POS.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage and track all purchase orders and deliveries.
            </p>
          </div>
          {(role === 'admin' || role === 'manager') && (
            <Button asChild>
              <Link href={`/${slug}/purchase-orders/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create PO
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search by PO# or supplier..."
                className="pl-9 bg-white dark:bg-slate-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partial">Partially Delivered</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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

        <POTable orders={filteredOrders} role={role} />
      </main>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <CompanyGuard>
      <PurchaseOrdersContent />
    </CompanyGuard>
  );
}
