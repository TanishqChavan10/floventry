'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
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
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function IssueNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data?.issueNote) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading issue note: {error?.message || 'Not found'}
      </div>
    );
  }

  const issue = data.issueNote;
  const canPost = issue.status === 'DRAFT';
  const canCancel = issue.status === 'DRAFT';
  const isPosted = issue.status === 'POSTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${companySlug}/warehouses/${warehouseSlug}/issues`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h3 className="text-2xl font-bold">Issue Note #{issue.id.slice(0, 8)}</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {issue.warehouse?.name || 'Warehouse'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canPost && (
            <Button
              onClick={() => setPostDialogOpen(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
              POST Issue
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

      {/* Success Alert (if posted) */}
      {isPosted && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">Posted Successfully</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
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
              <label className="text-sm font-medium text-slate-600">Status</label>
              <div className="mt-1">
                <StatusBadge status={issue.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Linked Sales Order</label>
              <div className="mt-1">
                {issue.sales_order ? (
                  <Link
                    href={`/${companySlug}/sales/orders/${issue.sales_order.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {issue.sales_order.customer_name}
                  </Link>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    📦 Direct Issue
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Warehouse</label>
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
              <label className="text-sm font-medium text-slate-600">Issued By</label>
              <p className="mt-1">{issue.issuer?.fullName || 'Not posted yet'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Issued Date</label>
              <p className="mt-1">
                {issue.issued_at
                  ? format(new Date(issue.issued_at), 'dd MMM yyyy, HH:mm')
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Created Date</label>
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
        <CardContent className="p-0">
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
              {issue.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product?.name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.product?.sku}</TableCell>
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
        </CardContent>
      </Card>

      {/* POST Dialog */}
      <AlertDialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Post Issue Note?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>decrease stock immediately</strong> and create stock movement records.
              <br />
              <br />
              <span className="text-orange-600 font-medium">
                ⚠️ This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postIssue({ variables: { id: issueId } })}
              className="bg-green-600 hover:bg-green-700"
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
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Issue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
