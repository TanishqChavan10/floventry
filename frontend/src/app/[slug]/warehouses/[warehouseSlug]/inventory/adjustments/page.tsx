'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import { useWarehouse } from '@/context/warehouse-context';
import { useAuth } from '@/context/auth-context';
import CompanyGuard from '@/components/CompanyGuard';
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
import { Plus, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { GET_STOCK_MOVEMENTS_BY_WAREHOUSE } from '@/lib/graphql/adjustments';
import { formatDistanceToNow } from 'date-fns';
import NewAdjustmentModal from '@/components/inventory/NewAdjustmentModal';

type AdjustmentMovement = {
  id: string;
  type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | string;
  quantity: number;
  previousQuantity?: number | null;
  newQuantity?: number | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string;
  productName: string;
  sku: string;
  performedBy?: string | null;
  userRole?: string | null;
};

function AdjustmentsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeWarehouse } = useWarehouse();

  const [isNewAdjustmentOpen, setIsNewAdjustmentOpen] = useState(false);
  const [hasHandledPrefill, setHasHandledPrefill] = useState(false);

  // Get user role
  const activeCompany = user?.companies?.find((c) => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;

  // Can create adjustments: OWNER, ADMIN, MANAGER only
  const canCreate = userRole ? ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) : false;

  const prefillNew = searchParams.get('new') === '1';
  const prefillProductId = searchParams.get('productId') || '';
  const prefillType = (searchParams.get('type') || '').toUpperCase();
  const prefillQuantity = searchParams.get('quantity') || '';
  const prefillReason = searchParams.get('reason') || '';
  const prefillReference = searchParams.get('reference') || '';

  useEffect(() => {
    if (!canCreate) return;
    if (hasHandledPrefill) return;
    if (!prefillNew) return;

    setIsNewAdjustmentOpen(true);
    setHasHandledPrefill(true);
  }, [canCreate, hasHandledPrefill, prefillNew]);

  // Memoize date range to prevent infinite re-renders
  const dateRange = useMemo(() => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 90);
    return {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    };
  }, []);

  // Fetch adjustments (ADJUSTMENT_IN and ADJUSTMENT_OUT only)
  const { data, loading, error, refetch } = useQuery(GET_STOCK_MOVEMENTS_BY_WAREHOUSE, {
    variables: {
      warehouseId: activeWarehouse?.id || '',
      filters: {
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        types: ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT'],
        limit: 100,
      },
    },
    skip: !activeWarehouse?.id,
    fetchPolicy: 'cache-and-network',
  });

  const adjustments: AdjustmentMovement[] = data?.stockMovements?.items ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading adjustments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-600">Failed to load adjustments</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalIn = adjustments
    .filter((a) => a.type === 'ADJUSTMENT_IN')
    .reduce((sum, a) => sum + a.quantity, 0);

  const totalOut = adjustments
    .filter((a) => a.type === 'ADJUSTMENT_OUT')
    .reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Inventory Adjustments
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Stock corrections and audit trail for {activeWarehouse?.name}
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => setIsNewAdjustmentOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Adjustment
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adjustments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Added</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{totalIn}</div>
              <p className="text-xs text-muted-foreground mt-1">Units added via adjustments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Removed</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{totalOut}</div>
              <p className="text-xs text-muted-foreground mt-1">Units removed via adjustments</p>
            </CardContent>
          </Card>
        </div>

        {/* Adjustments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustment History</CardTitle>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 w-fit mx-auto mb-4">
                  <Clock className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No adjustments yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {canCreate
                    ? 'Create your first adjustment to correct stock levels'
                    : 'Adjustments will appear here when created'}
                </p>
                {canCreate && (
                  <Button onClick={() => setIsNewAdjustmentOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Adjustment
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Before</TableHead>
                      <TableHead className="text-right">After</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(adjustment.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(adjustment.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{adjustment.productName}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                              <span>{adjustment.sku}</span>
                              <CopyButton
                                value={adjustment.sku}
                                ariaLabel="Copy SKU"
                                successMessage="Copied SKU to clipboard"
                                className="h-6 w-6 text-muted-foreground"
                              />
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {adjustment.type === 'ADJUSTMENT_IN' ? (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                IN
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                OUT
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">Adjustment</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          <span
                            className={
                              adjustment.type === 'ADJUSTMENT_IN'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {adjustment.type === 'ADJUSTMENT_IN' ? '+' : '-'}
                            {adjustment.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {adjustment.previousQuantity ?? 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {adjustment.newQuantity ?? 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate" title={adjustment.reason ?? undefined}>
                            {adjustment.reason || 'N/A'}
                          </p>
                          {adjustment.referenceId && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {adjustment.referenceId}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{adjustment.performedBy || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">
                              {adjustment.userRole}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* New Adjustment Modal */}
      {isNewAdjustmentOpen && activeWarehouse && (
        <NewAdjustmentModal
          warehouseId={activeWarehouse.id}
          warehouseName={activeWarehouse.name}
          initialAdjustmentType={
            prefillType === 'IN' ? 'IN' : prefillType === 'OUT' ? 'OUT' : undefined
          }
          initialProductId={prefillProductId || undefined}
          initialQuantity={prefillQuantity || undefined}
          initialReason={prefillReason || undefined}
          initialReference={prefillReference || undefined}
          open={isNewAdjustmentOpen}
          onClose={() => {
            setIsNewAdjustmentOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default function AdjustmentsPage() {
  return (
    <CompanyGuard>
      <AdjustmentsPageContent />
    </CompanyGuard>
  );
}
