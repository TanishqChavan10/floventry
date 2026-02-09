'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { CREATE_INVENTORY_ADJUSTMENT } from '@/lib/graphql/adjustments';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { toast } from 'sonner';
import { CopyButton } from '@/components/common/CopyButton';

interface NewAdjustmentModalProps {
  warehouseId: string;
  warehouseName: string;
  open: boolean;
  onClose: () => void;
  initialAdjustmentType?: 'IN' | 'OUT';
  initialProductId?: string;
  initialQuantity?: string;
  initialReason?: string;
  initialReference?: string;
}

export default function NewAdjustmentModal({
  warehouseId,
  warehouseName,
  open,
  onClose,
  initialAdjustmentType,
  initialProductId,
  initialQuantity,
  initialReason,
  initialReference,
}: NewAdjustmentModalProps) {
  const { user } = useAuth();

  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('OUT');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  useEffect(() => {
    if (!open) {
      setHasPrefilled(false);
      return;
    }
    if (hasPrefilled) return;

    if (initialAdjustmentType) setAdjustmentType(initialAdjustmentType);
    if (initialProductId) setSelectedProductId(initialProductId);
    if (initialQuantity) setQuantity(initialQuantity);
    if (initialReason) setReason(initialReason);
    if (initialReference) setReference(initialReference);

    if (
      initialAdjustmentType ||
      initialProductId ||
      initialQuantity ||
      initialReason ||
      initialReference
    ) {
      setHasPrefilled(true);
    }
  }, [
    open,
    hasPrefilled,
    initialAdjustmentType,
    initialProductId,
    initialQuantity,
    initialReason,
    initialReference,
  ]);

  // Fetch warehouse stock for product selection
  const { data: stockData, loading: loadingStock } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId },
    skip: !warehouseId,
  });

  const [createAdjustment, { loading: creating }] = useMutation(CREATE_INVENTORY_ADJUSTMENT, {
    onCompleted: () => {
      toast.success('Adjustment created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create adjustment');
    },
  });

  const stock = stockData?.stockByWarehouse || [];
  const selectedStock = stock.find((s: any) => s.product.id === selectedProductId);
  const availableStock = selectedStock ? Number(selectedStock.quantity) : 0;

  const handleSubmit = () => {
    // Validation
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      toast.error('Reason must be at least 3 characters');
      return;
    }
    if (adjustmentType === 'OUT' && Number(quantity) > availableStock) {
      toast.error(`Insufficient stock. Available: ${availableStock}`);
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    try {
      await createAdjustment({
        variables: {
          input: {
            warehouse_id: warehouseId,
            product_id: selectedProductId,
            adjustment_type: adjustmentType,
            quantity: parseFloat(quantity),
            reason: reason.trim(),
            reference: reference.trim() || undefined,
          },
        },
      });
      setShowConfirmDialog(false);
    } catch (error) {
      setShowConfirmDialog(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setSelectedProductId('');
      setQuantity('');
      setReason('');
      setReference('');
      setAdjustmentType('OUT');
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Correct stock levels in {warehouseName}. This action creates a permanent audit record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={(value) => setAdjustmentType(value as 'IN' | 'OUT')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="IN" id="type-in" className="peer sr-only" />
                  <Label
                    htmlFor="type-in"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600 cursor-pointer"
                  >
                    <TrendingUp className="mb-3 h-6 w-6 text-green-600" />
                    <div className="text-center">
                      <div className="font-semibold">Increase Stock</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Add units (found, correction)
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="OUT" id="type-out" className="peer sr-only" />
                  <Label
                    htmlFor="type-out"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer"
                  >
                    <TrendingDown className="mb-3 h-6 w-6 text-red-600" />
                    <div className="text-center">
                      <div className="font-semibold">Decrease Stock</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Remove units (damage, loss)
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="product">
                  <SelectValue
                    placeholder={loadingStock ? 'Loading products...' : 'Select product'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((item: any) => (
                    <SelectItem key={item.product.id} value={item.product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.product.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          Stock: {item.quantity} | SKU: {item.product.sku}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStock && (
                <p className="text-sm text-muted-foreground">
                  Current stock: <span className="font-semibold">{availableStock}</span> units
                  <span className="mx-2">•</span>
                  <span className="font-mono">SKU: {selectedStock.product.sku}</span>
                  <CopyButton
                    value={selectedStock.product.sku}
                    ariaLabel="Copy SKU"
                    successMessage="Copied SKU to clipboard"
                    className="ml-1 h-6 w-6 text-muted-foreground"
                  />
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={adjustmentType === 'OUT' ? availableStock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
              {adjustmentType === 'OUT' && selectedStock && (
                <p className="text-sm text-muted-foreground">Maximum: {availableStock} units</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Physical count correction, Damaged during handling, Found during audit"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 3 characters. Be specific about why this adjustment is needed.
              </p>
            </div>

            {/* Reference (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., Audit Report #123, Incident Report #456"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={creating || loadingStock}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Inventory Adjustment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to create the following adjustment:</p>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className={adjustmentType === 'IN' ? 'text-green-600' : 'text-red-600'}>
                      {adjustmentType === 'IN' ? 'INCREASE' : 'DECREASE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Product:</span>
                    <span>{selectedStock?.product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Quantity:</span>
                    <span
                      className={
                        adjustmentType === 'IN'
                          ? 'text-green-600 font-bold'
                          : 'text-red-600 font-bold'
                      }
                    >
                      {adjustmentType === 'IN' ? '+' : '-'}
                      {quantity} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Current Stock:</span>
                    <span>{availableStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">New Stock:</span>
                    <span className="font-bold">
                      {adjustmentType === 'IN'
                        ? availableStock + parseFloat(quantity || '0')
                        : availableStock - parseFloat(quantity || '0')}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="font-medium">Reason:</span>
                    <p className="text-sm mt-1">{reason}</p>
                  </div>
                  {reference && (
                    <div>
                      <span className="font-medium">Reference:</span>
                      <p className="text-sm mt-1">{reference}</p>
                    </div>
                  )}
                </div>
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ This action cannot be undone and will create a permanent audit record.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={creating}>
              {creating ? 'Creating...' : 'Confirm Adjustment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
