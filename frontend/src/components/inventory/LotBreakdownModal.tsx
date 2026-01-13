import React, { useMemo } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Package } from 'lucide-react';

interface LotBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productSku: string;
  lots: LotWithExpiry[];
}

export function LotBreakdownModal({
  isOpen,
  onClose,
  productName,
  productSku,
  lots,
}: LotBreakdownModalProps) {
  // Sort lots by expiry date (earliest first), then by received date
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
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

  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lot Breakdown: {productName}
          </DialogTitle>
          <DialogDescription>
            SKU: {productSku} • Total Quantity: {totalQuantity.toFixed(2)} • {lots.length} lot(s)
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {lots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lots found for this product
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot ID</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLots.map((lot) => {
                  const status = getExpiryStatus(lot.expiry_date);
                  const daysRemaining = getDaysUntilExpiry(lot.expiry_date);

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
                      <TableCell className="font-mono text-xs">
                        {lot.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {lot.quantity.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(lot.received_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lot.expiry_date
                          ? format(new Date(lot.expiry_date), 'dd MMM yyyy')
                          : '—'}
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
