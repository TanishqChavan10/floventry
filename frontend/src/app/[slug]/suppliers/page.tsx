'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CompanyGuard from '@/components/CompanyGuard';

function SuppliersContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Suppliers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your supplier relationships and vendor information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Management</CardTitle>
            <CardDescription>View and manage all suppliers for your company.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page is under development. Supplier management features will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
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
