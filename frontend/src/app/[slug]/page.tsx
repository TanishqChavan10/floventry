'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import AlertsSection from '@/components/dashboard/AlertsSection';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import InventoryTable from '@/components/dashboard/InventoryTable';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/context/auth-context';

interface DashboardPageProps {
  params: {
    slug: string;
  };
}

function DashboardContent({ params }: DashboardPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = params;
  const [isLoading, setIsLoading] = useState(true);

  // Derive active company and role
  const activeCompany = user?.companies?.find((c) => c.slug === slug);
  const companyName = activeCompany?.name || 'My Company';
  const userRole = activeCompany?.role || 'viewer';

  const [role, setRole] = useState(userRole);

  useEffect(() => {
    // Check if user has any companies
    if (user && (!user.companies || user.companies.length === 0)) {
      router.push('/onboarding');
      return;
    }

    // If we have user data, we can stop loading.
    // In real app, we might also be fetching dashboard stats here.
    if (user) {
      setIsLoading(false);
    }
  }, [user, router]); // Reduced dependency on timer

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <DashboardHeader companyName="Loading..." role="viewer" onRoleChange={() => {}} />
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
      <DashboardHeader companyName={companyName} role={role} onRoleChange={setRole} />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Good morning, User</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Here's what's happening with your inventory today.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards role={role} />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <AnalyticsCharts role={role} />
            <div className="grid md:grid-cols-2 gap-6">
              <QuickActions role={role} />
              <RecentTransactions role={role} />
            </div>
            <InventoryTable role={role} />
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6 min-w-0">
            <AlertsSection role={role} />
            <ActivityTimeline role={role} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage({ params }: DashboardPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <DashboardContent params={params} />
    </Suspense>
  );
}
