'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/common/CopyButton';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Send,
  XCircle,
  AlertTriangle,
  FileText,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { GET_GRN, POST_GRN, CANCEL_GRN, GET_GRNS } from '@/lib/graphql/grn';
import { toast } from 'sonner';
import Link from 'next/link';

const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any }> = {
    DRAFT: { variant: 'secondary', label: 'Draft', icon: FileText },
    POSTED: { variant: 'default', label: 'Posted', icon: CheckCircle },
    CANCELLED: { variant: 'destructive', label: 'Cancelled', icon: XCircle },
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

function GRNDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const grnId = params?.grnId as string;

  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, loading, error } = useQuery(GET_GRN, {
    variables: { id: grnId },
    fetchPolicy: 'cache-and-network',
  });

  const [postGRN, { loading: posting }] = useMutation(POST_GRN, {
    refetchQueries: [
      { query: GET_GRN, variables: { id: grnId } },
      { query: GET_GRNS, variables: { filters: { limit: 100 } } },
    ],
  });

  const [cancelGRN, { loading: cancelling }] = useMutation(CANCEL_GRN, {
    refetchQueries: [
      { query: GET_GRN, variables: { id: grnId } },
      { query: GET_GRNS, variables: { filters: { limit: 100 } } },
    ],
  });

  const grn = data?.grn;
  const userRole = user?.companies?.find((c: any) => c.slug === companySlug)?.role;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePost = async () => {
    try {
      await postGRN({ variables: { id: grnId } });
      toast.success('GRN posted successfully! Stock has been updated.');
      setShowPostDialog(false);
    } catch (error: any) {
      console.error('Error posting GRN:', error);
      toast.error(error.message || 'Failed to post GRN');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelGRN({ variables: { id: grnId } });
      toast.success('GRN cancelled');
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error('Error cancelling GRN:', error);
      toast.error(error.message || 'Failed to cancel GRN');
    }
  };

  const canPost = grn?.status === 'DRAFT' && ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole || '');
  const canCancel = grn?.status === 'DRAFT' && ['OWNER', 'ADMIN'].includes(userRole || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading GRN...</p>
        </div>
      </div>
    );
  }

  if (error || !grn) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">GRN not found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {error?.message || 'The GRN you are looking for does not exist.'}
              </p>
              <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn`}>
                <Button>Back to GRNs</Button>
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
              <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {grn.grn_number}
                  </h1>
                  {getStatusBadge(grn.status)}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Received {formatDate(grn.received_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canPost && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowPostDialog(true)}
                      disabled={posting}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Post GRN
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Post this GRN to update stock</TooltipContent>
                </Tooltip>
              )}
              {canCancel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={cancelling}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel this GRN</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* PO & Supplier Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">PO Number:</span>
                <Link href={`/${companySlug}/purchase-orders/${grn.purchase_order.id}`}>
                  <span className="font-mono font-medium hover:text-indigo-600 flex items-center gap-1">
                    {grn.purchase_order.po_number}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Supplier:</span>
                <span className="font-medium">{grn.purchase_order.supplier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Warehouse:</span>
                <span className="font-medium">{grn.warehouse.name}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Created By:</span>
                <span className="font-medium">
                  {grn.user?.fullName || grn.user_role || 'System'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Created At:</span>
                <span className="text-sm">{formatDate(grn.created_at)}</span>
              </div>
              {grn.status === 'POSTED' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Posted By:</span>
                    <span className="font-medium">{grn.posted_by_user?.fullName || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Posted At:</span>
                    <span className="text-sm">{formatDate(grn.posted_at)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Received Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Ordered Qty</TableHead>
                  <TableHead className="text-right">Previously Received</TableHead>
                  <TableHead className="text-right">This GRN</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grn.items.map((item: any) => (
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
                    <TableCell className="text-right">
                      {item.purchase_order_item.ordered_quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.purchase_order_item.received_quantity - item.received_quantity}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      +{item.received_quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.purchase_order_item.ordered_quantity -
                        item.purchase_order_item.received_quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Notes */}
        {grn.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300">{grn.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Post Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Post Goods Receipt Note?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                Posting this GRN will immediately:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Update stock quantities in the warehouse</li>
                  <li>Create stock movement records</li>
                  <li>Update purchase order received quantities</li>
                  <li>Potentially close the purchase order if fully received</li>
                </ul>
                <strong className="block mt-3">This action cannot be undone.</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} disabled={posting}>
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post GRN'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel GRN?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the GRN. No stock will be updated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep GRN</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Cancel GRN'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function GRNDetailPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
      <GRNDetailContent />
    </RoleGuard>
  );
}
