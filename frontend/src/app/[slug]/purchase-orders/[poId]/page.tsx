'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Send, XCircle, FileText, Package, CheckCircle, Building2, Truck } from 'lucide-react';
import {
  GET_PURCHASE_ORDER,
  MARK_PURCHASE_ORDER_ORDERED,
  CANCEL_PURCHASE_ORDER,
  GET_PURCHASE_ORDERS,
} from '@/lib/graphql/purchase-orders';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { useAuth } from '@/context/auth-context';

// Status badge helper
const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any; color: string }> = {
    DRAFT: { variant: 'secondary', label: 'Draft', icon: FileText, color: 'text-amber-600' },
    ORDERED: { variant: 'default', label: 'Ordered', icon: Package, color: 'text-blue-600' },
    CLOSED: { variant: 'outline', label: 'Closed', icon: CheckCircle, color: 'text-green-600' },
    CANCELLED: { variant: 'destructive', label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
  };
  const item = config[status] || config.DRAFT;
  const Icon = item.icon;
  return (
    <Badge variant={item.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

function PurchaseOrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const poId = params?.poId as string;

  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch PO details
  const { data, loading, error } = useQuery(GET_PURCHASE_ORDER, {
    variables: { id: poId },
    fetchPolicy: 'cache-and-network',
  });

  const [markOrdered, { loading: orderingLoading }] = useMutation(MARK_PURCHASE_ORDER_ORDERED, {
    refetchQueries: [
      { query: GET_PURCHASE_ORDER, variables: { id: poId } },
      { query: GET_PURCHASE_ORDERS, variables: { filters: { limit: 100 } } },
    ],
  });

  const [cancelPO, { loading: cancellingLoading }] = useMutation(CANCEL_PURCHASE_ORDER, {
    refetchQueries: [
      { query: GET_PURCHASE_ORDER, variables: { id: poId } },
      { query: GET_PURCHASE_ORDERS, variables: { filters: { limit: 100 } } },
    ],
  });

  const po = data?.purchaseOrder;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkOrdered = async () => {
    try {
      await markOrdered({ variables: { id: poId } });
      toast.success('Purchase order marked as ORDERED');
      setShowOrderDialog(false);
    } catch (error: any) {
      console.error('Error marking PO as ORDERED:', error);
      toast.error(error.message || 'Failed to mark as ORDERED');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPO({ variables: { id: poId } });
      toast.success('Purchase order cancelled');
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error('Error cancelling PO:', error);
      toast.error(error.message || 'Failed to cancel purchase order');
    }
  };

  // Check user role
  const userRole = user?.companies?.find(c => c.slug === companySlug)?.role;
  const canCancel = userRole === 'OWNER' || userRole === 'ADMIN';
  const canEdit = po?.status === 'DRAFT' && (userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MANAGER');
  const canMarkOrdered = po?.status === 'DRAFT' && canEdit;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Purchase order not found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {error?.message || 'The purchase order you are looking for does not exist.'}
              </p>
              <Link href={`/${companySlug}/purchase-orders`}>
                <Button>Back to Purchase Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${companySlug}/purchase-orders`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                    {po.po_number}
                  </h1>
                  {getStatusBadge(po.status)}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Created {formatDate(po.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canMarkOrdered && (
                <Button onClick={() => setShowOrderDialog(true)} disabled={orderingLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Mark as ORDERED
                </Button>
              )}
              {canCancel && po.status !== 'CLOSED' && po.status !== 'CANCELLED' && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancellingLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel PO
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                  <p className="font-semibold">{po.warehouse.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Type</p>
                  <p className="font-semibold">{po.warehouse.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                  <p className="font-semibold">{po.supplier.name}</p>
                </div>
                {po.supplier.email && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                    <p className="font-semibold text-sm">{po.supplier.email}</p>
                  </div>
                )}
                {po.supplier.phone && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                    <p className="font-semibold">{po.supplier.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {po.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{po.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({po.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Ordered Qty</TableHead>
                  <TableHead className="text-right">Received Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
                    <TableCell>{item.product.unit?.abbreviation || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{item.ordered_quantity}</TableCell>
                    <TableCell className="text-right">
                      {item.received_quantity > 0 ? (
                        <span className="text-green-600 font-semibold">{item.received_quantity}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-slate-600 dark:text-slate-400">Created By</dt>
                <dd className="font-semibold">{po.user?.fullName || 'System'}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600 dark:text-slate-400">Status</dt>
                <dd>{getStatusBadge(po.status)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600 dark:text-slate-400">Created At</dt>
                <dd className="font-semibold text-sm">{formatDate(po.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600 dark:text-slate-400">Last Updated</dt>
                <dd className="font-semibold text-sm">{formatDate(po.updated_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </main>

      {/* Order Confirmation Dialog */}
      <AlertDialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as ORDERED?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the purchase order as sent to the supplier. The PO will become read-only and can no longer be edited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkOrdered} disabled={orderingLoading}>
              {orderingLoading ? 'Processing...' : 'Mark as ORDERED'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The purchase order will be marked as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep PO</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancellingLoading} className="bg-red-600 hover:bg-red-700">
              {cancellingLoading ? 'Cancelling...' : 'Cancel PO'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PurchaseOrderDetailPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <PurchaseOrderDetailContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
