'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { TransactionDetailHeader } from '@/components/transactions/TransactionDetailHeader';
import { TransactionStats } from '@/components/transactions/TransactionStats';
import { TransactionItems } from '@/components/transactions/TransactionItems';
import { TransactionPayment } from '@/components/transactions/TransactionPayment';
import type { TransactionDetail, Customer, Employee, OrderItem } from '@/types';
import { useTransactionDetails } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';

export default function TransactionDetailsPage() {
  // Get transaction ID from URL params
  const { transactionId } = useParams();

  // Fetch transaction details using the hook
  const { transaction, customer, cashier, orderItems, loading, error } = useTransactionDetails(
    transactionId as string,
  );

  // Calculate stats from fetched order items
  const stats = useMemo(() => {
    if (!orderItems || !orderItems.length) return { totalItems: 0, uniqueProducts: 0 };

    const totalItems = orderItems.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);
    const uniqueProducts = orderItems.length;

    return {
      totalItems,
      uniqueProducts,
    };
  }, [orderItems]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-red-500">Error Loading Transaction</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error ? `Error: ${error.message}` : 'Transaction not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <TransactionDetailHeader
          transaction={transaction as TransactionDetail}
          customer={customer as Customer}
          cashier={cashier as Employee}
        />

        {/* Stats */}
        <TransactionStats
          transaction={transaction as TransactionDetail}
          totalItems={stats.totalItems}
          uniqueProducts={stats.uniqueProducts}
        />

        {/* Order Items */}
        <TransactionItems orderItems={orderItems as OrderItem[]} />

        {/* Payment Information */}
        <TransactionPayment transaction={transaction as TransactionDetail} />
      </div>
    </div>
  );
}
