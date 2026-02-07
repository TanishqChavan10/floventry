'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SALES_ORDER, CONFIRM_SALES_ORDER, CANCEL_SALES_ORDER } from '@/lib/graphql/sales';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/sales/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { CopyButton } from '@/components/common/CopyButton';
import Link from 'next/link';

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;
  const companySlug = params.slug as string;

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const { data, loading, error, refetch } = useQuery(GET_SALES_ORDER, {
    variables: { id: orderId },
  });

  const [confirmOrder] = useMutation(CONFIRM_SALES_ORDER, {
    onCompleted: () => {
      toast({
        title: 'Order Confirmed',
        description: 'Sales order has been confirmed successfully.',
      });
      refetch();
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [cancelOrder] = useMutation(CANCEL_SALES_ORDER, {
    onCompleted: () => {
      toast({
        title: 'Order Cancelled',
        description: 'Sales order has been cancelled.',
      });
      refetch();
      setCancelOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data?.salesOrder) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading sales order: {error?.message || 'Not found'}
      </div>
    );
  }

  const order = data.salesOrder;
  const canEdit = order.status === 'DRAFT';
  const canConfirm = order.status === 'DRAFT';
  const canCancel = order.status !== 'CLOSED' && order.status !== 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${companySlug}/sales/orders`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Sales Order #{order.id.slice(0, 8)}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Customer: {order.customer_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canEdit && (
                <Link href={`/${companySlug}/sales/orders/${orderId}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Order
                  </Button>
                </Link>
              )}
              {canConfirm && (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Order
                </Button>
              )}
              {canCancel && (
                <Button onClick={() => setCancelOpen(true)} variant="destructive" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Order Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Status</label>
                <div className="mt-1">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Customer Name</label>
                <p className="mt-1 text-lg font-medium">{order.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Expected Dispatch Date</label>
                <p className="mt-1">
                  {order.expected_dispatch_date
                    ? format(new Date(order.expected_dispatch_date), 'dd MMM yyyy')
                    : 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Created By</label>
                <p className="mt-1">{order.creator?.fullName || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Created Date</label>
                <p className="mt-1">{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Last Updated</label>
                <p className="mt-1">{format(new Date(order.updated_at), 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Ordered Qty</TableHead>
                  <TableHead className="text-right">Issued Qty</TableHead>
                  <TableHead className="text-right">Pending Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <span>{item.product.sku}</span>
                        <CopyButton
                          value={item.product.sku}
                          ariaLabel="Copy SKU"
                          successMessage="Copied SKU to clipboard"
                          className="h-7 w-7 text-muted-foreground"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{item.product.unit}</TableCell>
                    <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">
                      {item.issued_quantity}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 font-medium">
                      {item.pending_quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{order.items?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {order.items
                  ?.reduce((sum: number, item: any) => sum + parseFloat(item.ordered_quantity), 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {order.items
                  ?.reduce((sum: number, item: any) => sum + parseFloat(item.pending_quantity), 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sales Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as confirmed and ready for fulfillment. You cannot edit the
              order after confirmation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmOrder({ variables: { id: orderId } })}>
              Confirm Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Sales Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelOrder({ variables: { id: orderId } })}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
