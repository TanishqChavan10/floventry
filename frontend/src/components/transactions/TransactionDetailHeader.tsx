'use client';

import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, CreditCard, Calendar, Receipt } from 'lucide-react';
import Link from 'next/link';
import { formatIndianRupee } from '@/lib/formatters';
import type { TransactionDetailHeaderProps } from '@/types';

export function TransactionDetailHeader({
  transaction,
  customer,
  cashier,
}: TransactionDetailHeaderProps) {
  const params = useParams();
  const companySlug = params?.slug as string;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Credit Card':
      case 'Debit Card':
        return <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Cash':
        return <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/${companySlug}/transactions`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Transaction {transaction.transaction_id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {new Date(transaction.transaction_date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatIndianRupee(transaction.total_amt)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {customer && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Customer</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{customer.name}</p>
              {customer.phone_number && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone_number}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          <User className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Cashier</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{cashier.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {cashier.employee_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          {getPaymentIcon(transaction.payment_method)}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Method</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{transaction.payment_method}</p>
            {transaction.payment_refno && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ref: {transaction.payment_refno}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Date</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {new Date(transaction.transaction_date).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(transaction.transaction_date).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
