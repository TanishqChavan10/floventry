'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import AlertsSection from '@/components/dashboard/AlertsSection';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import InventoryTable from '@/components/dashboard/InventoryTable';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const companyId = searchParams.get('companyId');
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('admin'); // Default role for demo

  useEffect(() => {
    if (!companyId) {
      // Redirect to switcher if no company selected
      router.push('/company-switcher');
      return;
    }

    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [companyId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <DashboardHeader companyName="Loading..." role={role} onRoleChange={setRole} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />
      
      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good morning, User
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Here's what's happening with your inventory today.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards role={role} />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <AnalyticsCharts role={role} />
            <div className="grid md:grid-cols-2 gap-6">
              <QuickActions role={role} />
              <RecentTransactions role={role} />
            </div>
            <InventoryTable role={role} />
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            <AlertsSection role={role} />
            <ActivityTimeline role={role} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
