'use client';

import { useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import StatCardSkeleton from '@/components/dashboard/StatCardSkeleton';
import DashboardError from '@/components/dashboard/DashboardError';
import CategoryDashboard from '@/components/dashboard/CategoryDashboard';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import DashboardModal from '@/components/dashboard/DashboardModal';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import ProtectedRoute from '@/components/protected-route';

export default function DashboardPage() {
  const [modal, setModal] = useState<null | {
    title: string;
    columns: string[];
    data: (string | number)[][];
  }>(null);

  const { stats, loading, error, refetch } = useDashboardStats();

  return (
    <ProtectedRoute>
      <DashboardContent
        stats={stats}
        loading={loading}
        error={error}
        refetch={refetch}
        modal={modal}
        setModal={setModal}
      />
    </ProtectedRoute>
  );
}

function DashboardContent({
  stats,
  loading,
  error,
  refetch,
  modal,
  setModal,
}: {
  stats: any;
  loading: boolean;
  error: any;
  refetch: () => void;
  modal: null | {
    title: string;
    columns: string[];
    data: (string | number)[][];
  };
  setModal: React.Dispatch<
    React.SetStateAction<{
      title: string;
      columns: string[];
      data: (string | number)[][];
    } | null>
  >;
}) {
  return (
    <div className="px-32 pt-8 min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here&apos;s what&apos;s happening with your inventory today.
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8">
          <DashboardError error={error} onRetry={refetch} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading
          ? // Loading skeletons
            Array.from({ length: 6 }).map((_, index: number) => <StatCardSkeleton key={index} />)
          : // Real data
            stats.map((stat: any, index: number) => <StatCard key={index} stat={stat} />)}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryDashboard />
        <LowStockAlert />
      </div>

      {/* Modal */}
      {modal && <DashboardModal modal={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
