'use client';

import React, { useState } from 'react';
import { useStockLots } from '@/hooks/apollo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpiryBadge } from './ExpiryBadge';
import { Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface SelectedLot {
  lot_id: string;
  quantity: number;
}

interface LotPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  warehouseId: string;
  requiredQuantity?: number;
  onConfirm: (lots: SelectedLot[]) => void;
}

export function LotPickerModal({
  open,
  onOpenChange,
  productId,
  productName,
  warehouseId,
  requiredQuantity,
  onConfirm,
}: LotPickerModalProps) {
  const [selectedLots, setSelectedLots] = useState<Map<string, number>>(new Map());

  const { data, loading } = useStockLots(productId, warehouseId);

  const lots = data?.stockLots || [];

  // Filter and sort lots
  const availableLots = lots
    .filter((lot: any) => lot.quantity > 0)
    .sort((a: any, b: any) => {
      // Sort by received date (FEFO - First Expired First Out)
      return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    });

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return differenceInDays(new Date(expiryDate), new Date()) < 0;
  };

  const toggleLot = (lotId: string, maxQty: number, expired: boolean) => {
    if (expired) return; // Cannot select expired lots

    const newSelected = new Map(selectedLots);
    if (newSelected.has(lotId)) {
      newSelected.delete(lotId);
    } else {
      newSelected.set(lotId, maxQty);
    }
    setSelectedLots(newSelected);
  };

  const updateQuantity = (lotId: string, quantity: number, maxQty: number) => {
    const newSelected = new Map(selectedLots);
    const validQty = Math.min(Math.max(0, quantity), maxQty);
    if (validQty > 0) {
      newSelected.set(lotId, validQty);
    } else {
      newSelected.delete(lotId);
    }
    setSelectedLots(newSelected);
  };

  const totalSelected = Array.from(selectedLots.values()).reduce((sum, qty) => sum + qty, 0);

  const handleConfirm = () => {
    const result: SelectedLot[] = Array.from(selectedLots.entries()).map(([lot_id, quantity]) => ({
      lot_id,
      quantity,
    }));
    onConfirm(result);
    setSelectedLots(new Map());
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedLots(new Map());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Lots for {productName}</DialogTitle>
          <DialogDescription>
            Select one or more lots to issue. Expired lots cannot be selected.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : availableLots.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No stock lots available for this product
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Lot ID</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableLots.map((lot: any) => {
                  const expired = isExpired(lot.expiry_date);
                  const isSelected = selectedLots.has(lot.id);
                  const selectedQty = selectedLots.get(lot.id) || lot.quantity;

                  return (
                    <TableRow
                      key={lot.id}
                      className={expired ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleLot(lot.id, lot.quantity, expired)}
                          disabled={expired}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{lot.id.slice(0, 8)}...</TableCell>
                      <TableCell>{format(new Date(lot.received_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        {lot.expiry_date ? format(new Date(lot.expiry_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>{lot.quantity}</TableCell>
                      <TableCell>
                        <ExpiryBadge expiryDate={lot.expiry_date} />
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <Input
                            type="number"
                            min="0"
                            max={lot.quantity}
                            step="0.01"
                            value={selectedQty}
                            onChange={(e) =>
                              updateQuantity(lot.id, parseFloat(e.target.value) || 0, lot.quantity)
                            }
                            className="w-24"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm">
              <span className="font-medium">Total Selected:</span>{' '}
              <span className="text-lg font-bold">{totalSelected.toFixed(2)}</span>
              {requiredQuantity && (
                <span className="text-slate-500 ml-2">/ {requiredQuantity} required</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={totalSelected === 0}>
                Confirm Selection
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
