import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useStockMovements } from '@/hooks/apollo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpiryStatusBadge } from './ExpiryStatusBadge';
import { getExpiryStatus, getDaysUntilExpiry, LotWithExpiry } from '@/lib/utils/expiry';
import { Copy, Package } from 'lucide-react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/common/CopyButton';

interface LotBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productSku: string;
  productId?: string;
  warehouseId?: string;
  companySlug?: string;
  warehouseSlug?: string;
  lots: LotWithExpiry[];
}

export function LotBreakdownModal({
  isOpen,
  onClose,
  productName,
  productSku,
  productId,
  warehouseId,
  companySlug,
  warehouseSlug,
  lots,
}: LotBreakdownModalProps) {
  const router = useRouter();
  const [showInactiveLots, setShowInactiveLots] = React.useState(false);

  const handleCopyLotId = async (lotId: string) => {
    try {
      await navigator.clipboard.writeText(lotId);
      toast.success('Copied lot ID to clipboard');
      return;
    } catch {
      // Fallback for older browsers / blocked clipboard API
      try {
        const textarea = document.createElement('textarea');
        textarea.value = lotId;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!ok) throw new Error('execCommand(copy) failed');
        toast.success('Copied lot ID to clipboard');
      } catch {
        toast.error('Failed to copy lot ID');
      }
    }
  };

  // Deduplicate and sort lots by expiry date (earliest first), then by received date
  const sortedLots = useMemo(() => {
    // Deduplicate by lot ID to prevent React key warnings
    const seen = new Set<string>();
    const unique = lots.filter((lot) => {
      if (seen.has(lot.id)) return false;
      seen.add(lot.id);
      return true;
    });

    return unique.sort((a, b) => {
      // Lots with expiry come first
      if (!a.expiry_date && b.expiry_date) return 1;
      if (a.expiry_date && !b.expiry_date) return -1;

      // Both have expiry - sort by expiry date
      if (a.expiry_date && b.expiry_date) {
        const dateCompare = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        if (dateCompare !== 0) return dateCompare;
      }

      // Fall back to received date
      return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    });
  }, [lots]);

  const totalQuantity = sortedLots.reduce((sum, lot) => sum + lot.quantity, 0);

  const canAdjustOut = Boolean(productId && companySlug && warehouseSlug);

  const movementQueryVariables = useMemo(() => {
    if (!warehouseId || !productId) return null;

    return {
      warehouseId,
      filters: {
        productId,
        // Use a stable wide date range to avoid re-fetch loops caused by new Date() on every render.
        fromDate: '2000-01-01T00:00:00.000Z',
        toDate: '2100-01-01T00:00:00.000Z',
        types: ['ADJUSTMENT_OUT'],
        limit: 200,
        offset: 0,
      },
    };
  }, [warehouseId, productId]);

  const { data: movementsData } = useStockMovements({
    warehouseId: isOpen && movementQueryVariables ? movementQueryVariables.warehouseId : '',
    filters: movementQueryVariables?.filters ?? {},
  });

  const discardedLotIdSet = useMemo(() => {
    const set = new Set<string>();
    const items = movementsData?.stockMovements?.items ?? [];
    for (const movement of items) {
      const referenceId = (movement?.referenceId as string | null | undefined) ?? '';
      if (!referenceId.startsWith('LOT:')) continue;
      const lotId = referenceId.slice('LOT:'.length);
      if (lotId) set.add(lotId);
    }
    return set;
  }, [movementsData?.stockMovements?.items]);

  const visibleLots = useMemo(() => {
    if (showInactiveLots) return sortedLots;
    return sortedLots.filter((lot) => !discardedLotIdSet.has(lot.id));
  }, [discardedLotIdSet, showInactiveLots, sortedLots]);

  const handleAdjustOut = (lot: LotWithExpiry) => {
    if (!productId || !companySlug || !warehouseSlug) return;

    const params = new URLSearchParams();
    params.set('new', '1');
    params.set('type', 'OUT');
    params.set('productId', productId);
    params.set('quantity', String(lot.quantity));
    params.set('reference', `LOT:${lot.id}`);
    params.set('reason', `Discard lot ${lot.id.slice(0, 8)}…`);

    onClose();
    router.push(
      `/${companySlug}/warehouses/${warehouseSlug}/inventory/adjustments?${params.toString()}`,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] sm:max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lot Breakdown: {productName}
          </DialogTitle>
          <DialogDescription>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1 font-mono">
                <span>SKU: {productSku}</span>
                <CopyButton
                  value={productSku}
                  ariaLabel="Copy SKU"
                  successMessage="Copied SKU to clipboard"
                  className="h-6 w-6 text-muted-foreground"
                />
              </span>
              <span>• Total Quantity: {totalQuantity.toFixed(2)}</span>
              <span>• {sortedLots.length} lot(s)</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3">
          <div className="text-sm text-muted-foreground">Show inactive lots</div>
          <Switch checked={showInactiveLots} onCheckedChange={setShowInactiveLots} />
        </div>

        <div className="mt-4">
          {sortedLots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lots found for this product
            </div>
          ) : visibleLots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No active lots.</div>
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Lot ID</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead className="w-[110px] text-right">Quantity</TableHead>
                  <TableHead className="w-[140px]">Received</TableHead>
                  <TableHead className="w-[140px]">Expiry</TableHead>
                  <TableHead className="w-[140px]">Days Left</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  {canAdjustOut && <TableHead className="w-[140px]">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLots.map((lot) => {
                  const status = getExpiryStatus(lot.expiry_date);
                  const daysRemaining = getDaysUntilExpiry(lot.expiry_date);
                  const quantityValue = Number(lot.quantity);
                  const hasQuantity = Number.isFinite(quantityValue) && quantityValue > 0;
                  const isDiscarded = discardedLotIdSet.has(lot.id);

                  return (
                    <TableRow
                      key={lot.id}
                      className={
                        status === 'EXPIRED'
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : status === 'EXPIRING_SOON'
                            ? 'bg-orange-50 dark:bg-orange-950/20'
                            : ''
                      }
                    >
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{lot.id.slice(0, 8)}...</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Copy lot ID"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCopyLotId(lot.id);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            lot.source_type === 'ADJUSTMENT'
                              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                              : lot.source_type === 'GRN'
                                ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300'
                                : lot.source_type === 'TRANSFER'
                                  ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950/30 dark:text-purple-300'
                                  : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-300'
                          }
                        >
                          {lot.source_type === 'OPENING'
                            ? 'Opening'
                            : lot.source_type === 'ADJUSTMENT'
                              ? 'Adjustment'
                              : lot.source_type === 'GRN'
                                ? 'GRN'
                                : lot.source_type === 'TRANSFER'
                                  ? 'Transfer'
                                  : (lot.source_type ?? '—')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {lot.quantity.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(lot.received_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {lot.expiry_date ? format(new Date(lot.expiry_date), 'dd MMM yyyy') : '—'}
                      </TableCell>
                      <TableCell
                        className={
                          daysRemaining !== null && daysRemaining < 0
                            ? 'text-red-600 font-semibold'
                            : daysRemaining !== null && daysRemaining <= 30
                              ? 'text-orange-600 font-semibold'
                              : ''
                        }
                      >
                        {daysRemaining !== null
                          ? daysRemaining < 0
                            ? `${Math.abs(daysRemaining)} days ago`
                            : `${daysRemaining} days`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <ExpiryStatusBadge status={status} daysRemaining={daysRemaining} />
                      </TableCell>
                      {canAdjustOut && (
                        <TableCell>
                          <span
                            className="inline-block"
                            title={
                              isDiscarded
                                ? 'This lot was already adjusted out'
                                : hasQuantity
                                  ? 'Create an Adjustment OUT for this lot'
                                  : 'This lot has 0 quantity'
                            }
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7"
                              disabled={isDiscarded || !hasQuantity}
                              onClick={() => handleAdjustOut(lot)}
                            >
                              {isDiscarded ? 'Adjusted' : 'Adjust out'}
                            </Button>
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
