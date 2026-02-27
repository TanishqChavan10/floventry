'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '@/components/guards/role-guard';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useRbac } from '@/hooks/use-rbac';
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
  ArrowRight,
  Info,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  GET_WAREHOUSE_TRANSFER,
  POST_WAREHOUSE_TRANSFER,
  CANCEL_WAREHOUSE_TRANSFER,
  GET_WAREHOUSE_TRANSFERS,
} from '@/lib/graphql/transfers';
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

function TransferDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { activeWarehouse } = useWarehouse();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const transferId = params?.transferId as string;

  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data, loading, error } = useQuery(GET_WAREHOUSE_TRANSFER, {
    variables: { id: transferId },
    fetchPolicy: 'cache-and-network',
  });

  const [postTransfer, { loading: posting }] = useMutation(POST_WAREHOUSE_TRANSFER, {
    refetchQueries: [
      { query: GET_WAREHOUSE_TRANSFER, variables: { id: transferId } },
      { query: GET_WAREHOUSE_TRANSFERS, variables: { filters: { limit: 100 } } },
    ],
  });

  const [cancelTransfer, { loading: cancelling }] = useMutation(CANCEL_WAREHOUSE_TRANSFER, {
    refetchQueries: [
      { query: GET_WAREHOUSE_TRANSFER, variables: { id: transferId } },
      { query: GET_WAREHOUSE_TRANSFERS, variables: { filters: { limit: 100 } } },
    ],
  });

  const transfer = data?.warehouseTransfer;
  const rbac = useRbac();

  // Detect if this is an incoming transfer (destination warehouse view)
  const isIncoming =
    transfer && activeWarehouse && transfer.destination_warehouse?.id === activeWarehouse.id;
  const isOutgoing =
    transfer && activeWarehouse && transfer.source_warehouse?.id === activeWarehouse.id;

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
      await postTransfer({ variables: { id: transferId } });
      toast.success('Transfer posted successfully! Stock has been updated.');
      setShowPostDialog(false);
    } catch (error: any) {
      console.error('Error posting transfer:', error);
      toast.error(error.message || 'Failed to post transfer');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelTransfer({ variables: { id: transferId } });
      toast.success('Transfer cancelled');
      setShowCancelDialog(false);
    } catch (error: any) {
      console.error('Error cancelling transfer:', error);
      toast.error(error.message || 'Failed to cancel transfer');
    }
  };

  // Only source warehouse can post/cancel - destination warehouse is READ-ONLY
  const canPost = isOutgoing && transfer?.status === 'DRAFT' && rbac.canPost;
  const canCancel = isOutgoing && transfer?.status === 'DRAFT' && rbac.canCancel;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading transfer...</p>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Transfer not found</h3>
              <p className="text-sm text-muted-foreground">
                {error?.message || 'The transfer you are looking for does not exist.'}
              </p>
              <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`}>
                <Button variant="outline">Back to Transfers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{transfer.transfer_number}</h1>
                  {getStatusBadge(transfer.status)}
                  {isIncoming && <Badge variant="outline">INCOMING</Badge>}
                  {isOutgoing && <Badge variant="outline">OUTGOING</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {isIncoming && `Received from ${transfer.source_warehouse.name} • `}
                  Created {formatDate(transfer.created_at)}
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
                      Post Transfer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Post this transfer to update stock</TooltipContent>
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
                  <TooltipContent>Cancel this transfer</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {rbac.isStaff && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">View Only Access</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              As a Warehouse Staff member, you can view this Transfer Note. Posting or cancelling requires Manager approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Warehouse Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">From Warehouse</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-lg">{transfer.source_warehouse.name}</span>
                  {isOutgoing && (
                    <Badge variant="outline" className="text-xs">
                      This Warehouse
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center text-muted-foreground">
                <ArrowRight className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">To Warehouse</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-lg">
                    {transfer.destination_warehouse.name}
                  </span>
                  {isIncoming && (
                    <Badge variant="outline" className="text-xs">
                      This Warehouse
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By:</span>
                <span className="font-medium">
                  {transfer.user?.fullName || transfer.user_role || 'System'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At:</span>
                <span className="text-sm">{formatDate(transfer.created_at)}</span>
              </div>
              {transfer.status === 'POSTED' && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Updated At:</span>
                  <span className="text-sm">{formatDate(transfer.updated_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Items ({transfer.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items.map((item: any) => (
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
                    <TableCell className="text-sm">{item.product.unit}</TableCell>
                    <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Notes */}
        {transfer.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{transfer.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Post Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Post Warehouse Transfer?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Posting this transfer will immediately:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Decrease stock in {transfer.source_warehouse.name}</li>
                <li>Increase stock in {transfer.destination_warehouse.name}</li>
                <li>Create TRANSFER_OUT and TRANSFER_IN stock movements</li>
              </ul>
              <strong className="block mt-3">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} disabled={posting}>
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post Transfer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Transfer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the transfer. No stock will be moved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Transfer</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Transfer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TransferDetailPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
      <TransferDetailContent />
    </RoleGuard>
  );
}
