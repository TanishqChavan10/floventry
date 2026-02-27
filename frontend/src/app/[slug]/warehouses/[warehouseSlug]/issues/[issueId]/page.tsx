'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import RoleGuard from '@/components/guards/role-guard';
import { useRbac } from '@/hooks/use-rbac';
import { GET_ISSUE_NOTE, POST_ISSUE_NOTE, CANCEL_ISSUE_NOTE } from '@/lib/graphql/issues';
import { Loader2, ArrowLeft, Send, XCircle } from 'lucide-react';
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
import { CopyButton } from '@/components/common/CopyButton';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from '@/components/sales/StatusBadge';
import { ExpiryBadge } from '@/components/issues/ExpiryBadge';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

function IssueNoteDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const rbac = useRbac();

  const issueId = params.issueId as string;
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ISSUE_NOTE, {
    variables: { id: issueId },
  });

  const [postIssue] = useMutation(POST_ISSUE_NOTE, {
    onCompleted: () => {
      toast({
        title: 'Issue Posted Successfully',
        description: 'Stock has been updated. This action cannot be undone.',
      });
      refetch();
      setPostDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error Posting Issue',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [cancelIssue] = useMutation(CANCEL_ISSUE_NOTE, {
    onCompleted: () => {
      toast({
        title: 'Issue Cancelled',
        description: 'Issue note has been cancelled.',
      });
      refetch();
      setCancelDialogOpen(false);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading issue note...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.issueNote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">Failed to load issue note</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const issue = data.issueNote;
  const canPost = issue.status === 'DRAFT' && rbac.canPost;
  const canCancel = issue.status === 'DRAFT' && rbac.canCancel;
  const isPosted = issue.status === 'POSTED';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/${companySlug}/warehouses/${warehouseSlug}/issues`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  Issue Note #{issue.issue_number || issue.id.slice(0, 8)}
                </h1>
                <p className="text-muted-foreground">{issue.warehouse?.name || 'Warehouse'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canPost && (
                <Button onClick={() => setPostDialogOpen(true)} className="gap-2">
                  <Send className="h-4 w-4" />
                  Post
                </Button>
              )}
              {canCancel && (
                <Button
                  onClick={() => setCancelDialogOpen(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {rbac.isStaff && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">View Only Access</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              As a Warehouse Staff member, you can view this Issue Note. Posting or cancelling requires Manager approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert (if posted) */}
        {isPosted && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-[var(--chart-2)]" />
            <AlertTitle>Posted successfully</AlertTitle>
            <AlertDescription>
              Stock has been updated successfully. This action cannot be undone.
            </AlertDescription>
          </Alert>
        )}

        {/* Issue Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Issue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <StatusBadge status={issue.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Linked Sales Order
                </label>
                <div className="mt-1">
                  {issue.sales_order ? (
                    <Link
                      href={`/${companySlug}/sales/orders/${issue.sales_order.id}`}
                      className="text-primary hover:underline underline-offset-4"
                    >
                      {issue.sales_order.customer_name}
                    </Link>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      Direct issue
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warehouse</label>
                <p className="mt-1">{issue.warehouse?.name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Issued By</label>
                <p className="mt-1">{issue.issuer?.fullName || 'Not posted yet'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Issued Date</label>
                <p className="mt-1">
                  {issue.issued_at ? format(new Date(issue.issued_at), 'dd MMM yyyy, HH:mm') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="mt-1">{format(new Date(issue.created_at), 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issue Items */}
        <Card>
          <CardHeader>
            <CardTitle>Issued Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Lot Expiry</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(issue.items ?? []).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <span>{item.product?.sku}</span>
                          <CopyButton
                            value={item.product?.sku ?? ''}
                            ariaLabel="Copy SKU"
                            successMessage="Copied SKU to clipboard"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={!item.product?.sku}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.stock_lot ? item.stock_lot.id.slice(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell>
                        {item.stock_lot?.expiry_date ? (
                          <ExpiryBadge expiryDate={item.stock_lot.expiry_date} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* POST Dialog */}
        <AlertDialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                Post Issue Note?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will <strong>decrease stock immediately</strong> and create stock movement
                records.
                <br />
                <br />
                <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => postIssue({ variables: { id: issueId } })}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                POST Issue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Issue Note?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel the issue note. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cancelIssue({ variables: { id: issueId } })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancel Issue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

export default function IssueNoteDetailPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
      <IssueNoteDetailContent />
    </RoleGuard>
  );
}
