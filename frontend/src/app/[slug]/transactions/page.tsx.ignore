'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Search,
  ChevronDownIcon,
  Plus,
  IndianRupee,
  TrendingUp,
  Receipt,
  Loader2,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NewTransactionForm } from '@/components/transactions/NewTransactionForm';
import { useTransactions, useCreateTransaction } from '@/hooks/useTransactions';
import { formatIndianRupee } from '@/lib/formatters';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function TransactionsListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const itemsPerPage = 10;

  // New Transaction Form State
  const [isNewTransactionFormOpen, setIsNewTransactionFormOpen] = useState(false);

  // Fetch transactions from GraphQL
  const {
    transactions: allTransactions = [],
    loading,
    error,
    refetch,
  } = useTransactions({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter || undefined,
  });

  // Filter transactions by date on client side
  const transactions = useMemo(() => {
    if (!date) return allTransactions;

    const selectedDate = date.toISOString().split('T')[0];
    return allTransactions.filter((t: any) => {
      if (!t.transaction_date) return false;
      const transactionDate = new Date(t.transaction_date).toISOString().split('T')[0];
      return transactionDate === selectedDate;
    });
  }, [allTransactions, date]);

  // Handle fetch errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error]);

  // Create transaction mutation
  const { createTransaction, loading: createLoading, error: createError } = useCreateTransaction();

  // Calculate summary stats based on current transactions - memoized to prevent unnecessary recalculations
  const { totalRevenue, todaysSales, totalTransactions } = useMemo(() => {
    if (!transactions) return { totalRevenue: 0, todaysSales: 0, totalTransactions: 0 };

    const revenue = transactions
      .filter((t: any) => (t.status || 'Completed') === 'Completed')
      .reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const salesCount = transactions.filter((t: any) => {
      if (!t.transaction_date) return false;
      const transactionDate = new Date(t.transaction_date).toISOString().split('T')[0];
      return transactionDate === today && (t.status || 'Completed') === 'Completed';
    }).length;

    return {
      totalRevenue: revenue,
      todaysSales: salesCount,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  // Handler for creating a new transaction - memoize to prevent recreation on each render
  const handleCreateTransaction = useCallback(
    async (transactionData: any) => {
      try {
        // Generate a transaction ID with current timestamp and random number
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0');
        const transactionId = `TXN${timestamp}${randomSuffix}`;

        // Format the transaction data for the GraphQL mutation
        const createTransactionInput = {
          transaction_id: transactionId,
          employee_id: transactionData.cashier_id,
          payment_method: transactionData.payment_method,
          payment_refno: transactionData.payment_refno || null,
          customer_name: transactionData.new_customer?.name || null,
          customer_phone: transactionData.new_customer?.phone_no || null,
          items: transactionData.items.map((item: any) => ({
            product_id: parseInt(item.product_id, 10),
            quantity: parseInt(item.quantity, 10),
            unit_price: parseFloat(item.unit_price),
            discount: item.discount || 0,
          })),
        };

        // Debug: Log the transformed input for debugging
        console.log('Transaction data from form:', transactionData);
        console.log('Formatted transaction input for mutation:', createTransactionInput);

        // Call the createTransaction mutation
        const result = await createTransaction({
          variables: {
            createTransactionInput,
          },
        });

        if (result.data?.createTransaction) {
          // Refresh the transactions list
          refetch();

          // Show success message
          toast({
            title: 'Transaction Created',
            description: `Transaction ${result.data.createTransaction.transaction_id} created successfully!`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Error creating transaction:', error);

        // Show error message
        toast({
          title: 'Error',
          description: `Failed to create transaction: ${(error as Error).message}`,
          variant: 'destructive',
        });

        throw error; // Re-throw to let the form handle the error
      }
    },
    [createTransaction, refetch, toast],
  );

  const filteredTransactions = useMemo(() => {
    let filteredList = transactions;

    // Filter by search term
    if (searchTerm) {
      filteredList = filteredList.filter(
        (transaction: any) =>
          transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Date filtering is now handled by the backend via the GraphQL query

    return filteredList;
  }, [transactions, searchTerm, date]);

  // For server-side pagination, we should use the fetched data directly
  const paginatedTransactions = filteredTransactions;

  // Handle page change with refetch - use callback to avoid recreating function on every render
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      refetch({
        page,
        limit: itemsPerPage,
        status: statusFilter || undefined,
      });
    },
    [setCurrentPage, refetch, itemsPerPage, statusFilter],
  );

  // Get total count from response or calculate based on available data
  // In a real implementation, the backend would return the total count
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleRowClick = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  const handleViewClick = (e: React.MouseEvent, transactionId: string) => {
    e.stopPropagation(); // Prevent row click
    router.push(`/transactions/${transactionId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-black text-white dark:bg-white dark:text-black';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Credit Card':
      case 'Debit Card':
        return '💳';
      case 'Cash':
        return '💵';
      case 'Mobile Payment':
        return '📱';
      default:
        return '💳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
      <div className="max-w-8xl mx-auto sm:px-6 lg:px-32 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Transaction Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 ">
              View and manage all sales transactions and payment records.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsNewTransactionFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatIndianRupee(totalRevenue || 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                From completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Today&apos;s Sales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{todaysSales}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Transactions today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </CardTitle>
              <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTransactions}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaction History
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                View and manage all sales transactions
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search transactions, customers, or cashiers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between">
                    {date ? date.toLocaleDateString() : 'Select Date'}
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setCurrentPage(1); // Reset to first page when date changes
                      setOpen(false);
                      // Date filtering is now handled client-side
                    }}
                  />
                </PopoverContent>
              </Popover>
              {date && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDate(undefined);
                    setCurrentPage(1); // Reset to first page
                    // Date filtering is now handled client-side
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Transaction ID
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Date & Time
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Customer
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Cashier
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Payment Method
                  </TableHead>
                  <TableHead className="text-right font-medium text-gray-900 dark:text-white">
                    Total
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Status
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-white">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Loading transactions...</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction: any) => (
                    <TableRow
                      key={transaction.transaction_id}
                      className="border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(transaction.transaction_id)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        <div>
                          <div>
                            {transaction.transaction_date
                              ? new Date(transaction.transaction_date).toLocaleDateString()
                              : ''}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {transaction.transaction_date
                              ? new Date(transaction.transaction_date).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {transaction.customer_name || 'Walk-in Customer'}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {transaction.employee_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <span>{getPaymentMethodIcon(transaction.payment_method)}</span>
                          {transaction.payment_method}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900 dark:text-white">
                        {formatIndianRupee(transaction.total_amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status || 'Completed')}>
                          {transaction.status || 'Completed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleViewClick(e, transaction.transaction_id)}
                          className="p-1 h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center h-32 text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="font-medium">No transactions found</p>
                          <p className="text-sm">Start by creating your first transaction</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or fewer
                    [...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))
                  ) : (
                    // Show limited pages with ellipsis for larger page counts
                    <>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === 1}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>

                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {currentPage > 2 && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }}
                          >
                            {currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {currentPage !== 1 && currentPage !== totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            isActive
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage);
                            }}
                          >
                            {currentPage}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {currentPage < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }}
                          >
                            {currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {totalPages > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === totalPages}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(totalPages);
                            }}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="mt-2 text-center text-sm text-gray-500">
                Showing page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Transaction Form Modal */}
      <NewTransactionForm
        isOpen={isNewTransactionFormOpen}
        onClose={() => setIsNewTransactionFormOpen(false)}
        onSubmit={handleCreateTransaction}
        loading={createLoading}
      />

      {/* Add Toaster for notifications */}
      <Toaster />
    </div>
  );
}
